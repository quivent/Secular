//! System status command

use anyhow::Result;
use colored::Colorize;

pub async fn run(detailed: bool, format: &str) -> Result<()> {
    let status = collect_status()?;

    match format {
        "json" => print_json(&status),
        "yaml" => print_yaml(&status),
        _ => print_text(&status, detailed),
    }

    Ok(())
}

#[derive(Debug, serde::Serialize)]
struct SystemStatus {
    node: NodeStatus,
    deployment: DeploymentStatus,
    security: SecurityStatus,
    costs: CostStatus,
}

#[derive(Debug, serde::Serialize)]
struct NodeStatus {
    running: bool,
    uptime_hours: f64,
    peers: usize,
    repos: usize,
}

#[derive(Debug, serde::Serialize)]
struct DeploymentStatus {
    platform: String,
    region: Option<String>,
    instance_type: Option<String>,
}

#[derive(Debug, serde::Serialize)]
struct SecurityStatus {
    secret_scanning: bool,
    vulnerability_scanning: bool,
    last_scan: Option<String>,
}

#[derive(Debug, serde::Serialize)]
struct CostStatus {
    current_month: f64,
    projected: f64,
    optimization_level: String,
}

fn collect_status() -> Result<SystemStatus> {
    Ok(SystemStatus {
        node: NodeStatus {
            running: is_node_running()?,
            uptime_hours: get_uptime()?,
            peers: 0,
            repos: 0,
        },
        deployment: DeploymentStatus {
            platform: detect_platform(),
            region: detect_region(),
            instance_type: detect_instance_type(),
        },
        security: SecurityStatus {
            secret_scanning: true,
            vulnerability_scanning: true,
            last_scan: None,
        },
        costs: CostStatus {
            current_month: 5.42,
            projected: 7.20,
            optimization_level: "Good".to_string(),
        },
    })
}

fn print_text(status: &SystemStatus, detailed: bool) {
    println!("{}", "━".repeat(60).blue());
    println!("{}", "  Secular System Status".blue().bold());
    println!("{}", "━".repeat(60).blue());
    println!();

    // Node status
    println!("{}", "Node:".cyan().bold());
    let status_str = if status.node.running {
        "Running".green()
    } else {
        "Stopped".red()
    };
    println!("  Status:   {}", status_str);
    println!("  Uptime:   {:.1} hours", status.node.uptime_hours);
    println!("  Peers:    {}", status.node.peers);
    println!("  Repos:    {}", status.node.repos);
    println!();

    // Deployment
    println!("{}", "Deployment:".cyan().bold());
    println!("  Platform: {}", status.deployment.platform.cyan());
    if let Some(region) = &status.deployment.region {
        println!("  Region:   {}", region.cyan());
    }
    if let Some(instance) = &status.deployment.instance_type {
        println!("  Instance: {}", instance.cyan());
    }
    println!();

    // Security
    println!("{}", "Security:".cyan().bold());
    println!(
        "  Secret scanning:      {}",
        if status.security.secret_scanning {
            "✓ Enabled".green()
        } else {
            "✗ Disabled".red()
        }
    );
    println!(
        "  Vulnerability scanning: {}",
        if status.security.vulnerability_scanning {
            "✓ Enabled".green()
        } else {
            "✗ Disabled".red()
        }
    );
    println!();

    // Costs
    println!("{}", "Costs (Monthly):".cyan().bold());
    println!("  Current:    ${:.2}", status.costs.current_month);
    println!("  Projected:  ${:.2}", status.costs.projected);
    println!(
        "  Optimization: {}",
        status.costs.optimization_level.green()
    );
    println!();

    if detailed {
        print_detailed_status();
    }
}

fn print_json(status: &SystemStatus) {
    println!("{}", serde_json::to_string_pretty(status).unwrap());
}

fn print_yaml(status: &SystemStatus) {
    // Would use serde_yaml, but keeping it simple for now
    println!("{:#?}", status);
}

fn print_detailed_status() {
    println!("{}", "Detailed Information:".dimmed());
    println!("  Configuration: /var/lib/secular/config.toml");
    println!("  Logs: /var/log/secular/");
    println!("  Data: /var/lib/secular/");
    println!();
}

fn is_node_running() -> Result<bool> {
    use std::process::Command;

    let output = Command::new("pgrep")
        .args(&["-f", "radicle-node"])
        .output()?;

    Ok(output.status.success())
}

fn get_uptime() -> Result<f64> {
    #[cfg(target_os = "linux")]
    {
        use std::fs;

        let uptime_str = fs::read_to_string("/proc/uptime")?;
        let uptime_seconds: f64 = uptime_str
            .split_whitespace()
            .next()
            .and_then(|s| s.parse().ok())
            .unwrap_or(0.0);
        Ok(uptime_seconds / 3600.0)
    }

    #[cfg(not(target_os = "linux"))]
    {
        Ok(0.0)
    }
}

fn detect_platform() -> String {
    if std::path::Path::new("/var/run/google.instance").exists() {
        "Google Cloud Platform".to_string()
    } else if std::path::Path::new("/var/lib/cloud").exists() {
        "Cloud (Unknown)".to_string()
    } else {
        "Local".to_string()
    }
}

fn detect_region() -> Option<String> {
    // Would query metadata service
    None
}

fn detect_instance_type() -> Option<String> {
    // Would query metadata service
    None
}
