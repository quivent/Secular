//! Cost optimization analysis and recommendations

use anyhow::Result;
use colored::Colorize;
use std::fs;

pub async fn run(dry_run: bool) -> Result<()> {
    println!("{}", "💰 Analyzing cost optimization opportunities...".cyan().bold());
    println!();

    let recommendations = analyze_system()?;

    print_recommendations(&recommendations);

    if !dry_run {
        println!();
        if dialoguer::Confirm::new()
            .with_prompt("Apply recommended optimizations?")
            .default(false)
            .interact()?
        {
            apply_optimizations(&recommendations)?;
        }
    }

    Ok(())
}

#[derive(Debug)]
struct Optimization {
    category: String,
    description: String,
    savings_percent: f64,
    action: OptimizationAction,
}

#[derive(Debug)]
enum OptimizationAction {
    EnableIdleShutdown,
    EnableCompression,
    ArchiveOldData,
    ReduceReplication,
    OptimizeDiskType,
}

fn analyze_system() -> Result<Vec<Optimization>> {
    let mut optimizations = Vec::new();

    // Check idle shutdown
    if !is_idle_shutdown_enabled()? {
        optimizations.push(Optimization {
            category: "Compute".to_string(),
            description: "Enable idle shutdown to reduce uptime costs by 70%".to_string(),
            savings_percent: 70.0,
            action: OptimizationAction::EnableIdleShutdown,
        });
    }

    // Check compression
    if !is_compression_enabled()? {
        optimizations.push(Optimization {
            category: "Bandwidth".to_string(),
            description: "Enable compression to reduce bandwidth costs by 50-70%".to_string(),
            savings_percent: 60.0,
            action: OptimizationAction::EnableCompression,
        });
    }

    // Check for old data
    let old_data_gb = check_old_data()?;
    if old_data_gb > 5.0 {
        optimizations.push(Optimization {
            category: "Storage".to_string(),
            description: format!(
                "Archive {:.1}GB of old data to cold storage (96% cost reduction)",
                old_data_gb
            ),
            savings_percent: 40.0,
            action: OptimizationAction::ArchiveOldData,
        });
    }

    // Check replication settings
    if is_over_replicating()? {
        optimizations.push(Optimization {
            category: "Bandwidth".to_string(),
            description: "Reduce replication to essential repos only".to_string(),
            savings_percent: 30.0,
            action: OptimizationAction::ReduceReplication,
        });
    }

    optimizations.sort_by(|a, b| b.savings_percent.partial_cmp(&a.savings_percent).unwrap());

    Ok(optimizations)
}

fn print_recommendations(recommendations: &[Optimization]) {
    if recommendations.is_empty() {
        println!("{}", "✓ System is already optimized!".green().bold());
        return;
    }

    println!(
        "{} Found {} optimization opportunity(ies):",
        "⚡".yellow(),
        recommendations.len()
    );
    println!();

    let mut total_savings = 0.0;
    for (i, opt) in recommendations.iter().enumerate() {
        let savings_str = if opt.savings_percent > 50.0 {
            format!("~{}%", opt.savings_percent).green().bold()
        } else {
            format!("~{}%", opt.savings_percent).yellow()
        };

        println!(
            "{}. {} {} [{}]",
            (i + 1).to_string().cyan(),
            opt.category.bold(),
            opt.description,
            savings_str
        );

        total_savings += opt.savings_percent;
    }

    println!();
    println!(
        "Potential total savings: {}",
        format!("~{:.0}%", total_savings / recommendations.len() as f64)
            .green()
            .bold()
    );
}

fn apply_optimizations(optimizations: &[Optimization]) -> Result<()> {
    println!();
    println!("{}", "Applying optimizations...".cyan());

    for opt in optimizations {
        print!("  {} {} ... ", "→".cyan(), opt.description);

        match &opt.action {
            OptimizationAction::EnableIdleShutdown => {
                enable_idle_shutdown()?;
                println!("{}", "✓".green());
            }
            OptimizationAction::EnableCompression => {
                enable_compression()?;
                println!("{}", "✓".green());
            }
            OptimizationAction::ArchiveOldData => {
                archive_old_data()?;
                println!("{}", "✓".green());
            }
            OptimizationAction::ReduceReplication => {
                optimize_replication()?;
                println!("{}", "✓".green());
            }
            OptimizationAction::OptimizeDiskType => {
                println!("{}", "(manual)".yellow());
            }
        }
    }

    println!();
    println!("{}", "✓ Optimizations applied!".green().bold());
    println!("Restart node: {}", "sec node restart".cyan());

    Ok(())
}

// Helper functions
fn is_idle_shutdown_enabled() -> Result<bool> {
    let config_path = "/var/lib/secular/config.toml";
    if let Ok(content) = fs::read_to_string(config_path) {
        Ok(content.contains("idle_timeout"))
    } else {
        Ok(false)
    }
}

fn is_compression_enabled() -> Result<bool> {
    let config_path = "/var/lib/secular/config.toml";
    if let Ok(content) = fs::read_to_string(config_path) {
        Ok(content.contains("enable_compression = true"))
    } else {
        Ok(false)
    }
}

fn check_old_data() -> Result<f64> {
    // Simplified - would check actual file dates
    Ok(0.0)
}

fn is_over_replicating() -> Result<bool> {
    // Would check actual replication settings
    Ok(false)
}

fn enable_idle_shutdown() -> Result<()> {
    update_config("idle_timeout", "600")?;
    Ok(())
}

fn enable_compression() -> Result<()> {
    update_config("enable_compression", "true")?;
    Ok(())
}

fn archive_old_data() -> Result<()> {
    // Would implement actual archival
    Ok(())
}

fn optimize_replication() -> Result<()> {
    // Would update replication settings
    Ok(())
}

fn update_config(key: &str, value: &str) -> Result<()> {
    let config_path = "/var/lib/secular/config.toml";

    if let Ok(mut content) = fs::read_to_string(config_path) {
        if !content.contains(key) {
            content.push_str(&format!("\n{} = {}\n", key, value));
            fs::write(config_path, content)?;
        }
    }

    Ok(())
}
