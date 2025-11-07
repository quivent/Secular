// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

// State management
struct AppState {
    scan_running: Mutex<bool>,
    node_running: Mutex<bool>,
}

// Types
#[derive(Debug, Serialize, Deserialize)]
struct ScanResult {
    total_secrets: usize,
    secrets: Vec<SecretMatch>,
}

#[derive(Debug, Serialize, Deserialize)]
struct SecretMatch {
    kind: String,
    line: usize,
    column: usize,
    file_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct SystemStatus {
    node_running: bool,
    uptime_hours: f64,
    peers: usize,
    repos: usize,
    current_cost: f64,
    projected_cost: f64,
}

#[derive(Debug, Serialize, Deserialize)]
struct DeployConfig {
    platform: String,
    instance_name: String,
    region: String,
    machine_type: String,
}

// Commands
#[tauri::command]
async fn scan_for_secrets(path: String) -> Result<ScanResult, String> {
    use radicle::security::SecretScanner;
    use std::path::PathBuf;

    let scanner = SecretScanner::new();
    let scan_path = PathBuf::from(&path);

    let secrets = if scan_path.is_dir() {
        scanner.scan_directory(&scan_path)
    } else {
        scanner.scan_file(&scan_path)
    }.map_err(|e| e.to_string())?;

    let secret_matches: Vec<SecretMatch> = secrets
        .iter()
        .map(|s| SecretMatch {
            kind: s.kind.to_string(),
            line: s.line,
            column: s.column,
            file_path: s.file_path.clone(),
        })
        .collect();

    Ok(ScanResult {
        total_secrets: secret_matches.len(),
        secrets: secret_matches,
    })
}

#[tauri::command]
async fn get_system_status() -> Result<SystemStatus, String> {
    // In production, integrate with actual node
    Ok(SystemStatus {
        node_running: true,
        uptime_hours: 12.5,
        peers: 3,
        repos: 5,
        current_cost: 5.42,
        projected_cost: 7.20,
    })
}

#[tauri::command]
async fn start_node() -> Result<String, String> {
    // In production, integrate with secular node
    Ok("Node started successfully".to_string())
}

#[tauri::command]
async fn stop_node() -> Result<String, String> {
    Ok("Node stopped successfully".to_string())
}

#[tauri::command]
async fn deploy_to_cloud(config: DeployConfig) -> Result<String, String> {
    // In production, integrate with deployment logic
    Ok(format!(
        "Deploying to {} in region {}...",
        config.platform, config.region
    ))
}

#[tauri::command]
async fn get_cost_metrics() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "compute": 3.65,
        "storage": 0.80,
        "egress": 2.40,
        "static_ip": 2.88,
        "total": 9.73,
        "savings_percent": 68,
        "history": [
            { "date": "2025-10-01", "cost": 8.20 },
            { "date": "2025-10-08", "cost": 9.10 },
            { "date": "2025-10-15", "cost": 8.85 },
            { "date": "2025-10-22", "cost": 9.50 },
            { "date": "2025-10-29", "cost": 9.73 },
        ]
    }))
}

#[tauri::command]
async fn audit_dependencies(path: String) -> Result<serde_json::Value, String> {
    use radicle::security::VulnerabilityScanner;
    use std::path::PathBuf;

    let scanner = VulnerabilityScanner::new().map_err(|e| e.to_string())?;
    let lockfile = PathBuf::from(path).join("Cargo.lock");

    if !lockfile.exists() {
        return Err("Cargo.lock not found".to_string());
    }

    let report = scanner
        .scan_cargo_lock(&lockfile)
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "total_vulnerabilities": report.vulnerabilities.len(),
        "critical": report.critical_count(),
        "high": report.high_count(),
        "vulnerabilities": report.vulnerabilities,
    }))
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            scan_running: Mutex::new(false),
            node_running: Mutex::new(false),
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_for_secrets,
            get_system_status,
            start_node,
            stop_node,
            deploy_to_cloud,
            get_cost_metrics,
            audit_dependencies,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
