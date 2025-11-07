//! Peer management commands

use anyhow::{Context, Result};
use clap::Subcommand;
use colored::Colorize;

// Use blue theme throughout
const PRIMARY_COLOR: &str = "blue";
const SUCCESS_COLOR: &str = "bright blue";
const ACCENT_COLOR: &str = "cyan";
use std::process::Command;

#[derive(Subcommand)]
pub enum PeerCommands {
    /// List all peers
    List {
        /// Show detailed information
        #[arg(short, long)]
        detailed: bool,
    },

    /// Show all peers including live connections
    All,

    /// Add a peer by their Node ID
    Add {
        /// Friendly name for this peer
        #[arg(short, long)]
        name: String,

        /// Peer's Node ID (did:key:z6Mk... or z6Mk...)
        node_id: String,
    },

    /// Peer-specific commands: secular peer <NAME> <action>
    #[command(external_subcommand)]
    PeerAction(Vec<String>),
}

pub async fn run(cmd: PeerCommands) -> Result<()> {
    match cmd {
        PeerCommands::List { detailed } => list_peers(detailed).await,
        PeerCommands::All => list_all_peers().await,
        PeerCommands::Add { node_id, name } => add_peer(&node_id, &name).await,
        PeerCommands::PeerAction(args) => {
            if args.is_empty() {
                anyhow::bail!("Usage: secular peer <NAME> [status|repos|remove]");
            }

            let peer_name = &args[0];

            // If no action specified, show full peer details
            if args.len() == 1 {
                return peer_details(peer_name).await;
            }

            let action = &args[1];
            match action.as_str() {
                "status" => peer_status(peer_name).await,
                "repos" => list_peer_repos(peer_name).await,
                "remove" => remove_peer(peer_name).await,
                _ => anyhow::bail!("Unknown action '{}'. Use: status, repos, or remove", action),
            }
        }
    }
}

async fn add_peer(node_id: &str, name: &str) -> Result<()> {
    println!("{}", format!("Adding peer '{}'...", name).blue());

    // Trim whitespace/newlines from Node ID
    let node_id = node_id.trim();

    // Validate Node ID format
    if !node_id.starts_with("did:key:z6Mk") && !node_id.starts_with("z6Mk") {
        anyhow::bail!("Invalid Node ID format. Should start with 'did:key:z6Mk' or 'z6Mk'");
    }

    // Validate name (alphanumeric, dashes, underscores only)
    if !name.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
        anyhow::bail!("Invalid peer name. Use only letters, numbers, dashes, and underscores.");
    }

    // Check if peer already exists
    let list_output = Command::new("rad")
        .args(&["remote", "list"])
        .output()
        .context("Failed to execute 'rad remote list'")?;

    if list_output.status.success() {
        let stdout = String::from_utf8_lossy(&list_output.stdout);
        for line in stdout.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 && parts[0] == name {
                // Get node ID and clean it (remove (fetch), (push), etc.)
                let existing_node_id_raw = parts[1..].join(" ");
                let existing_node_id = existing_node_id_raw
                    .replace("(fetch)", "")
                    .replace("(push)", "")
                    .trim()
                    .to_string();

                if existing_node_id == node_id {
                    // Already exists with same node ID - idempotent success
                    println!("{}", format!("✓ Peer '{}' already exists with this Node ID", name).bright_blue().bold());
                    println!("  Node ID: {}", node_id.dimmed());
                    return Ok(());
                } else {
                    // Exists but with different node ID
                    println!("{}", format!("⚠ Peer '{}' already exists with a different Node ID:", name).yellow());
                    println!("  Existing: {}", existing_node_id.dimmed());
                    println!("  Provided: {}", node_id.dimmed());
                    println!("\n{}", "Remove it first with:".dimmed());
                    println!("  {}", format!("secular peer remove {}", name).cyan());
                    return Ok(());
                }
            }
        }
    }

    // Add remote using rad CLI
    let output = Command::new("rad")
        .args(&["remote", "add", node_id, "--name", name])
        .output()
        .context("Failed to execute 'rad remote add'. Is Radicle CLI installed?")?;

    if output.status.success() {
        println!("{}", format!("✓ Peer '{}' added!", name).bright_blue().bold());
        println!("  Node ID: {}", node_id.dimmed());
        println!("\n{}", "You can now push/pull with:".dimmed());
        println!("  {}", format!("secular repos push --peer {}", name).cyan());
        println!("  {}", format!("secular repos pull --peer {}", name).cyan());
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Failed to add peer: {}", error);
    }

    Ok(())
}

async fn remove_peer(name: &str) -> Result<()> {
    println!("{}", format!("Removing peer '{}'...", name).blue());

    // Confirm removal
    print!("Are you sure you want to remove peer '{}'? (y/N): ", name);
    use std::io::{self, Write};
    io::stdout().flush()?;

    let mut input = String::new();
    io::stdin().read_line(&mut input)?;

    if !input.trim().eq_ignore_ascii_case("y") {
        println!("{}", "Cancelled".yellow());
        return Ok(());
    }

    // Remove remote using rad CLI
    let output = Command::new("rad")
        .args(&["remote", "rm", name])
        .output()
        .context("Failed to execute 'rad remote rm'")?;

    if output.status.success() {
        println!("{}", format!("✓ Peer '{}' removed", name).bright_blue().bold());
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Failed to remove peer: {}", error);
    }

    Ok(())
}

async fn list_peers(detailed: bool) -> Result<()> {
    println!("{}", "Peers:".bright_blue().bold());

    // List remotes using rad CLI
    let output = Command::new("rad")
        .args(&["remote", "list"])
        .output()
        .context("Failed to execute 'rad remote list'")?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Failed to list peers: {}", error);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let lines: Vec<&str> = stdout.lines().filter(|l| !l.trim().is_empty()).collect();

    if lines.is_empty() {
        println!("  {}", "No peers added yet".yellow());
        println!("\n{}", "Add a peer with:".dimmed());
        println!("  {}", "secular peer add --name alice did:key:z6Mk...".cyan());
        return Ok(());
    }

    for line in lines.iter() {
        // Parse line format: "name node_id"
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
            let name = parts[0];
            let node_id = parts[1..].join(" ");

            if detailed {
                println!("\n  {} {}", "●".blue(), name.bold());
                println!("    Node ID: {}", node_id.dimmed());
            } else {
                println!("  {} {}", "●".blue(), name.cyan());
            }
        } else {
            println!("  {}", line.cyan());
        }
    }

    println!("\n{}", format!("Total: {} peer(s)", lines.len()).dimmed());

    Ok(())
}

async fn peer_details(name: &str) -> Result<()> {
    println!("{}", format!("Peer: {}", name).bright_blue().bold());

    // Check if remote exists
    let output = Command::new("rad")
        .args(&["remote", "list"])
        .output()
        .context("Failed to execute 'rad remote list'")?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let peer_info = stdout.lines().find(|line| {
        line.split_whitespace().next() == Some(name)
    });

    if peer_info.is_none() {
        println!("  {}", "Not configured".cyan());
        println!("\n{}", "Add this peer with:".dimmed());
        println!("  {}", format!("secular peer add --name {} <node-id>", name).cyan());
        return Ok(());
    }

    // Extract node ID and clean it
    let parts: Vec<&str> = peer_info.unwrap().split_whitespace().collect();
    let node_id_raw = if parts.len() >= 2 {
        parts[1..].join(" ")
    } else {
        "unknown".to_string()
    };
    let node_id = node_id_raw
        .replace("(fetch)", "")
        .replace("(push)", "")
        .trim()
        .to_string();

    println!("\n{}", "Configuration:".cyan());
    println!("  Status: {}", "Added to remotes".bright_blue());
    println!("  Node ID: {}", node_id.dimmed());

    // Check live connection status
    let mut is_connected = false;
    let node_output = Command::new("rad")
        .args(&["node", "status"])
        .output();

    if let Ok(output) = node_output {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            println!("\n{}", "Live Status:".cyan());
            if stdout.contains(&node_id) || stdout.contains(name) {
                println!("  Connection: {}", "Currently connected".bright_blue());
                is_connected = true;
            } else {
                println!("  Connection: {}", "Not currently connected".cyan());

                // Attempt automatic connection
                println!("\n{}", "Attempting to connect...".blue());
                let sync_output = Command::new("rad")
                    .args(&["sync", "--seed", &node_id])
                    .output();

                if let Ok(sync_result) = sync_output {
                    if sync_result.status.success() {
                        println!("  {}", "✓ Connection established!".bright_blue().bold());
                        is_connected = true;

                        // Verify connection was successful
                        let verify_output = Command::new("rad")
                            .args(&["node", "status"])
                            .output();

                        if let Ok(verify) = verify_output {
                            if verify.status.success() {
                                let verify_stdout = String::from_utf8_lossy(&verify.stdout);
                                if verify_stdout.contains(&node_id) || verify_stdout.contains(name) {
                                    println!("  Connection: {}", "Currently connected".bright_blue());
                                }
                            }
                        }
                    } else {
                        let stderr = String::from_utf8_lossy(&sync_result.stderr);
                        let stdout = String::from_utf8_lossy(&sync_result.stdout);

                        if !stderr.is_empty() {
                            println!("  {}", format!("Connection failed: {}", stderr.trim()).cyan());
                        } else if !stdout.is_empty() {
                            println!("  {}", format!("Connection failed: {}", stdout.trim()).cyan());
                        } else {
                            println!("  {}", "Connection failed (no error details)".cyan());
                        }

                        println!("  {}", "You may need to manually connect".dimmed());
                    }
                } else {
                    println!("  {}", "Failed to execute connection command".yellow());
                }
            }
        }
    }

    println!("\n{}", "Actions:".cyan());
    if is_connected {
        println!("  {} - Show connection status", format!("secular peer {} status", name).cyan());
        println!("  {} - List repositories", format!("secular peer {} repos", name).cyan());
        println!("  {} - Remove this peer", format!("secular peer {} remove", name).cyan());
    } else {
        println!("  {} - Connect and sync", format!("secular repos push --peer {}", name).cyan());
        println!("  {} - Connect and fetch", format!("secular repos pull --peer {}", name).cyan());
        println!("  {} - Remove this peer", format!("secular peer {} remove", name).cyan());
    }

    Ok(())
}

async fn peer_status(name: &str) -> Result<()> {
    println!("{}", format!("Peer Status: {}", name).bright_blue().bold());

    // Check if remote exists
    let output = Command::new("rad")
        .args(&["remote", "list"])
        .output()
        .context("Failed to execute 'rad remote list'")?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let peer_info = stdout.lines().find(|line| {
        line.split_whitespace().next() == Some(name)
    });

    if peer_info.is_none() {
        println!("  {}", "Peer not configured".cyan());
        println!("\n{}", "Add this peer with:".dimmed());
        println!("  {}", format!("secular peer add --name {} <node-id>", name).cyan());
        return Ok(());
    }

    // Extract node ID and clean it
    let parts: Vec<&str> = peer_info.unwrap().split_whitespace().collect();
    let node_id_raw = if parts.len() >= 2 {
        parts[1..].join(" ")
    } else {
        "unknown".to_string()
    };
    let node_id = node_id_raw
        .replace("(fetch)", "")
        .replace("(push)", "")
        .trim()
        .to_string();

    println!("  Configuration: {}", "Added to remotes".bright_blue());
    println!("  Node ID: {}", node_id.dimmed());

    // Try to get more info from rad node status
    let node_output = Command::new("rad")
        .args(&["node", "status"])
        .output();

    if let Ok(output) = node_output {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            // Check if this peer appears in connected peers
            if stdout.contains(&node_id) || stdout.contains(name) {
                println!("  Live Status: {}", "Currently connected".bright_blue());
            } else {
                println!("  Live Status: {}", "Not currently connected".yellow());
                println!("\n{}", "Tip: Try syncing to establish connection:".dimmed());
                println!("  {}", format!("secular repos push --peer {}", name).cyan());
            }
        }
    }

    Ok(())
}

async fn list_peer_repos(name: &str) -> Result<()> {
    println!("{}", format!("Repositories from '{}':", name).bright_blue().bold());

    // First, get the peer's node ID from remotes
    let output = Command::new("rad")
        .args(&["remote", "list"])
        .output()
        .context("Failed to execute 'rad remote list'")?;

    if !output.status.success() {
        anyhow::bail!("Failed to list remotes");
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut peer_node_id: Option<String> = None;

    for line in stdout.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 && parts[0] == name {
            peer_node_id = Some(parts[1].to_string());
            break;
        }
    }

    let node_id = match peer_node_id {
        Some(id) => id,
        None => {
            println!("  {}", format!("Peer '{}' not found", name).cyan());
            println!("\n{}", "Add this peer first with:".dimmed());
            println!("  {}", format!("secular peer add --name {} <node-id>", name).cyan());
            return Ok(());
        }
    };

    println!("  Peer Node: {}\n", node_id.dimmed());

    // Try to track repos from this node
    // First, check what repos they might be sharing via rad ls
    let ls_output = Command::new("rad")
        .args(&["ls", "--replicas"])
        .output()
        .context("Failed to execute 'rad ls'")?;

    if !ls_output.status.success() {
        println!("  {}", "Unable to query repositories".yellow());
        println!("\n{}", "Make sure:".dimmed());
        println!("  {}", "• Your Radicle node is running (secular node start)".cyan());
        println!("  {}", "• You're connected to your peer's node".cyan());
        return Ok(());
    }

    let ls_stdout = String::from_utf8_lossy(&ls_output.stdout);
    let lines: Vec<&str> = ls_stdout.lines().collect();

    // Parse the repo list, filtering for ones that have replicas from this peer
    let mut found_repos = Vec::new();

    for line in lines.iter() {
        // Look for lines containing the peer's node ID
        if line.contains(&node_id) || line.contains(name) {
            // Extract the repo info (name, RID)
            if line.contains("rad:") {
                found_repos.push(line.to_string());
            }
        }
    }

    if found_repos.is_empty() {
        // Try alternative: show all repos and let user know which ones might be from peer
        println!("  {}", "No repositories currently tracked from this peer".yellow());
        println!("\n{}", "To clone a repository from this peer:".dimmed());
        println!("  {}", format!("secular repos clone <rid> --seed {}", node_id).cyan());
        println!("\n{}", "Example:".dimmed());
        println!("  {}", format!("secular repos clone rad:z4A1... --seed {}", node_id).cyan());
    } else {
        println!("  {} repository/repositories:\n", found_repos.len());
        for repo_line in found_repos {
            println!("  {}", repo_line.cyan());
        }
        println!("\n{}", "To clone:".dimmed());
        println!("  {}", "secular repos clone <rid>".cyan());
    }

    Ok(())
}

async fn list_all_peers() -> Result<()> {
    println!("{}", "=== CONFIGURED PEERS ===".bright_blue().bold());

    // List configured remotes using rad CLI
    let output = Command::new("rad")
        .args(&["remote", "list"])
        .output()
        .context("Failed to execute 'rad remote list'")?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<&str> = stdout.lines().filter(|l| !l.trim().is_empty()).collect();

        if lines.is_empty() {
            println!("  {}", "No peers configured yet".yellow());
        } else {
            for line in lines.iter() {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    let name = parts[0];
                    let node_id = parts[1..].join(" ")
                        .replace("(fetch)", "")
                        .replace("(push)", "")
                        .trim()
                        .to_string();

                    println!("  {} {}", "●".blue(), name.bold());
                    println!("    {}", node_id.dimmed());
                } else {
                    println!("  {}", line.cyan());
                }
            }
            println!("\n{}", format!("Total: {} peer(s) configured", lines.len()).dimmed());
        }
    } else {
        println!("  {}", "Failed to list configured peers".yellow());
    }

    println!("\n{}", "=== LIVE NETWORK CONNECTIONS ===".bright_blue().bold());

    // Get live node status
    let node_output = Command::new("rad")
        .args(&["node", "status"])
        .output();

    if let Ok(output) = node_output {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let lines: Vec<&str> = stdout.lines().collect();

            let mut found_connections = false;
            let mut connection_count = 0;

            for (i, line) in lines.iter().enumerate() {
                // Look for connection table headers
                if line.contains("Node ID") && line.contains("Address") {
                    found_connections = true;
                    println!("\n{}", "Connected Nodes:".cyan());

                    // Skip the separator line and start processing connections
                    for conn_line in lines.iter().skip(i + 2) {
                        if conn_line.trim().is_empty() {
                            break;
                        }

                        // Skip separator lines and box drawing
                        if conn_line.contains("─") || conn_line.contains("╭") || conn_line.contains("╰") {
                            continue;
                        }

                        // Extract data from table rows (starts with │)
                        if conn_line.contains("│") {
                            // Remove box drawing characters and parse
                            let cleaned = conn_line.replace("│", "").trim().to_string();
                            let parts: Vec<&str> = cleaned.split_whitespace().collect();

                            if parts.len() >= 2 {
                                let nid = parts[0];
                                let address = parts[1];

                                // Check for connected status (✓ symbol in the line)
                                let status_icon = if conn_line.contains("✓") {
                                    "✓".bright_blue()
                                } else {
                                    "○".dimmed()
                                };

                                println!("  {} {} ({})", status_icon, nid.cyan(), address.dimmed());
                                connection_count += 1;
                            }
                        }
                    }
                    break;
                }
            }

            if !found_connections {
                println!("  {}", "No live connections detected".yellow());
                println!("\n{}", "Tip: Make sure your Radicle node is running:".dimmed());
                println!("  {}", "secular node start".cyan());
            } else {
                println!("\n{}", format!("Total: {} live connection(s)", connection_count).dimmed());
            }
        } else {
            println!("  {}", "Failed to get node status".yellow());
            println!("\n{}", "Make sure your Radicle node is running:".dimmed());
            println!("  {}", "secular node start".cyan());
        }
    } else {
        println!("  {}", "Failed to execute 'rad node status'".yellow());
    }

    Ok(())
}
