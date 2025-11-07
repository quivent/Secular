//! Security module for Radicle
//!
//! This module provides security features including:
//! - Secret scanning in commits and repositories
//! - Vulnerability detection in dependencies
//! - Compression for bandwidth and storage optimization

pub mod secrets;
pub mod vulnerabilities;
pub mod compression;

pub use secrets::SecretScanner;
pub use vulnerabilities::VulnerabilityScanner;
pub use compression::CompressionLayer;
