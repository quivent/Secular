//! Secret scanning command

use anyhow::{Context, Result};
use clap::Args;
use colored::Colorize;
use radicle::security::SecretScanner;
use std::path::PathBuf;

#[derive(Args)]
pub struct ScanArgs {
    /// Scan only staged changes
    #[arg(long)]
    pub staged: bool,

    /// Scan specific commit
    #[arg(long)]
    pub commit: Option<String>,

    /// Scan specific file or directory
    #[arg(short, long)]
    pub file: Option<PathBuf>,

    /// Scan entire repository history
    #[arg(long)]
    pub all: bool,

    /// Exit with error if secrets found
    #[arg(long)]
    pub strict: bool,

    /// Output format (text, json)
    #[arg(short, long, default_value = "text")]
    pub format: String,
}

pub async fn run(args: ScanArgs) -> Result<()> {
    println!("{}", "🔍 Scanning for secrets...".cyan().bold());

    let scanner = SecretScanner::new();
    let mut total_secrets = 0;

    if let Some(file_path) = &args.file {
        // Scan specific file or directory
        if file_path.is_dir() {
            let secrets = scanner
                .scan_directory(file_path)
                .context("Failed to scan directory")?;
            total_secrets = secrets.len();
            display_results(&secrets, &args.format)?;
        } else {
            let secrets = scanner
                .scan_file(file_path)
                .context("Failed to scan file")?;
            total_secrets = secrets.len();
            display_results(&secrets, &args.format)?;
        }
    } else if args.staged {
        // Scan staged changes
        total_secrets = scan_staged(&scanner)?;
    } else if let Some(commit) = &args.commit {
        // Scan specific commit
        total_secrets = scan_commit(&scanner, commit)?;
    } else if args.all {
        // Scan entire history
        total_secrets = scan_history(&scanner)?;
    } else {
        // Default: scan working directory
        let cwd = std::env::current_dir().context("Failed to get current directory")?;
        let secrets = scanner
            .scan_directory(&cwd)
            .context("Failed to scan current directory")?;
        total_secrets = secrets.len();
        display_results(&secrets, &args.format)?;
    }

    // Print summary
    println!();
    if total_secrets == 0 {
        println!("{}", "✓ No secrets found!".green().bold());
        Ok(())
    } else {
        println!(
            "{} Found {} potential secret(s)",
            "⚠".yellow().bold(),
            total_secrets.to_string().yellow().bold()
        );

        if args.strict {
            anyhow::bail!("Secrets detected in strict mode");
        }

        Ok(())
    }
}

fn scan_staged(scanner: &SecretScanner) -> Result<usize> {
    use git2::Repository;

    let repo = Repository::discover(".").context("Not a git repository")?;
    let diff = repo
        .diff_index_to_workdir(None, None)
        .context("Failed to get diff")?;

    // Convert diff to text
    let mut diff_text = String::new();
    diff.print(git2::DiffFormat::Patch, |_delta, _hunk, line| {
        if let Ok(content) = std::str::from_utf8(line.content()) {
            diff_text.push_str(content);
        }
        true
    })?;

    let secrets = scanner.scan_diff(&diff_text)?;

    display_results(&secrets, "text")?;
    Ok(secrets.len())
}

fn scan_commit(scanner: &SecretScanner, commit_id: &str) -> Result<usize> {
    use git2::Repository;

    let repo = Repository::discover(".").context("Not a git repository")?;
    let oid = git2::Oid::from_str(commit_id).context("Invalid commit ID")?;
    let commit = repo.find_commit(oid).context("Commit not found")?;

    let tree = commit.tree()?;
    let parent_tree = commit.parent(0)?.tree()?;

    let diff = repo.diff_tree_to_tree(Some(&parent_tree), Some(&tree), None)?;

    // Convert diff to text manually
    let mut diff_text = String::new();
    diff.print(git2::DiffFormat::Patch, |_delta, _hunk, line| {
        if let Ok(content) = std::str::from_utf8(line.content()) {
            diff_text.push_str(content);
        }
        true
    })?;

    let secrets = scanner.scan_diff(&diff_text)?;
    display_results(&secrets, "text")?;
    Ok(secrets.len())
}

fn scan_history(scanner: &SecretScanner) -> Result<usize> {
    use git2::Repository;

    println!("{}", "⚠ Scanning entire history...".yellow());

    let repo = Repository::discover(".").context("Not a git repository")?;
    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;

    let mut total_secrets = 0;

    for oid in revwalk {
        let oid = oid?;
        let commit = repo.find_commit(oid)?;

        if commit.parent_count() > 0 {
            let tree = commit.tree()?;
            let parent_tree = commit.parent(0)?.tree()?;
            let diff = repo.diff_tree_to_tree(Some(&parent_tree), Some(&tree), None)?;

            // Convert diff to text
            let mut diff_text = String::new();
            diff.print(git2::DiffFormat::Patch, |_delta, _hunk, line| {
                if let Ok(content) = std::str::from_utf8(line.content()) {
                    diff_text.push_str(content);
                }
                true
            })?;

            let secrets = scanner.scan_diff(&diff_text)?;
            if !secrets.is_empty() {
                println!(
                    "\n{} {}",
                    "Commit:".yellow(),
                    oid.to_string()[..8].yellow()
                );
                display_results(&secrets, "text")?;
                total_secrets += secrets.len();
            }
        }
    }

    Ok(total_secrets)
}

fn display_results(secrets: &[radicle::security::secrets::SecretMatch], format: &str) -> Result<()> {
    if format == "json" {
        println!("{}", serde_json::to_string_pretty(secrets)?);
    } else {
        for secret in secrets {
            let file = secret
                .file_path
                .as_ref()
                .map(|p| p.as_str())
                .unwrap_or("unknown");

            println!(
                "  {} {} at {}:{}:{}",
                "⚠".yellow(),
                secret.kind.to_string().red().bold(),
                file.cyan(),
                secret.line.to_string().yellow(),
                secret.column.to_string().yellow()
            );
            println!("    Match: {}", secret.match_text.dimmed());
        }
    }

    Ok(())
}
