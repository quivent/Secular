//! Resource monitoring and cost estimation command
//! Converts the cost-monitor.sh script to Rust

use anyhow::Result;
use clap::Args;
use colored::Colorize;
use std::fs;
use std::path::Path;

#[derive(Args)]
pub struct MonitorArgs {
    /// Show historical metrics
    #[arg(long)]
    pub history: bool,

    /// Output format (text, json)
    #[arg(short, long, default_value = "text")]
    pub format: String,

    /// Path to node data directory
    #[arg(long, default_value = "/var/lib/radicle")]
    pub data_dir: String,
}

// Cost constants (GCP us-central1)
const E2_MICRO_HOURLY: f64 = 0.00508;
const HDD_STORAGE_PER_GB: f64 = 0.04;
const EGRESS_PER_GB: f64 = 0.12;
const STATIC_IP_MONTHLY: f64 = 2.88;

#[derive(Debug, serde::Serialize)]
struct ResourceMetrics {
    uptime_hours: f64,
    cpu_percent: f64,
    memory_percent: f64,
    disk_used_gb: f64,
    disk_total_gb: f64,
    peer_count: usize,
    repo_count: usize,
}

#[derive(Debug, serde::Serialize)]
struct CostEstimate {
    compute: f64,
    storage: f64,
    egress: f64,
    static_ip: f64,
    total: f64,
}

pub async fn run(args: MonitorArgs) -> Result<()> {
    if args.format == "json" {
        run_json(&args).await
    } else {
        run_text(&args).await
    }
}

async fn run_text(args: &MonitorArgs) -> Result<()> {
    print_header();

    let metrics = collect_metrics(args)?;
    print_resource_usage(&metrics);

    let costs = calculate_costs(&metrics)?;
    print_cost_estimate(&costs);

    print_optimization_tips(&metrics);

    // Save metrics for historical tracking
    save_metrics(&metrics, &costs, args)?;

    Ok(())
}

async fn run_json(args: &MonitorArgs) -> Result<()> {
    let metrics = collect_metrics(args)?;
    let costs = calculate_costs(&metrics)?;

    let output = serde_json::json!({
        "metrics": metrics,
        "costs": costs,
        "timestamp": chrono::Utc::now().to_rfc3339()
    });

    println!("{}", serde_json::to_string_pretty(&output)?);
    Ok(())
}

fn print_header() {
    println!("{}", "━".repeat(60).blue());
    println!(
        "{}",
        "  Secular Node - Resource Usage & Cost Monitor"
            .blue()
            .bold()
    );
    println!("{}", "━".repeat(60).blue());
    println!();
}

fn collect_metrics(args: &MonitorArgs) -> Result<ResourceMetrics> {
    // Get uptime
    let uptime_hours = get_uptime_hours()?;

    // Get CPU usage
    let cpu_percent = get_cpu_usage()?;

    // Get memory usage
    let memory_percent = get_memory_usage()?;

    // Get disk usage
    let (disk_used_gb, disk_total_gb) = get_disk_usage(&args.data_dir)?;

    // Get peer/repo counts (if radicle node is accessible)
    let peer_count = get_peer_count().unwrap_or(0);
    let repo_count = get_repo_count().unwrap_or(0);

    Ok(ResourceMetrics {
        uptime_hours,
        cpu_percent,
        memory_percent,
        disk_used_gb,
        disk_total_gb,
        peer_count,
        repo_count,
    })
}

fn print_resource_usage(metrics: &ResourceMetrics) {
    println!("{}", "System Resources:".green().bold());
    println!("  Uptime:     {:.1} hours", metrics.uptime_hours);
    println!("  CPU:        {:.1}%", metrics.cpu_percent);
    println!("  Memory:     {:.1}%", metrics.memory_percent);
    println!(
        "  Disk:       {:.1}GB / {:.1}GB ({:.1}%)",
        metrics.disk_used_gb,
        metrics.disk_total_gb,
        (metrics.disk_used_gb / metrics.disk_total_gb) * 100.0
    );
    println!("  Peers:      {}", metrics.peer_count);
    println!("  Repos:      {}", metrics.repo_count);
    println!();
}

fn calculate_costs(metrics: &ResourceMetrics) -> Result<CostEstimate> {
    // Estimate monthly hours based on current uptime
    let days_in_month = 30.0;
    let monthly_hours = (metrics.uptime_hours / 24.0) * (24.0 * days_in_month);

    // Compute cost
    let compute = monthly_hours * E2_MICRO_HOURLY;

    // Storage cost
    let storage = metrics.disk_used_gb * HDD_STORAGE_PER_GB;

    // Egress cost (conservative estimate)
    let egress_gb = 10.0; // Would need actual network monitoring
    let egress = egress_gb * EGRESS_PER_GB;

    // Total
    let total = compute + storage + egress + STATIC_IP_MONTHLY;

    Ok(CostEstimate {
        compute,
        storage,
        egress,
        static_ip: STATIC_IP_MONTHLY,
        total,
    })
}

fn print_cost_estimate(costs: &CostEstimate) {
    println!("{}", "Estimated Monthly Costs:".yellow().bold());
    println!("  Compute (e2-micro): ${:.2}", costs.compute);
    println!("  Storage (HDD):      ${:.2}", costs.storage);
    println!("  Egress (estimated): ${:.2}", costs.egress);
    println!("  Static IP:          ${:.2}", costs.static_ip);
    println!();
    println!(
        "  {} {}",
        "Total:".yellow().bold(),
        format!("${:.2}", costs.total).yellow().bold()
    );
    println!();
}

fn print_optimization_tips(metrics: &ResourceMetrics) {
    println!("{}", "Cost Optimization Tips:".green().bold());

    // Check if node is idle
    if metrics.cpu_percent < 5.0 {
        println!("  ✓ Node is idle - idle shutdown is working");
    } else {
        println!("  ⚠ Node is active - monitor for unnecessary uptime");
    }

    // Check disk usage
    let disk_percent = (metrics.disk_used_gb / metrics.disk_total_gb) * 100.0;
    if disk_percent > 80.0 {
        println!("  ⚠ Disk usage >80% - consider archiving old data");
    } else {
        println!("  ✓ Disk usage healthy");
    }

    // Check for active peers
    if metrics.peer_count == 0 {
        println!("  ⚠ No peers connected - node may be offline");
    } else {
        println!("  ✓ {} peers connected", metrics.peer_count);
    }

    println!();
}

fn save_metrics(metrics: &ResourceMetrics, costs: &CostEstimate, args: &MonitorArgs) -> Result<()> {
    let metrics_file = Path::new(&args.data_dir).join("metrics.log");

    if let Ok(parent) = metrics_file.parent().ok_or(anyhow::anyhow!("No parent")) {
        if parent.exists() {
            let timestamp = chrono::Utc::now().timestamp();
            let line = format!(
                "{},{:.1},{:.2},{:.2},{:.2},{:.2}\n",
                timestamp, metrics.cpu_percent, costs.compute, costs.storage, costs.egress, costs.total
            );

            let _ = fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(&metrics_file)
                .and_then(|mut f| {
                    use std::io::Write;
                    f.write_all(line.as_bytes())
                });
        }
    }

    Ok(())
}

// Helper functions for system metrics
fn get_uptime_hours() -> Result<f64> {
    #[cfg(target_os = "linux")]
    {
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
        // Fallback for non-Linux systems
        Ok(0.0)
    }
}

fn get_cpu_usage() -> Result<f64> {
    use std::process::Command;

    let output = Command::new("sh")
        .arg("-c")
        .arg("ps aux | grep radicle-node | grep -v grep | awk '{print $3}' | head -1")
        .output()?;

    let cpu_str = String::from_utf8_lossy(&output.stdout);
    Ok(cpu_str.trim().parse().unwrap_or(0.0))
}

fn get_memory_usage() -> Result<f64> {
    use std::process::Command;

    let output = Command::new("sh")
        .arg("-c")
        .arg("ps aux | grep radicle-node | grep -v grep | awk '{print $4}' | head -1")
        .output()?;

    let mem_str = String::from_utf8_lossy(&output.stdout);
    Ok(mem_str.trim().parse().unwrap_or(0.0))
}

fn get_disk_usage(data_dir: &str) -> Result<(f64, f64)> {
    use std::process::Command;

    let output = Command::new("df")
        .args(&["-BG", data_dir])
        .output()?;

    let output_str = String::from_utf8_lossy(&output.stdout);
    if let Some(line) = output_str.lines().nth(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 4 {
            let total: f64 = parts[1].trim_end_matches('G').parse().unwrap_or(20.0);
            let used: f64 = parts[2].trim_end_matches('G').parse().unwrap_or(0.0);
            return Ok((used, total));
        }
    }

    Ok((0.0, 20.0))
}

fn get_peer_count() -> Result<usize> {
    // Would integrate with radicle node API
    // For now, return placeholder
    Ok(0)
}

fn get_repo_count() -> Result<usize> {
    // Would integrate with radicle node API
    Ok(0)
}
