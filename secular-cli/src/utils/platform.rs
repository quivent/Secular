//! Platform detection utilities

use std::path::Path;

#[derive(Debug, Clone, PartialEq)]
pub enum Platform {
    Gcp,
    Aws,
    Azure,
    Local,
    Unknown,
}

impl Platform {
    pub fn detect() -> Self {
        if Path::new("/var/run/google.instance").exists() {
            Platform::Gcp
        } else if Path::new("/sys/hypervisor/uuid").exists() {
            // Check for AWS
            if let Ok(uuid) = std::fs::read_to_string("/sys/hypervisor/uuid") {
                if uuid.starts_with("ec2") {
                    return Platform::Aws;
                }
            }
            Platform::Unknown
        } else if Path::new("/var/lib/waagent").exists() {
            Platform::Azure
        } else {
            Platform::Local
        }
    }

    pub fn as_str(&self) -> &str {
        match self {
            Platform::Gcp => "Google Cloud Platform",
            Platform::Aws => "Amazon Web Services",
            Platform::Azure => "Microsoft Azure",
            Platform::Local => "Local",
            Platform::Unknown => "Unknown",
        }
    }
}

pub fn is_systemd() -> bool {
    which::which("systemctl").is_ok()
}

pub fn is_docker() -> bool {
    Path::new("/.dockerenv").exists()
}
