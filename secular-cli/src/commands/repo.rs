//! Repository management commands

use anyhow::{Context, Result};
use clap::Subcommand;
use colored::Colorize;
use std::process::Command;
use walkdir::WalkDir;

#[derive(Subcommand)]
pub enum RepoCommands {
    /// Push changes to a friend
    Push {
        /// Friend's name
        #[arg(short, long)]
        friend: String,

        /// Repository name (e.g., Kamaji)
        #[arg(short, long)]
        repo: Option<String>,

        /// Branch to push (defaults to current branch)
        #[arg(short, long)]
        branch: Option<String>,

        /// Repository path (if not using --repo)
        #[arg(short, long)]
        path: Option<String>,
    },

    /// Pull changes from a friend
    Pull {
        /// Friend's name
        #[arg(short, long)]
        friend: String,

        /// Repository name (e.g., Kamaji)
        #[arg(short, long)]
        repo: Option<String>,

        /// Branch to pull (defaults to current branch)
        #[arg(short, long)]
        branch: Option<String>,

        /// Repository path (if not using --repo)
        #[arg(short, long)]
        path: Option<String>,
    },

    /// Sync with the Radicle network
    Sync {
        /// Repository path (defaults to current directory)
        #[arg(short, long)]
        path: Option<String>,

        /// Announce changes to network
        #[arg(short, long)]
        announce: bool,

        /// Fetch from network
        #[arg(short, long)]
        fetch: bool,
    },

    /// Initialize a Radicle repository
    Init {
        /// Repository name
        #[arg(short, long)]
        name: String,

        /// Repository description
        #[arg(short, long)]
        description: Option<String>,

        /// Make repository private
        #[arg(short = 'P', long)]
        private: bool,

        /// Repository path (defaults to current directory)
        #[arg(short = 'p', long)]
        path: Option<String>,
    },

    /// Clone a repository from a friend
    Clone {
        /// Repository ID (rad:z...) or name (e.g., Kamaji)
        rid_or_name: String,

        /// Clone to specific path
        #[arg(short, long)]
        path: Option<String>,

        /// Seed node to use (Node ID)
        #[arg(short, long)]
        seed: Option<String>,

        /// Friend's name to clone from
        #[arg(short, long)]
        friend: Option<String>,
    },

    /// List repositories
    List {
        /// Show detailed information
        #[arg(short, long)]
        detailed: bool,
    },

    /// Show repository status
    Status {
        /// Repository path (defaults to current directory)
        #[arg(short, long)]
        path: Option<String>,
    },

    /// Publish repository to network (push + announce)
    Publish {
        /// Repository name (e.g., Kamaji)
        #[arg(short, long)]
        repo: Option<String>,

        /// Repository path (if not using --repo)
        #[arg(short, long)]
        path: Option<String>,

        /// Branch to publish (defaults to current branch)
        #[arg(short, long)]
        branch: Option<String>,
    },
}

pub async fn run(cmd: RepoCommands) -> Result<()> {
    match cmd {
        RepoCommands::Push { friend, repo, branch, path } => push_to_friend(&friend, repo, branch, path).await,
        RepoCommands::Pull { friend, repo, branch, path } => pull_from_friend(&friend, repo, branch, path).await,
        RepoCommands::Sync { path, announce, fetch } => sync_repo(path, announce, fetch).await,
        RepoCommands::Init { name, description, private, path } => {
            init_repo(&name, description, private, path).await
        }
        RepoCommands::Clone { rid_or_name, path, seed, friend } => clone_repo(&rid_or_name, path, seed, friend).await,
        RepoCommands::List { detailed } => list_repos(detailed).await,
        RepoCommands::Status { path } => repo_status(path).await,
        RepoCommands::Publish { repo, path, branch } => publish_repo(repo, path, branch).await,
    }
}

async fn push_to_friend(friend: &str, repo: Option<String>, branch: Option<String>, path: Option<String>) -> Result<()> {
    // Determine the working directory
    let working_dir = if let Some(repo_name) = repo {
        // Find repo by name
        find_repo_path(&repo_name)?
    } else if let Some(p) = path {
        Some(p)
    } else {
        None
    };

    let branch = branch.unwrap_or_else(|| get_current_branch().unwrap_or_else(|_| "main".to_string()));

    if let Some(ref dir) = working_dir {
        println!("{}", format!("Pushing to friend '{}'...", friend).blue());
        println!("  Repository: {}", dir.bright_blue());
        println!("  Branch: {}", branch.dimmed());
    } else {
        println!("{}", format!("Pushing to friend '{}'...", friend).blue());
        println!("  Branch: {}", branch.dimmed());
    }

    let mut cmd = Command::new("git");
    cmd.args(&["push", friend, &branch]);

    if let Some(p) = working_dir {
        cmd.current_dir(p);
    }

    let output = cmd.output().context("Failed to execute 'git push'")?;

    if output.status.success() {
        println!("{}", format!("✓ Successfully pushed to '{}'!", friend).bright_blue());
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        if !stdout.is_empty() {
            println!("{}", stdout);
        }
        if !stderr.is_empty() {
            println!("{}", stderr);
        }
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Push failed: {}", error);
    }

    Ok(())
}

async fn pull_from_friend(friend: &str, repo: Option<String>, branch: Option<String>, path: Option<String>) -> Result<()> {
    // Determine the working directory
    let working_dir = if let Some(repo_name) = repo {
        // Find repo by name
        find_repo_path(&repo_name)?
    } else if let Some(p) = path {
        Some(p)
    } else {
        None
    };

    let branch = branch.unwrap_or_else(|| get_current_branch().unwrap_or_else(|_| "main".to_string()));

    if let Some(ref dir) = working_dir {
        println!("{}", format!("Pulling from friend '{}'...", friend).blue());
        println!("  Repository: {}", dir.bright_blue());
        println!("  Branch: {}", branch.dimmed());
    } else {
        println!("{}", format!("Pulling from friend '{}'...", friend).blue());
        println!("  Branch: {}", branch.dimmed());
    }

    let mut cmd = Command::new("git");
    cmd.args(&["pull", friend, &branch]);

    if let Some(p) = working_dir {
        cmd.current_dir(p);
    }

    let output = cmd.output().context("Failed to execute 'git pull'")?;

    if output.status.success() {
        println!("{}", format!("✓ Successfully pulled from '{}'!", friend).bright_blue());
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        if !stdout.is_empty() {
            println!("{}", stdout);
        }
        if !stderr.is_empty() {
            println!("{}", stderr);
        }
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Pull failed: {}", error);
    }

    Ok(())
}

async fn sync_repo(path: Option<String>, announce: bool, fetch: bool) -> Result<()> {
    println!("{}", "Syncing with Radicle network...".blue());

    let mut cmd = Command::new("rad");
    cmd.arg("sync");

    if announce {
        cmd.arg("--announce");
        println!("  Mode: {}", "Announce changes".dimmed());
    }

    if fetch {
        cmd.arg("--fetch");
        println!("  Mode: {}", "Fetch from network".dimmed());
    }

    if let Some(p) = path {
        cmd.current_dir(p);
    }

    let output = cmd.output().context("Failed to execute 'rad sync'")?;

    if output.status.success() {
        println!("{}", "✓ Sync complete!".bright_blue());
        let stdout = String::from_utf8_lossy(&output.stdout);
        if !stdout.is_empty() {
            println!("{}", stdout);
        }
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Sync failed: {}", error);
    }

    Ok(())
}

async fn init_repo(name: &str, description: Option<String>, private: bool, path: Option<String>) -> Result<()> {
    println!("{}", format!("Initializing repository '{}'...", name).blue());

    let mut cmd = Command::new("rad");
    cmd.args(&["init", "--name", name]);

    if let Some(desc) = description {
        cmd.args(&["--description", &desc]);
    }

    if private {
        cmd.arg("--private");
        println!("  Visibility: {}", "Private".yellow());
    } else {
        cmd.arg("--public");
        println!("  Visibility: {}", "Public".bright_blue());
    }

    cmd.arg("--no-confirm");

    if let Some(p) = path {
        cmd.current_dir(p);
    }

    let output = cmd.output().context("Failed to execute 'rad init'")?;

    if output.status.success() {
        println!("{}", format!("✓ Repository '{}' initialized!", name).bright_blue());
        let stdout = String::from_utf8_lossy(&output.stdout);
        if !stdout.is_empty() {
            println!("{}", stdout);
        }
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Initialization failed: {}", error);
    }

    Ok(())
}

async fn clone_repo(rid_or_name: &str, path: Option<String>, seed: Option<String>, friend: Option<String>) -> Result<()> {
    // Determine if it's a RID or a name
    let rid = if rid_or_name.starts_with("rad:") {
        rid_or_name.to_string()
    } else {
        // Try to find RID by repo name from friends or local repos
        if let Some(found_rid) = find_rid_by_name(rid_or_name, friend.as_deref())? {
            println!("  Found: {} -> {}", rid_or_name.bright_blue(), found_rid.dimmed());
            found_rid
        } else {
            anyhow::bail!("Repository '{}' not found. Use the full RID (rad:z...) or add the friend first with: secular friend add", rid_or_name);
        }
    };

    println!("{}", format!("Cloning {}...", rid_or_name).blue());

    let mut cmd = Command::new("rad");
    cmd.args(&["clone", &rid]);

    if let Some(p) = path {
        cmd.args(&["--path", &p]);
    }

    // Resolve seed (can be Node ID or friend name)
    if let Some(s) = seed {
        let node_id = if s.starts_with("z6Mk") || s.starts_with("did:key:") {
            // Already a Node ID
            s
        } else {
            // Try to look up friend by name
            if let Some(nid) = get_friend_node_id(&s)? {
                println!("  Seed: {} -> {}", s.bright_blue(), nid.dimmed());
                nid
            } else {
                anyhow::bail!("Friend '{}' not found. Add them first with: secular friend add --name {} <node-id>", s, s);
            }
        };
        cmd.args(&["--seed", &node_id]);
    }

    let output = cmd.output().context("Failed to execute 'rad clone'")?;

    if output.status.success() {
        println!("{}", "✓ Repository cloned successfully!".bright_blue());
        let stdout = String::from_utf8_lossy(&output.stdout);
        if !stdout.is_empty() {
            println!("{}", stdout);
        }
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Clone failed: {}", error);
    }

    Ok(())
}

async fn list_repos(detailed: bool) -> Result<()> {
    println!("{}", "Repositories:".blue().bold());
    println!();

    let output = Command::new("rad")
        .args(&["ls"])
        .output()
        .context("Failed to execute 'rad ls'")?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Failed to list repositories: {}", error);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut repos = Vec::new();

    // Parse the table - skip headers and borders
    for line in stdout.lines() {
        // Skip table borders and headers
        if line.starts_with('╭') || line.starts_with('├') || line.starts_with('╰')
            || line.contains("Name") || line.contains("───")
            || line.trim() == "│" || line.trim().is_empty() {
            continue;
        }

        // Parse data rows: │ Name  RID  Visibility  Head  Description │
        if line.contains('│') {
            let parts: Vec<&str> = line.split('│').collect();
            if parts.len() >= 2 {
                let data = parts[1].trim();
                if !data.is_empty() {
                    let fields: Vec<&str> = data.split_whitespace().collect();
                    if fields.len() >= 3 {
                        let name = fields[0];
                        let rid = fields[1];
                        let visibility = if fields.len() > 2 { fields[2] } else { "private" };

                        repos.push((name, rid, visibility));
                    }
                }
            }
        }
    }

    if repos.is_empty() {
        println!("  {}", "No repositories found".yellow());
        println!();
        println!("{}", "Initialize a repository with:".dimmed());
        println!("  secular repos init --name my-project");
        return Ok(());
    }

    for (name, rid, visibility) in repos.iter() {
        if detailed {
            let vis_color = if *visibility == "private" { "🔒".to_string() } else { "🌐".to_string() };
            println!("  {} {} {}", "●".bright_blue(), name.bold(), vis_color);
            println!("    RID: {}", rid.dimmed());
        } else {
            let vis_indicator = if *visibility == "private" { "🔒" } else { "🌐" };
            println!("  {} {} {}", "●".bright_blue(), name, vis_indicator);
        }
    }

    println!();
    println!("{}", format!("Total: {} repository(ies)", repos.len()).dimmed());
    println!();
    println!("{}", "Push to friend:".blue().bold());
    println!("  secular repos push --friend <friend-name>");
    println!();
    println!("{}", "Sync to network:".blue().bold());
    println!("  secular repos sync --announce");

    Ok(())
}

async fn repo_status(path: Option<String>) -> Result<()> {
    println!("{}", "Repository Status:".blue().bold());

    let mut cmd = Command::new("rad");
    cmd.args(&["inspect"]);

    if let Some(p) = &path {
        cmd.current_dir(p);
    }

    let output = cmd.output().context("Failed to execute 'rad inspect'")?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        println!("{}", stdout);
    } else {
        println!("  {}", "Not a Radicle repository".yellow());
        println!("\n{}", "Initialize with:".dimmed());
        println!("  secular repo init --name my-project");
    }

    // Also show git status
    println!("\n{}", "Git Status:".blue().bold());
    let mut git_cmd = Command::new("git");
    git_cmd.args(&["status", "--short"]);

    if let Some(p) = path {
        git_cmd.current_dir(p);
    }

    let git_output = git_cmd.output().context("Failed to execute 'git status'")?;

    if git_output.status.success() {
        let stdout = String::from_utf8_lossy(&git_output.stdout);
        if stdout.trim().is_empty() {
            println!("  {}", "Working tree clean".bright_blue());
        } else {
            println!("{}", stdout);
        }
    }

    Ok(())
}

async fn publish_repo(repo: Option<String>, path: Option<String>, branch: Option<String>) -> Result<()> {
    // Determine the working directory
    let working_dir = if let Some(repo_name) = repo {
        find_repo_path(&repo_name)?
    } else if let Some(p) = path {
        Some(p)
    } else {
        None
    };

    let branch = branch.unwrap_or_else(|| get_current_branch().unwrap_or_else(|_| "main".to_string()));

    println!("{}", "Publishing repository to network...".blue().bold());
    if let Some(ref dir) = working_dir {
        println!("  Repository: {}", dir.bright_blue());
    }
    println!("  Branch: {}", branch.dimmed());
    println!();

    // Step 1: Push to rad remote
    println!("{}", "Step 1/2: Pushing to Radicle...".blue());
    let mut push_cmd = Command::new("git");
    push_cmd.args(&["push", "rad", &branch]);

    if let Some(ref p) = working_dir {
        push_cmd.current_dir(p);
    }

    let push_output = push_cmd.output().context("Failed to execute 'git push rad'")?;

    if !push_output.status.success() {
        let error = String::from_utf8_lossy(&push_output.stderr);
        anyhow::bail!("Push failed: {}", error);
    }
    println!("  {} Pushed", "✓".bright_blue());

    // Step 2: Announce to network
    println!();
    println!("{}", "Step 2/2: Announcing to network...".blue());
    let mut announce_cmd = Command::new("rad");
    announce_cmd.args(&["sync", "--announce"]);

    if let Some(ref p) = working_dir {
        announce_cmd.current_dir(p);
    }

    let announce_output = announce_cmd.output();

    if let Ok(output) = announce_output {
        if output.status.success() {
            println!("  {} Announced", "✓".bright_blue());
        } else {
            println!("  {} Network announcement timed out (repo is still accessible)", "⚠".yellow());
        }
    }

    // Get RID and Node ID
    println!();
    println!("{}", "═══════════════════════════════════════════".bright_blue());
    println!("{}", "✓ PUBLISHED TO NETWORK!".bright_blue().bold());
    println!("{}", "═══════════════════════════════════════════".bright_blue());
    println!();

    // Get RID
    let mut inspect_cmd = Command::new("rad");
    inspect_cmd.arg("inspect");
    if let Some(ref p) = working_dir {
        inspect_cmd.current_dir(p);
    }

    if let Ok(output) = inspect_cmd.output() {
        if output.status.success() {
            let rid = String::from_utf8_lossy(&output.stdout).trim().to_string();
            println!("  RID: {}", rid.bright_blue().bold());
        }
    }

    // Get Node ID
    let node_output = Command::new("rad")
        .args(&["node", "status", "--only", "nid"])
        .output();

    if let Ok(output) = node_output {
        if output.status.success() {
            let nid = String::from_utf8_lossy(&output.stdout).trim().to_string();
            println!("  Your Node ID: {}", nid.blue());
        }
    }

    println!();
    println!("{}", "Friends can clone with:".dimmed());
    println!("  secular repos clone <RID> --seed <YOUR_NODE_ID>");
    println!();

    Ok(())
}

// Helper to get friend's Node ID by name
fn get_friend_node_id(friend_name: &str) -> Result<Option<String>> {
    let output = Command::new("rad")
        .args(&["remote", "list"])
        .output();

    if let Ok(out) = output {
        if out.status.success() {
            let stdout = String::from_utf8_lossy(&out.stdout);
            for line in stdout.lines() {
                // Format: "name z6Mk... (fetch)" or "name did:key:z6Mk... (fetch)"
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 && parts[0] == friend_name {
                    // Extract Node ID (strip did:key: prefix if present)
                    let node_id = parts[1];
                    let clean_nid = if node_id.starts_with("did:key:") {
                        node_id.strip_prefix("did:key:").unwrap_or(node_id)
                    } else {
                        node_id
                    };
                    return Ok(Some(clean_nid.to_string()));
                }
            }
        }
    }

    Ok(None)
}

// Helper to find RID by repo name
fn find_rid_by_name(name: &str, friend: Option<&str>) -> Result<Option<String>> {
    // First, check local repos
    let list_output = Command::new("rad")
        .args(&["ls"])
        .output();

    if let Ok(output) = list_output {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if line.contains(name) && line.contains("rad:") {
                    // Parse RID from line
                    if let Some(start) = line.find("rad:") {
                        let rid_part = &line[start..];
                        if let Some(rid) = rid_part.split_whitespace().next() {
                            return Ok(Some(rid.to_string()));
                        }
                    }
                }
            }
        }
    }

    // If friend specified, we could search their repos
    // For now, return None if not found
    Ok(None)
}

// Helper function to find repo path by name
fn find_repo_path(repo_name: &str) -> Result<Option<String>> {
    // Use rad path command to find the repo working directory
    let output = Command::new("rad")
        .args(&["path", "--repo", repo_name])
        .output();

    if let Ok(out) = output {
        if out.status.success() {
            let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !path.is_empty() {
                return Ok(Some(path));
            }
        }
    }

    // If rad path doesn't work, search in current directory tree
    let current = std::env::current_dir()?;

    for entry in WalkDir::new(&current)
        .max_depth(3)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_dir() && entry.file_name() == repo_name {
            if entry.path().join(".git").exists() {
                return Ok(Some(entry.path().to_string_lossy().to_string()));
            }
        }
    }

    anyhow::bail!("Repository '{}' not found. Try using --path instead.", repo_name)
}

// Helper function to get current git branch
fn get_current_branch() -> Result<String> {
    let output = Command::new("git")
        .args(&["rev-parse", "--abbrev-ref", "HEAD"])
        .output()
        .context("Failed to get current branch")?;

    if output.status.success() {
        let branch = String::from_utf8_lossy(&output.stdout);
        Ok(branch.trim().to_string())
    } else {
        anyhow::bail!("Not in a git repository")
    }
}
