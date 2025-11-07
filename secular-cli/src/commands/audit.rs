//! Vulnerability auditing command

use anyhow::{Context, Result};
use clap::Args;
use colored::Colorize;
use radicle::security::VulnerabilityScanner;
use std::path::PathBuf;

#[derive(Args)]
pub struct AuditArgs {
    /// Path to Cargo.lock file
    #[arg(long)]
    pub lockfile: Option<PathBuf>,

    /// Scan all lockfiles in repository
    #[arg(short, long)]
    pub recursive: bool,

    /// Attempt to fix vulnerabilities (update dependencies)
    #[arg(long)]
    pub fix: bool,

    /// Show only specific severity (critical, high, medium, low)
    #[arg(long)]
    pub severity: Option<String>,

    /// Output format (text, json)
    #[arg(short, long, default_value = "text")]
    pub format: String,
}

pub async fn run(args: AuditArgs) -> Result<()> {
    println!("{}", "🔒 Auditing dependencies...".cyan().bold());

    let scanner = VulnerabilityScanner::new()
        .context("Failed to initialize vulnerability scanner")?;

    let reports = if args.recursive {
        // Scan all lockfiles in repository
        let cwd = std::env::current_dir()?;
        scanner
            .scan_repository(&cwd)
            .context("Failed to scan repository")?
    } else if let Some(lockfile) = &args.lockfile {
        // Scan specific lockfile
        vec![scanner
            .scan_cargo_lock(lockfile)
            .context("Failed to scan lockfile")?]
    } else {
        // Default: scan Cargo.lock in current directory
        let lockfile = PathBuf::from("Cargo.lock");
        if !lockfile.exists() {
            anyhow::bail!("Cargo.lock not found. Use --lockfile to specify path.");
        }

        vec![scanner
            .scan_cargo_lock(&lockfile)
            .context("Failed to scan Cargo.lock")?]
    };

    // Display results
    let mut total_vulns = 0;
    let mut critical_count = 0;
    let mut high_count = 0;

    for report in &reports {
        if args.format == "json" {
            println!("{}", serde_json::to_string_pretty(&report)?);
        } else {
            display_report(report, args.severity.as_deref())?;
        }

        total_vulns += report.vulnerabilities.len();
        critical_count += report.critical_count();
        high_count += report.high_count();
    }

    // Summary
    println!();
    if total_vulns == 0 {
        println!("{}", "✓ No vulnerabilities found!".green().bold());
    } else {
        println!(
            "{} Found {} vulnerabilities ({} critical, {} high)",
            "⚠".yellow().bold(),
            total_vulns.to_string().yellow().bold(),
            critical_count.to_string().red().bold(),
            high_count.to_string().yellow().bold()
        );

        if args.fix {
            println!("\n{}", "Attempting to fix vulnerabilities...".cyan());
            fix_vulnerabilities()?;
        } else {
            println!("\nRun {} to attempt automatic fixes", "sec audit --fix".cyan());
        }
    }

    Ok(())
}

fn display_report(
    report: &radicle::security::vulnerabilities::ScanReport,
    severity_filter: Option<&str>,
) -> Result<()> {
    use radicle::security::vulnerabilities::Severity;

    println!(
        "\n{} {}",
        "Lockfile:".cyan(),
        report.lockfile_path.display()
    );

    for vuln in &report.vulnerabilities {
        // Apply severity filter
        if let Some(filter) = severity_filter {
            let matches = match filter.to_lowercase().as_str() {
                "critical" => vuln.severity == Severity::Critical,
                "high" => vuln.severity == Severity::High,
                "medium" => vuln.severity == Severity::Medium,
                "low" => vuln.severity == Severity::Low,
                _ => true,
            };

            if !matches {
                continue;
            }
        }

        let severity_colored = match vuln.severity {
            Severity::Critical => vuln.severity.to_string().red().bold(),
            Severity::High => vuln.severity.to_string().yellow().bold(),
            Severity::Medium => vuln.severity.to_string().yellow(),
            Severity::Low => vuln.severity.to_string().white(),
        };

        println!(
            "\n  {} {} - {} ({}@{})",
            severity_colored,
            vuln.id.cyan().bold(),
            vuln.title,
            vuln.package.cyan(),
            vuln.version.dimmed()
        );
        println!("    {}", vuln.description.dimmed());

        if let Some(url) = &vuln.url {
            println!("    More info: {}", url.cyan().underline());
        }
    }

    Ok(())
}

fn fix_vulnerabilities() -> Result<()> {
    use std::process::Command;

    // Run cargo update to try to fix vulnerabilities
    let output = Command::new("cargo")
        .args(&["update"])
        .output()
        .context("Failed to run cargo update")?;

    if output.status.success() {
        println!("{}", "✓ Dependencies updated".green());
        println!("\n{}", "Re-run audit to verify fixes...".dimmed());
    } else {
        eprintln!(
            "{}",
            String::from_utf8_lossy(&output.stderr).to_string().red()
        );
        anyhow::bail!("Failed to update dependencies");
    }

    Ok(())
}
