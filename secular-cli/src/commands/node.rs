//! Node management commands

use anyhow::Result;
use clap::Subcommand;
use colored::Colorize;
use std::process::Command;

#[derive(Subcommand)]
pub enum NodeCommands {
    /// Start the secular node
    Start {
        /// Port to listen on
        #[arg(short, long, default_value = "8776")]
        port: u16,

        /// Enable debug logging
        #[arg(long)]
        debug: bool,
    },

    /// Stop the secular node
    Stop,

    /// Restart the secular node
    Restart,

    /// Show node status
    Status,

    /// List connected peers
    Peers {
        /// Show detailed peer information
        #[arg(short, long)]
        detailed: bool,
    },

    /// List repositories
    Repos,

    /// Show storage information
    Storage {
        /// Show detailed storage breakdown
        #[arg(short, long)]
        detailed: bool,
    },

    /// Show node logs
    Logs {
        /// Follow logs in real-time
        #[arg(short, long)]
        follow: bool,

        /// Number of lines to show
        #[arg(short, long, default_value = "100")]
        lines: usize,
    },

    /// Announce repositories to the network
    Announce {
        /// Repository path (defaults to current directory)
        #[arg(short, long)]
        path: Option<String>,
    },
}

pub async fn run(cmd: NodeCommands) -> Result<()> {
    match cmd {
        NodeCommands::Start { port, debug } => start_node(port, debug).await,
        NodeCommands::Stop => stop_node().await,
        NodeCommands::Restart => restart_node().await,
        NodeCommands::Status => node_status().await,
        NodeCommands::Peers { detailed } => list_peers(detailed).await,
        NodeCommands::Repos => list_repos().await,
        NodeCommands::Storage { detailed } => show_storage(detailed).await,
        NodeCommands::Logs { follow, lines } => show_logs(follow, lines).await,
        NodeCommands::Announce { path } => announce_repos(path).await,
    }
}

async fn start_node(port: u16, debug: bool) -> Result<()> {
    println!("{}", "Starting secular node...".cyan());

    // Check if already running
    if is_node_running()? {
        println!("{}", "Node is already running".yellow());
        return Ok(());
    }

    // Start via systemd if available, otherwise direct
    if is_systemd_available()? {
        Command::new("sudo")
            .args(&["systemctl", "start", "secular-node"])
            .status()?;

        println!("{}", "✓ Node started via systemd".green());
    } else {
        // Start directly
        let mut cmd = Command::new("radicle-node");
        cmd.arg("--listen").arg(format!("0.0.0.0:{}", port));

        if debug {
            cmd.env("RUST_LOG", "debug");
        }

        cmd.spawn()?;
        println!("{}", format!("✓ Node started on port {}", port).green());
    }

    Ok(())
}

async fn stop_node() -> Result<()> {
    println!("{}", "Stopping secular node...".cyan());

    if is_systemd_available()? {
        Command::new("sudo")
            .args(&["systemctl", "stop", "secular-node"])
            .status()?;
    } else {
        // Find and kill process
        Command::new("pkill")
            .arg("-f")
            .arg("radicle-node")
            .status()?;
    }

    println!("{}", "✓ Node stopped".green());
    Ok(())
}

async fn restart_node() -> Result<()> {
    stop_node().await?;
    tokio::time::sleep(std::time::Duration::from_secs(2)).await;
    start_node(8776, false).await?;
    Ok(())
}

async fn node_status() -> Result<()> {
    println!("{}", "Node Status:".cyan().bold());

    if is_systemd_available()? {
        let output = Command::new("systemctl")
            .args(&["status", "secular-node", "--no-pager"])
            .output()?;

        println!("{}", String::from_utf8_lossy(&output.stdout));
    } else if is_node_running()? {
        println!("  Status: {}", "Running".green());

        // Try to get process info
        let output = Command::new("ps")
            .args(&["aux"])
            .output()?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            if line.contains("radicle-node") && !line.contains("grep") {
                println!("  {}", line);
            }
        }
    } else {
        println!("  Status: {}", "Not running".red());
    }

    Ok(())
}

async fn list_peers(detailed: bool) -> Result<()> {
    println!("{}", "Connected Peers:".cyan().bold());

    // This would integrate with radicle-node API
    // For now, show placeholder
    println!("  {} peer(s) connected", "0".yellow());

    if detailed {
        println!("\n  (No peers connected)");
    }

    Ok(())
}

async fn list_repos() -> Result<()> {
    println!("{}", "Repositories:".cyan().bold());

    // This would integrate with radicle-node API
    println!("  {} repository(ies)", "0".yellow());

    Ok(())
}

async fn show_storage(detailed: bool) -> Result<()> {
    use std::process::Command;

    println!("{}", "Storage Information:".cyan().bold());

    let data_dir = "/var/lib/secular";

    // Get disk usage
    let output = Command::new("du")
        .args(&["-sh", data_dir])
        .output()?;

    let usage = String::from_utf8_lossy(&output.stdout);
    if let Some(size) = usage.split_whitespace().next() {
        println!("  Total size: {}", size.cyan());
    }

    if detailed {
        println!("\n{}", "Breakdown:".dimmed());

        let output = Command::new("du")
            .args(&["-h", "--max-depth=1", data_dir])
            .output()?;

        println!("{}", String::from_utf8_lossy(&output.stdout));
    }

    Ok(())
}

async fn show_logs(follow: bool, lines: usize) -> Result<()> {
    if is_systemd_available()? {
        let mut cmd = Command::new("journalctl");
        cmd.args(&["-u", "secular-node", "-n", &lines.to_string()]);

        if follow {
            cmd.arg("-f");
        }

        cmd.status()?;
    } else {
        // Try to find log file
        let log_file = "/var/log/secular/node.log";
        if std::path::Path::new(log_file).exists() {
            let mut cmd = Command::new("tail");
            cmd.args(&["-n", &lines.to_string()]);

            if follow {
                cmd.arg("-f");
            }

            cmd.arg(log_file);
            cmd.status()?;
        } else {
            println!("{}", "No logs found".yellow());
        }
    }

    Ok(())
}

// Helper functions
fn is_systemd_available() -> Result<bool> {
    Ok(which::which("systemctl").is_ok())
}

fn is_node_running() -> Result<bool> {
    let output = Command::new("pgrep")
        .args(&["-f", "radicle-node"])
        .output()?;

    Ok(output.status.success())
}

async fn announce_repos(path: Option<String>) -> Result<()> {
    use anyhow::Context;

    println!("{}", "Announcing repositories to the network...".cyan().bold());

    // Make sure node is running first
    if !is_node_running()? {
        println!("{}", "Error: Node is not running".red());
        println!("\n{}", "Start the node first:".dimmed());
        println!("  secular node start");
        anyhow::bail!("Node not running");
    }

    // Change to repo directory if specified
    let original_dir = std::env::current_dir()?;
    if let Some(ref p) = path {
        std::env::set_current_dir(p)
            .context(format!("Failed to change to directory: {}", p))?;
    }

    // Run rad sync --announce
    println!("\n{}", "Running: rad sync --announce".dimmed());
    let output = Command::new("rad")
        .args(&["sync", "--announce"])
        .output()
        .context("Failed to execute 'rad sync --announce'")?;

    // Restore directory
    if path.is_some() {
        std::env::set_current_dir(original_dir)?;
    }

    if output.status.success() {
        println!("\n{}", "✓ Repositories announced successfully!".green().bold());

        // Show output
        let stdout = String::from_utf8_lossy(&output.stdout);
        if !stdout.trim().is_empty() {
            println!("\n{}", stdout.trim());
        }

        println!("\n{}", "Your repositories are now discoverable on the network".dimmed());
        println!("{}", "Friends can clone using your Node ID and the repository RID".dimmed());
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);

        println!("\n{}", "Failed to announce repositories".red());

        if !stderr.trim().is_empty() {
            println!("\n{}", "Error:".red());
            println!("{}", stderr.trim());
        }
        if !stdout.trim().is_empty() {
            println!("{}", stdout.trim());
        }

        println!("\n{}", "Troubleshooting:".yellow().bold());
        println!("  • Make sure you're in a Radicle repository directory");
        println!("  • Ensure the repository is initialized: rad inspect");
        println!("  • Try pushing first: git push rad");

        anyhow::bail!("Announcement failed");
    }

    Ok(())
}
