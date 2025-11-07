//! Vulnerability detection for dependencies
//!
//! Scans dependencies for known security vulnerabilities

use std::path::{Path, PathBuf};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum VulnerabilityError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Database fetch failed: {0}")]
    DatabaseFetch(String),
    #[error("Lockfile parse error: {0}")]
    LockfileParse(String),
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct Vulnerability {
    pub id: String,
    pub package: String,
    pub version: String,
    pub severity: Severity,
    pub title: String,
    pub description: String,
    pub url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, serde::Serialize)]
pub enum Severity {
    Low,
    Medium,
    High,
    Critical,
}

impl std::fmt::Display for Severity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Severity::Low => write!(f, "LOW"),
            Severity::Medium => write!(f, "MEDIUM"),
            Severity::High => write!(f, "HIGH"),
            Severity::Critical => write!(f, "CRITICAL"),
        }
    }
}

#[derive(Debug, serde::Serialize)]
pub struct ScanReport {
    pub vulnerabilities: Vec<Vulnerability>,
    pub warnings: Vec<String>,
    pub lockfile_path: PathBuf,
}

impl ScanReport {
    pub fn new(lockfile_path: PathBuf) -> Self {
        Self {
            vulnerabilities: Vec::new(),
            warnings: Vec::new(),
            lockfile_path,
        }
    }

    pub fn critical_count(&self) -> usize {
        self.vulnerabilities
            .iter()
            .filter(|v| v.severity == Severity::Critical)
            .count()
    }

    pub fn high_count(&self) -> usize {
        self.vulnerabilities
            .iter()
            .filter(|v| v.severity == Severity::High)
            .count()
    }

    pub fn has_vulnerabilities(&self) -> bool {
        !self.vulnerabilities.is_empty()
    }
}

pub struct VulnerabilityScanner {
    // In a real implementation, this would hold the advisory database
    // For now, we'll use a simplified version
    advisories: Vec<Advisory>,
}

#[derive(Debug, Clone)]
struct Advisory {
    id: String,
    package: String,
    affected_versions: String,
    severity: Severity,
    title: String,
    description: String,
    url: Option<String>,
}

impl VulnerabilityScanner {
    /// Create a new vulnerability scanner
    ///
    /// In production, this would fetch the RustSec advisory database
    pub fn new() -> Result<Self, VulnerabilityError> {
        Ok(Self {
            advisories: Self::load_advisories()?,
        })
    }

    fn load_advisories() -> Result<Vec<Advisory>, VulnerabilityError> {
        // Simplified: In production, fetch from rustsec.org
        // For now, return empty list - will be populated when integrating cargo-audit
        Ok(Vec::new())
    }

    /// Scan a Cargo.lock file for vulnerabilities
    pub fn scan_cargo_lock(&self, lockfile_path: &Path) -> Result<ScanReport, VulnerabilityError> {
        let mut report = ScanReport::new(lockfile_path.to_path_buf());

        if !lockfile_path.exists() {
            return Err(VulnerabilityError::Io(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                format!("Lockfile not found: {}", lockfile_path.display()),
            )));
        }

        // Parse Cargo.lock
        let content = std::fs::read_to_string(lockfile_path)?;
        let packages = self.parse_cargo_lock(&content)?;

        // Check each package against advisories
        for package in packages {
            for advisory in &self.advisories {
                if advisory.package == package.name && self.version_matches(&package.version, &advisory.affected_versions) {
                    report.vulnerabilities.push(Vulnerability {
                        id: advisory.id.clone(),
                        package: package.name.clone(),
                        version: package.version.clone(),
                        severity: advisory.severity.clone(),
                        title: advisory.title.clone(),
                        description: advisory.description.clone(),
                        url: advisory.url.clone(),
                    });
                }
            }
        }

        Ok(report)
    }

    /// Scan all Cargo.lock files in a repository
    pub fn scan_repository(&self, repo_path: &Path) -> Result<Vec<ScanReport>, VulnerabilityError> {
        let mut reports = Vec::new();

        fn find_lockfiles(dir: &Path, lockfiles: &mut Vec<PathBuf>) -> std::io::Result<()> {
            if dir.is_dir() {
                for entry in std::fs::read_dir(dir)? {
                    let entry = entry?;
                    let path = entry.path();

                    // Skip hidden directories and common ignore patterns
                    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                        if name.starts_with('.') || name == "target" || name == "node_modules" {
                            continue;
                        }
                    }

                    if path.is_dir() {
                        find_lockfiles(&path, lockfiles)?;
                    } else if path.file_name() == Some(std::ffi::OsStr::new("Cargo.lock")) {
                        lockfiles.push(path);
                    }
                }
            }
            Ok(())
        }

        let mut lockfiles = Vec::new();
        find_lockfiles(repo_path, &mut lockfiles)?;

        for lockfile in lockfiles {
            if let Ok(report) = self.scan_cargo_lock(&lockfile) {
                reports.push(report);
            }
        }

        Ok(reports)
    }

    fn parse_cargo_lock(&self, content: &str) -> Result<Vec<Package>, VulnerabilityError> {
        let mut packages = Vec::new();

        // Simple TOML parsing for Cargo.lock
        // In production, use the `toml` crate
        let mut current_package: Option<String> = None;
        let mut current_version: Option<String> = None;

        for line in content.lines() {
            let line = line.trim();

            if line.starts_with("name = ") {
                current_package = Some(
                    line.trim_start_matches("name = ")
                        .trim_matches('"')
                        .to_string(),
                );
            } else if line.starts_with("version = ") {
                current_version = Some(
                    line.trim_start_matches("version = ")
                        .trim_matches('"')
                        .to_string(),
                );
            }

            // When we have both name and version, create package
            if let (Some(name), Some(version)) = (&current_package, &current_version) {
                packages.push(Package {
                    name: name.clone(),
                    version: version.clone(),
                });
                current_package = None;
                current_version = None;
            }
        }

        Ok(packages)
    }

    fn version_matches(&self, version: &str, pattern: &str) -> bool {
        // Simplified version matching
        // In production, use semver crate for proper version matching
        version == pattern || pattern == "*"
    }
}

impl Default for VulnerabilityScanner {
    fn default() -> Self {
        Self::new().expect("Failed to create vulnerability scanner")
    }
}

#[derive(Debug, Clone)]
struct Package {
    name: String,
    version: String,
}

/// Simple integration point for cargo-audit
///
/// This is a placeholder that can be replaced with actual cargo-audit integration
pub fn run_cargo_audit(manifest_path: &Path) -> Result<ScanReport, VulnerabilityError> {
    use std::process::Command;

    let output = Command::new("cargo")
        .args(&["audit", "--json", "--manifest-path", manifest_path.to_str().unwrap()])
        .output()
        .map_err(|e| VulnerabilityError::Io(e))?;

    if !output.status.success() {
        return Err(VulnerabilityError::DatabaseFetch(
            String::from_utf8_lossy(&output.stderr).to_string(),
        ));
    }

    // Parse JSON output (simplified)
    let mut report = ScanReport::new(manifest_path.to_path_buf());
    // TODO: Parse cargo audit JSON output properly

    Ok(report)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scanner_creation() {
        let scanner = VulnerabilityScanner::new();
        assert!(scanner.is_ok());
    }

    #[test]
    fn test_lockfile_parsing() {
        let scanner = VulnerabilityScanner::new().unwrap();
        let lockfile_content = r#"
[[package]]
name = "example"
version = "1.0.0"

[[package]]
name = "another"
version = "2.0.0"
"#;

        let packages = scanner.parse_cargo_lock(lockfile_content).unwrap();
        assert_eq!(packages.len(), 2);
        assert_eq!(packages[0].name, "example");
        assert_eq!(packages[0].version, "1.0.0");
    }
}
