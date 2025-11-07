//! Deployment command - converts deploy-e2-micro.sh to Rust

use anyhow::{Context, Result};
use clap::{Args, Subcommand};
use colored::Colorize;
use dialoguer::Confirm;
use std::process::Command;

#[derive(Args)]
pub struct DeployArgs {
    #[command(subcommand)]
    pub platform: DeployPlatform,
}

#[derive(Subcommand)]
pub enum DeployPlatform {
    /// Deploy to Google Cloud Platform
    Gcp {
        /// Instance name
        #[arg(long, default_value = "secular-node")]
        instance: String,

        /// GCP zone
        #[arg(long, default_value = "us-central1-a")]
        zone: String,

        /// GCP project ID
        #[arg(long)]
        project: Option<String>,

        /// Machine type
        #[arg(long, default_value = "e2-micro")]
        machine_type: String,

        /// Disk size
        #[arg(long, default_value = "20GB")]
        disk_size: String,
    },

    /// Deploy locally (development)
    Local {
        /// Port to listen on
        #[arg(long, default_value = "8776")]
        port: u16,

        /// Data directory
        #[arg(long)]
        data_dir: Option<String>,
    },
}

pub async fn run(args: DeployArgs) -> Result<()> {
    match args.platform {
        DeployPlatform::Gcp {
            instance,
            zone,
            project,
            machine_type,
            disk_size,
        } => deploy_gcp(instance, zone, project, machine_type, disk_size).await,
        DeployPlatform::Local { port, data_dir } => deploy_local(port, data_dir).await,
    }
}

async fn deploy_gcp(
    instance: String,
    zone: String,
    project: Option<String>,
    machine_type: String,
    disk_size: String,
) -> Result<()> {
    println!("{}", "🚀 Deploying to Google Cloud Platform...".cyan().bold());
    println!();

    // Check prerequisites
    check_gcp_prerequisites(&project)?;

    let project = project.or_else(|| std::env::var("RADICLE_GCP_PROJECT").ok())
        .context("GCP project ID required. Set RADICLE_GCP_PROJECT or use --project")?;

    // Confirm deployment
    println!("Configuration:");
    println!("  Project:      {}", project.cyan());
    println!("  Instance:     {}", instance.cyan());
    println!("  Zone:         {}", zone.cyan());
    println!("  Machine type: {}", machine_type.cyan());
    println!("  Disk size:    {}", disk_size.cyan());
    println!();

    if !Confirm::new()
        .with_prompt("Proceed with deployment?")
        .default(true)
        .interact()?
    {
        println!("Deployment cancelled.");
        return Ok(());
    }

    // Set project
    run_command(&["gcloud", "config", "set", "project", &project], "Set GCP project")?;

    // Create instance
    println!("\n{}", "Creating VM instance...".cyan());
    create_gcp_instance(&instance, &zone, &machine_type, &disk_size)?;

    // Create static IP
    println!("\n{}", "Reserving static IP...".cyan());
    create_static_ip(&instance, &zone)?;

    // Configure firewall
    println!("\n{}", "Configuring firewall...".cyan());
    configure_firewall(&instance)?;

    // Install secular
    println!("\n{}", "Installing Secular...".cyan());
    install_secular(&instance, &zone)?;

    println!("\n{}", "✓ Deployment complete!".green().bold());
    print_deployment_summary(&instance, &zone);

    Ok(())
}

fn check_gcp_prerequisites(project: &Option<String>) -> Result<()> {
    // Check if gcloud is installed
    if which::which("gcloud").is_err() {
        anyhow::bail!(
            "gcloud CLI not found. Install from: https://cloud.google.com/sdk/install"
        );
    }

    if project.is_none() && std::env::var("RADICLE_GCP_PROJECT").is_err() {
        anyhow::bail!(
            "GCP project ID required. Set RADICLE_GCP_PROJECT environment variable or use --project"
        );
    }

    Ok(())
}

fn create_gcp_instance(
    instance: &str,
    zone: &str,
    machine_type: &str,
    disk_size: &str,
) -> Result<()> {
    run_command(
        &[
            "gcloud",
            "compute",
            "instances",
            "create",
            instance,
            "--machine-type",
            machine_type,
            "--zone",
            zone,
            "--image-family",
            "ubuntu-2204-lts",
            "--image-project",
            "ubuntu-os-cloud",
            "--boot-disk-size",
            disk_size,
            "--boot-disk-type",
            "pd-standard",
            "--tags",
            "secular-node",
        ],
        "Create VM instance",
    )
}

fn create_static_ip(instance: &str, zone: &str) -> Result<()> {
    let region = zone.rsplitn(2, '-').nth(1).unwrap_or("us-central1");
    let ip_name = format!("{}-ip", instance);

    // Try to create (may already exist)
    let _ = run_command(
        &[
            "gcloud",
            "compute",
            "addresses",
            "create",
            &ip_name,
            "--region",
            region,
        ],
        "Reserve static IP",
    );

    // Get IP address
    let output = Command::new("gcloud")
        .args(&[
            "compute",
            "addresses",
            "describe",
            &ip_name,
            "--region",
            region,
            "--format=value(address)",
        ])
        .output()?;

    let ip = String::from_utf8_lossy(&output.stdout).trim().to_string();
    println!("  Static IP: {}", ip.cyan());

    Ok(())
}

fn configure_firewall(instance: &str) -> Result<()> {
    // P2P port
    let _ = run_command(
        &[
            "gcloud",
            "compute",
            "firewall-rules",
            "create",
            &format!("{}-p2p", instance),
            "--allow=tcp:8776",
            "--target-tags=secular-node",
            "--description=Secular P2P port",
        ],
        "Create P2P firewall rule",
    );

    Ok(())
}

fn install_secular(instance: &str, zone: &str) -> Result<()> {
    let install_script = r#"
        set -e
        # Install Rust
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source $HOME/.cargo/env

        # Clone and build
        git clone https://github.com/YOUR_USERNAME/secular.git
        cd secular
        cargo build --release

        # Install binaries
        sudo cp target/release/secular /usr/local/bin/
        sudo ln -sf /usr/local/bin/secular /usr/local/bin/sec

        # Create secular user
        sudo useradd -r -s /bin/false secular || true
        sudo mkdir -p /var/lib/secular
        sudo chown secular:secular /var/lib/secular

        echo "Secular installed successfully"
    "#;

    run_command(
        &[
            "gcloud",
            "compute",
            "ssh",
            instance,
            "--zone",
            zone,
            "--command",
            install_script,
        ],
        "Install Secular on instance",
    )
}

fn print_deployment_summary(instance: &str, zone: &str) {
    println!();
    println!("{}", "Deployment Summary:".green().bold());
    println!("  Instance: {}", instance.cyan());
    println!("  Zone: {}", zone.cyan());
    println!();
    println!("Next steps:");
    println!("  1. SSH: {}", format!("gcloud compute ssh {} --zone={}", instance, zone).cyan());
    println!("  2. Init: {}", "sudo -u secular sec init".cyan());
    println!("  3. Monitor: {}", "sec monitor".cyan());
    println!();
}

async fn deploy_local(port: u16, data_dir: Option<String>) -> Result<()> {
    println!("{}", "🏠 Deploying locally...".cyan().bold());

    let data_dir = data_dir.unwrap_or_else(|| {
        dirs::home_dir()
            .unwrap()
            .join(".secular")
            .to_string_lossy()
            .to_string()
    });

    println!("  Port: {}", port.to_string().cyan());
    println!("  Data directory: {}", data_dir.cyan());

    // Create data directory
    std::fs::create_dir_all(&data_dir)?;

    println!("\n{}", "✓ Local deployment ready!".green().bold());
    println!("\nStart node with: {}", format!("sec node start --port {}", port).cyan());

    Ok(())
}

fn run_command(args: &[&str], description: &str) -> Result<()> {
    println!("  {} {}", "→".cyan(), description);

    let output = Command::new(args[0])
        .args(&args[1..])
        .output()
        .context(format!("Failed to run: {}", args.join(" ")))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        if !stderr.contains("already exists") {
            eprintln!("{}", stderr.red());
            anyhow::bail!("Command failed: {}", args.join(" "));
        }
    }

    Ok(())
}
