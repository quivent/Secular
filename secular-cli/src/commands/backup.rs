//! Backup and restore operations

use anyhow::Result;
use clap::Args;
use colored::Colorize;
use std::path::PathBuf;
use std::process::Command;

#[derive(Args)]
pub struct BackupArgs {
    /// Backup destination (local path or gs://bucket/path)
    #[arg(short, long)]
    pub dest: Option<String>,

    /// Restore from backup
    #[arg(long)]
    pub restore: bool,

    /// List available backups
    #[arg(long)]
    pub list: bool,

    /// Include full repository data
    #[arg(long)]
    pub full: bool,

    /// Encrypt backup
    #[arg(long)]
    pub encrypt: bool,
}

pub async fn run(args: BackupArgs) -> Result<()> {
    if args.list {
        list_backups(args.dest).await
    } else if args.restore {
        restore_backup(args.dest).await
    } else {
        create_backup(args.dest, args.full, args.encrypt).await
    }
}

async fn create_backup(dest: Option<String>, full: bool, encrypt: bool) -> Result<()> {
    println!("{}", "📦 Creating backup...".cyan().bold());

    let data_dir = "/var/lib/secular";
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let backup_name = format!("secular-backup-{}.tar.gz", timestamp);

    // Create backup
    println!("  {} Compressing data...", "→".cyan());

    let mut cmd = Command::new("tar");
    cmd.arg("-czf")
        .arg(&backup_name)
        .arg("-C")
        .arg(data_dir);

    if full {
        cmd.arg(".");
    } else {
        // Only backup critical data
        cmd.arg("config")
            .arg("keys")
            .arg("repos");
    }

    let status = cmd.status()?;

    if !status.success() {
        anyhow::bail!("Failed to create backup archive");
    }

    println!("  {} Created {}", "✓".green(), backup_name.cyan());

    // Encrypt if requested
    if encrypt {
        println!("  {} Encrypting backup...", "→".cyan());
        encrypt_backup(&backup_name)?;
    }

    // Upload if destination specified
    if let Some(dest) = dest {
        println!("  {} Uploading to {}...", "→".cyan(), dest.cyan());
        upload_backup(&backup_name, &dest)?;

        // Clean up local copy
        std::fs::remove_file(&backup_name)?;
        println!("  {} Backup uploaded successfully", "✓".green());
    } else {
        println!("  {} Backup saved locally: {}", "✓".green(), backup_name.cyan());
    }

    Ok(())
}

async fn restore_backup(source: Option<String>) -> Result<()> {
    println!("{}", "♻️  Restoring from backup...".cyan().bold());

    let source = source.ok_or_else(|| anyhow::anyhow!("Backup source required for restore"))?;

    // Download if remote
    let backup_file = if source.starts_with("gs://") {
        println!("  {} Downloading backup...", "→".cyan());
        download_backup(&source)?
    } else {
        PathBuf::from(&source)
    };

    // Decrypt if needed
    let backup_file = if backup_file.extension().and_then(|s| s.to_str()) == Some("gpg") {
        println!("  {} Decrypting backup...", "→".cyan());
        decrypt_backup(&backup_file)?
    } else {
        backup_file
    };

    // Extract
    println!("  {} Extracting backup...", "→".cyan());

    let status = Command::new("tar")
        .args(&[
            "-xzf",
            backup_file.to_str().unwrap(),
            "-C",
            "/var/lib/secular",
        ])
        .status()?;

    if !status.success() {
        anyhow::bail!("Failed to extract backup");
    }

    println!("{}", "✓ Backup restored successfully!".green().bold());
    println!("\nRestart the node: {}", "sec node restart".cyan());

    Ok(())
}

async fn list_backups(location: Option<String>) -> Result<()> {
    println!("{}", "Available Backups:".cyan().bold());
    println!();

    if let Some(loc) = location {
        if loc.starts_with("gs://") {
            // List from GCS
            let output = Command::new("gsutil")
                .args(&["ls", &loc])
                .output()?;

            println!("{}", String::from_utf8_lossy(&output.stdout));
        } else {
            // List local directory
            for entry in std::fs::read_dir(&loc)? {
                let entry = entry?;
                if entry.file_name().to_string_lossy().starts_with("secular-backup-") {
                    println!("  {}", entry.file_name().to_string_lossy());
                }
            }
        }
    } else {
        // List current directory
        for entry in std::fs::read_dir(".")? {
            let entry = entry?;
            if entry.file_name().to_string_lossy().starts_with("secular-backup-") {
                let metadata = entry.metadata()?;
                let size = metadata.len() as f64 / 1024.0 / 1024.0; // MB
                println!(
                    "  {} ({:.2} MB)",
                    entry.file_name().to_string_lossy(),
                    size
                );
            }
        }
    }

    Ok(())
}

fn encrypt_backup(backup_file: &str) -> Result<()> {
    let encrypted_file = format!("{}.gpg", backup_file);

    let status = Command::new("gpg")
        .args(&[
            "--symmetric",
            "--cipher-algo",
            "AES256",
            "-o",
            &encrypted_file,
            backup_file,
        ])
        .status()?;

    if !status.success() {
        anyhow::bail!("Encryption failed");
    }

    // Remove unencrypted copy
    std::fs::remove_file(backup_file)?;

    Ok(())
}

fn decrypt_backup(backup_file: &PathBuf) -> Result<PathBuf> {
    let decrypted_file = backup_file.with_extension("");

    let status = Command::new("gpg")
        .args(&[
            "--decrypt",
            "-o",
            decrypted_file.to_str().unwrap(),
            backup_file.to_str().unwrap(),
        ])
        .status()?;

    if !status.success() {
        anyhow::bail!("Decryption failed");
    }

    Ok(decrypted_file)
}

fn upload_backup(backup_file: &str, dest: &str) -> Result<()> {
    if dest.starts_with("gs://") {
        // Upload to Google Cloud Storage
        let status = Command::new("gsutil")
            .args(&["cp", backup_file, dest])
            .status()?;

        if !status.success() {
            anyhow::bail!("Upload to GCS failed");
        }
    } else {
        // Copy to local destination
        std::fs::copy(backup_file, dest)?;
    }

    Ok(())
}

fn download_backup(source: &str) -> Result<PathBuf> {
    let filename = source.split('/').last().unwrap_or("backup.tar.gz");
    let dest = PathBuf::from(filename);

    let status = Command::new("gsutil")
        .args(&["cp", source, dest.to_str().unwrap()])
        .status()?;

    if !status.success() {
        anyhow::bail!("Download from GCS failed");
    }

    Ok(dest)
}
