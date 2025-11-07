//! Initialize secular node

use anyhow::Result;
use colored::Colorize;
use dialoguer::{Confirm, Input};
use std::fs;
use std::path::PathBuf;

pub async fn run(path: Option<String>, no_scan: bool) -> Result<()> {
    println!("{}", "🎬 Initializing Secular...".cyan().bold());
    println!();

    let data_dir = determine_data_dir(path)?;
    println!("  Data directory: {}", data_dir.display().to_string().cyan());

    // Create directory structure
    create_directory_structure(&data_dir)?;

    // Initialize configuration
    create_config(&data_dir)?;

    // Setup secret scanning
    if !no_scan {
        setup_secret_scanning(&data_dir)?;
    }

    // Setup git hooks (if in git repo)
    if is_git_repo()? {
        setup_git_hooks()?;
    }

    println!();
    println!("{}", "✓ Secular initialized successfully!".green().bold());
    println!();
    println!("Next steps:");
    println!("  1. Start node: {}", "sec node start".cyan());
    println!("  2. Scan for secrets: {}", "sec scan".cyan());
    println!("  3. Monitor costs: {}", "sec monitor".cyan());
    println!();

    Ok(())
}

fn determine_data_dir(path: Option<String>) -> Result<PathBuf> {
    if let Some(p) = path {
        Ok(PathBuf::from(p))
    } else {
        // Use ~/.secular by default
        let home = dirs::home_dir().ok_or_else(|| anyhow::anyhow!("Cannot determine home directory"))?;
        Ok(home.join(".secular"))
    }
}

fn create_directory_structure(data_dir: &PathBuf) -> Result<()> {
    println!("\n{}", "Creating directory structure...".cyan());

    fs::create_dir_all(data_dir)?;
    fs::create_dir_all(data_dir.join("repos"))?;
    fs::create_dir_all(data_dir.join("keys"))?;
    fs::create_dir_all(data_dir.join("logs"))?;
    fs::create_dir_all(data_dir.join("backups"))?;

    println!("  {} Created directories", "✓".green());
    Ok(())
}

fn create_config(data_dir: &PathBuf) -> Result<()> {
    println!("{}", "Creating configuration...".cyan());

    let config_path = data_dir.join("config.toml");

    if config_path.exists() {
        if !Confirm::new()
            .with_prompt("Configuration already exists. Overwrite?")
            .default(false)
            .interact()?
        {
            println!("  Keeping existing configuration");
            return Ok(());
        }
    }

    let node_name: String = Input::new()
        .with_prompt("Node name")
        .default("secular-node".to_string())
        .interact_text()?;

    let config = format!(
        r#"# Secular Configuration

[node]
name = "{}"
listen_addr = "0.0.0.0:8776"
data_dir = "{}"

[security]
secret_scanning = true
vulnerability_scanning = true
strict_mode = false

[optimization]
idle_timeout = 600  # seconds
enable_compression = true
tiered_storage = false

[monitoring]
enable_metrics = true
cost_tracking = true
"#,
        node_name,
        data_dir.display()
    );

    fs::write(config_path, config)?;
    println!("  {} Created config.toml", "✓".green());

    Ok(())
}

fn setup_secret_scanning(data_dir: &PathBuf) -> Result<()> {
    println!("{}", "Setting up secret scanning...".cyan());

    let scan_config = data_dir.join("scan-config.toml");

    let config = r#"# Secret Scanning Configuration

[[patterns]]
name = "AWS Access Key"
regex = "AKIA[0-9A-Z]{16}"
severity = "high"

[[patterns]]
name = "GitHub Token"
regex = "ghp_[0-9a-zA-Z]{36}"
severity = "high"

[[patterns]]
name = "Private Key"
regex = "-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"
severity = "critical"

[options]
scan_on_commit = true
block_on_detection = true
"#;

    fs::write(scan_config, config)?;
    println!("  {} Created scan-config.toml", "✓".green());

    Ok(())
}

fn is_git_repo() -> Result<bool> {
    Ok(std::path::Path::new(".git").exists())
}

fn setup_git_hooks() -> Result<()> {
    if !Confirm::new()
        .with_prompt("Setup git hooks for secret scanning?")
        .default(true)
        .interact()?
    {
        return Ok(());
    }

    println!("{}", "Setting up git hooks...".cyan());

    let hook_path = PathBuf::from(".git/hooks/pre-commit");

    let hook_script = r#"#!/bin/bash
# Secular pre-commit hook - secret scanning

# Run secret scanner on staged files
sec scan --staged --strict

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Secret scanning failed! Commit blocked."
    echo "   Run 'sec scan' to see details"
    exit 1
fi

exit 0
"#;

    fs::write(&hook_path, hook_script)?;

    // Make executable
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&hook_path)?.permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&hook_path, perms)?;
    }

    println!("  {} Created pre-commit hook", "✓".green());

    Ok(())
}
