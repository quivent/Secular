//! Convert git repositories to radicle

use anyhow::{anyhow, Result};
use colored::Colorize;
use dialoguer::{Confirm, Select};
use std::path::{Path, PathBuf};
use std::process::Command;
use walkdir::WalkDir;

pub async fn run(repo_path: Option<String>, private: bool, list: bool) -> Result<()> {
    if list {
        return list_available_repos();
    }

    let repo_path = if let Some(path) = repo_path {
        let path_buf = PathBuf::from(&path);

        // Resolve relative paths to absolute
        let absolute_path = if path_buf.is_absolute() {
            path_buf
        } else {
            std::env::current_dir()?.join(&path_buf)
        };

        // Check if path exists
        if !absolute_path.exists() {
            return Err(anyhow!("Error: Path '{}' does not exist", path));
        }

        absolute_path
    } else {
        // Check if current directory is a git repo
        let current_dir = std::env::current_dir()?;
        if current_dir.join(".git").exists() {
            println!("{}", "Found git repository in current directory!".bright_blue().bold());
            println!("  Path: {}", current_dir.display().to_string().blue());
            println!();

            if Confirm::new()
                .with_prompt("Convert this repository?")
                .default(true)
                .interact()?
            {
                current_dir
            } else {
                // User said no, show repository selector
                select_repository()?
            }
        } else {
            // Not in a git repo, show selector
            select_repository()?
        }
    };

    // Validate it's a git repository
    if !repo_path.join(".git").exists() {
        return Err(anyhow!("Error: {} is not a git repository", repo_path.display()));
    }

    let repo_name = repo_path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| anyhow!("Invalid repository path"))?;

    let visibility = if private { "--private" } else { "--public" };
    let visibility_label = if private { "Private" } else { "Public" };

    println!();
    println!("{}", "🔄 Converting repository to Secular/Radicle...".bright_blue().bold());
    println!("  Repository: {}", repo_name.blue());
    println!("  Path: {}", repo_path.display().to_string().blue());
    println!("  Visibility: {}", visibility_label.blue());
    println!();

    // Check if already a radicle repo
    if is_radicle_repo(&repo_path)? {
        println!("{}", "✓ Already a radicle repository".bright_blue());
        inspect_repo(&repo_path)?;
        return Ok(());
    }

    // Confirm conversion
    if !Confirm::new()
        .with_prompt(format!("Convert {} to radicle?", repo_name))
        .default(true)
        .interact()?
    {
        println!("  Conversion cancelled");
        return Ok(());
    }

    // Initialize radicle
    println!("{}", "Step 1/3: Initializing radicle repository...".blue());
    let description = format!("{} repository", repo_name);

    println!("  Running: rad init --name {} --description \"{}\" {}",
             repo_name.dimmed(),
             description.dimmed(),
             visibility.dimmed());
    println!();

    let status = Command::new("rad")
        .arg("init")
        .arg("--name")
        .arg(repo_name)
        .arg("--description")
        .arg(&description)
        .arg(visibility)
        .arg("--no-confirm")
        .current_dir(&repo_path)
        .status()?;

    if !status.success() {
        return Err(anyhow!("Failed to initialize radicle repo"));
    }

    println!();
    println!("  {} Repository initialized", "✓".bright_green().bold());

    // Push to radicle
    println!();
    println!("{}", "Step 2/3: Pushing to radicle network...".blue());
    println!("  Running: git push rad main");
    println!();

    // Try main branch first, then master
    let push_result = Command::new("git")
        .arg("push")
        .arg("rad")
        .arg("main")
        .current_dir(&repo_path)
        .status();

    let push_success = if let Ok(status) = push_result {
        if status.success() {
            true
        } else {
            // Try master branch
            println!();
            println!("  {} Trying master branch...", "→".blue());
            println!("  Running: git push rad master");
            println!();
            let master_status = Command::new("git")
                .arg("push")
                .arg("rad")
                .arg("master")
                .current_dir(&repo_path)
                .status()?;
            master_status.success()
        }
    } else {
        false
    };

    println!();
    if !push_success {
        println!("  {} Warning: Push may have failed, but repo is initialized", "⚠".yellow());
    } else {
        println!("  {} Successfully pushed to network", "✓".bright_green().bold());
    }

    // Step 3: Announce to network
    println!();
    println!("{}", "Step 3/3: Announcing to P2P network...".blue());
    println!("  Running: rad sync --announce");
    println!("  {} This may take a moment while syncing with peers...", "ℹ".blue());
    println!();

    let sync_result = Command::new("rad")
        .arg("sync")
        .arg("--announce")
        .current_dir(&repo_path)
        .status();

    println!();
    if let Ok(status) = sync_result {
        if status.success() {
            println!("  {} Successfully announced to network", "✓".bright_green().bold());
        } else {
            println!("  {} Network announcement timed out (repo is still accessible)", "⚠".yellow());
        }
    } else {
        println!("  {} Could not announce (repo is still accessible locally)", "⚠".yellow());
    }

    // Show repository info
    println!();
    println!("{}", "═══════════════════════════════════════════".bright_blue());
    println!("{}", "✓ CONVERSION COMPLETE!".bright_blue().bold());
    println!("{}", "═══════════════════════════════════════════".bright_blue());
    println!();
    inspect_repo(&repo_path)?;

    // Get node ID
    let node_id = get_node_id()?;

    println!();
    println!("{}", "Share with friends:".bold());
    println!("  Node ID: {}", node_id.blue());
    println!();
    println!("{}", "Friends can clone with:".dimmed());
    println!("  {}", format!("secular repo clone <RID>").dimmed());
    println!();

    Ok(())
}

fn is_radicle_repo(repo_path: &Path) -> Result<bool> {
    let output = Command::new("git")
        .arg("remote")
        .current_dir(repo_path)
        .output()?;

    if !output.status.success() {
        return Ok(false);
    }

    let remotes = String::from_utf8_lossy(&output.stdout);
    Ok(remotes.lines().any(|line| line.trim() == "rad"))
}

fn inspect_repo(repo_path: &Path) -> Result<()> {
    let output = Command::new("rad")
        .arg("inspect")
        .current_dir(repo_path)
        .output()?;

    if output.status.success() {
        let rid = String::from_utf8_lossy(&output.stdout).trim().to_string();
        println!("  RID: {}", rid.bright_blue().bold());
    }

    Ok(())
}

fn get_node_id() -> Result<String> {
    let output = Command::new("rad")
        .arg("self")
        .arg("--nid")
        .output()?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Ok("(run 'rad self --nid' to get Node ID)".to_string())
    }
}

fn list_available_repos() -> Result<()> {
    println!("{}", "Available git repositories:".cyan().bold());
    println!();

    let search_dir = std::env::current_dir()?;
    println!("  Searching in: {}", search_dir.display().to_string().dimmed());
    println!();

    let mut repos = Vec::new();

    // Find all .git directories
    for entry in WalkDir::new(&search_dir)
        .max_depth(3)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_name() == ".git" && entry.file_type().is_dir() {
            if let Some(parent) = entry.path().parent() {
                repos.push(parent.to_path_buf());
            }
        }
    }

    if repos.is_empty() {
        println!("  {}", "No git repositories found".yellow());
        println!();
        println!("  Tip: Run this command from a directory containing git repos");
        return Ok(());
    }

    repos.sort();

    for repo in repos {
        let name = repo.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown");

        let is_rad = is_radicle_repo(&repo).unwrap_or(false);
        let status = if is_rad {
            format!(" {}", "(radicle)".bright_blue())
        } else {
            String::new()
        };

        println!("  • {}{}", name.cyan(), status);
    }

    println!();
    Ok(())
}

fn select_repository() -> Result<PathBuf> {
    let search_dir = std::env::current_dir()?;

    let mut repos = Vec::new();

    // Find all .git directories
    for entry in WalkDir::new(&search_dir)
        .max_depth(3)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_name() == ".git" && entry.file_type().is_dir() {
            if let Some(parent) = entry.path().parent() {
                repos.push(parent.to_path_buf());
            }
        }
    }

    if repos.is_empty() {
        return Err(anyhow!("No git repositories found in current directory. Try running from a directory containing git repos."));
    }

    repos.sort();

    let names: Vec<String> = repos
        .iter()
        .map(|r| {
            let name = r.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();

            let is_rad = is_radicle_repo(r).unwrap_or(false);
            if is_rad {
                format!("{} (radicle)", name)
            } else {
                name
            }
        })
        .collect();

    let selection = Select::new()
        .with_prompt("Select repository to convert")
        .items(&names)
        .default(0)
        .interact()?;

    Ok(repos[selection].clone())
}
