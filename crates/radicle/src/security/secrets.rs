//! Secret scanning functionality
//!
//! Detects potential secrets (API keys, passwords, tokens) in code

use std::path::Path;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum SecretScanError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("UTF-8 error: {0}")]
    Utf8(#[from] std::string::FromUtf8Error),
    #[error("Scanning failed: {0}")]
    ScanFailed(String),
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct SecretMatch {
    pub kind: SecretKind,
    pub line: usize,
    pub column: usize,
    pub match_text: String,
    pub file_path: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
pub enum SecretKind {
    AwsAccessKey,
    AwsSecretKey,
    GcpApiKey,
    GitHubToken,
    PrivateKey,
    GenericApiKey,
    Password,
    JwtToken,
    SlackToken,
    StripeKey,
    Unknown,
}

impl std::fmt::Display for SecretKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SecretKind::AwsAccessKey => write!(f, "AWS Access Key"),
            SecretKind::AwsSecretKey => write!(f, "AWS Secret Key"),
            SecretKind::GcpApiKey => write!(f, "GCP API Key"),
            SecretKind::GitHubToken => write!(f, "GitHub Token"),
            SecretKind::PrivateKey => write!(f, "Private Key"),
            SecretKind::GenericApiKey => write!(f, "Generic API Key"),
            SecretKind::Password => write!(f, "Password"),
            SecretKind::JwtToken => write!(f, "JWT Token"),
            SecretKind::SlackToken => write!(f, "Slack Token"),
            SecretKind::StripeKey => write!(f, "Stripe Key"),
            SecretKind::Unknown => write!(f, "Unknown Secret"),
        }
    }
}

pub struct SecretScanner {
    patterns: Vec<SecretPattern>,
}

struct SecretPattern {
    kind: SecretKind,
    regex: regex::Regex,
}

impl SecretScanner {
    pub fn new() -> Self {
        let patterns = Self::build_patterns();
        Self { patterns }
    }

    fn build_patterns() -> Vec<SecretPattern> {
        use regex::Regex;

        vec![
            SecretPattern {
                kind: SecretKind::AwsAccessKey,
                regex: Regex::new(r"AKIA[0-9A-Z]{16}").unwrap(),
            },
            SecretPattern {
                kind: SecretKind::AwsSecretKey,
                regex: Regex::new(r#"(?i)aws(.{0,20})?['"][0-9a-zA-Z/+]{40}['"]"#).unwrap(),
            },
            SecretPattern {
                kind: SecretKind::GcpApiKey,
                regex: Regex::new(r"AIza[0-9A-Za-z\\-_]{35}").unwrap(),
            },
            SecretPattern {
                kind: SecretKind::GitHubToken,
                regex: Regex::new(r"gh[pousr]_[0-9a-zA-Z]{36}").unwrap(),
            },
            SecretPattern {
                kind: SecretKind::PrivateKey,
                regex: Regex::new(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----").unwrap(),
            },
            SecretPattern {
                kind: SecretKind::GenericApiKey,
                regex: Regex::new(r#"(?i)(api[_-]?key|apikey)[\s]*[=:][\s]*['"]([0-9a-zA-Z]{32,})['"]"#).unwrap(),
            },
            SecretPattern {
                kind: SecretKind::JwtToken,
                regex: Regex::new(r"eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+").unwrap(),
            },
            SecretPattern {
                kind: SecretKind::SlackToken,
                regex: Regex::new(r"xox[baprs]-[0-9a-zA-Z]{10,48}").unwrap(),
            },
            SecretPattern {
                kind: SecretKind::StripeKey,
                regex: Regex::new(r"sk_live_[0-9a-zA-Z]{24,}").unwrap(),
            },
        ]
    }

    /// Scan text content for secrets
    pub fn scan_text(&self, text: &str) -> Result<Vec<SecretMatch>, SecretScanError> {
        let mut matches = Vec::new();

        for (line_num, line) in text.lines().enumerate() {
            for pattern in &self.patterns {
                for capture in pattern.regex.find_iter(line) {
                    matches.push(SecretMatch {
                        kind: pattern.kind.clone(),
                        line: line_num + 1,
                        column: capture.start(),
                        match_text: self.redact_secret(capture.as_str()),
                        file_path: None,
                    });
                }
            }
        }

        Ok(matches)
    }

    /// Scan a file for secrets
    pub fn scan_file(&self, path: &Path) -> Result<Vec<SecretMatch>, SecretScanError> {
        let content = std::fs::read_to_string(path)?;
        let mut matches = self.scan_text(&content)?;

        // Add file path to matches
        let path_str = path.to_string_lossy().to_string();
        for m in &mut matches {
            m.file_path = Some(path_str.clone());
        }

        Ok(matches)
    }

    /// Scan a directory recursively
    pub fn scan_directory(&self, dir: &Path) -> Result<Vec<SecretMatch>, SecretScanError> {
        use std::fs;

        let mut all_matches = Vec::new();

        fn visit_dirs(
            scanner: &SecretScanner,
            dir: &Path,
            matches: &mut Vec<SecretMatch>,
        ) -> Result<(), SecretScanError> {
            if dir.is_dir() {
                for entry in fs::read_dir(dir)? {
                    let entry = entry?;
                    let path = entry.path();

                    // Skip hidden files and directories
                    if path.file_name()
                        .and_then(|n| n.to_str())
                        .map(|n| n.starts_with('.'))
                        .unwrap_or(false)
                    {
                        continue;
                    }

                    if path.is_dir() {
                        visit_dirs(scanner, &path, matches)?;
                    } else if path.is_file() {
                        // Skip binary files
                        if let Ok(file_matches) = scanner.scan_file(&path) {
                            matches.extend(file_matches);
                        }
                    }
                }
            }
            Ok(())
        }

        visit_dirs(self, dir, &mut all_matches)?;
        Ok(all_matches)
    }

    /// Scan a git diff for secrets
    pub fn scan_diff(&self, diff: &str) -> Result<Vec<SecretMatch>, SecretScanError> {
        // Only scan added lines (starting with +)
        let added_lines: String = diff
            .lines()
            .filter(|line| line.starts_with('+') && !line.starts_with("+++"))
            .map(|line| &line[1..])  // Remove the + prefix
            .collect::<Vec<_>>()
            .join("\n");

        self.scan_text(&added_lines)
    }

    fn redact_secret(&self, secret: &str) -> String {
        if secret.len() <= 8 {
            "*".repeat(secret.len())
        } else {
            format!("{}...{}", &secret[..4], &secret[secret.len()-4..])
        }
    }
}

impl Default for SecretScanner {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_aws_access_key_detection() {
        let scanner = SecretScanner::new();
        let text = "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE";

        let matches = scanner.scan_text(text).unwrap();
        assert!(!matches.is_empty());
        assert_eq!(matches[0].kind, SecretKind::AwsAccessKey);
    }

    #[test]
    fn test_github_token_detection() {
        let scanner = SecretScanner::new();
        let text = "GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuv";

        let matches = scanner.scan_text(text).unwrap();
        assert!(!matches.is_empty());
        assert_eq!(matches[0].kind, SecretKind::GitHubToken);
    }

    #[test]
    fn test_private_key_detection() {
        let scanner = SecretScanner::new();
        let text = "-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----";

        let matches = scanner.scan_text(text).unwrap();
        assert!(!matches.is_empty());
        assert_eq!(matches[0].kind, SecretKind::PrivateKey);
    }

    #[test]
    fn test_diff_scanning() {
        let scanner = SecretScanner::new();
        let diff = r#"
diff --git a/config.yml b/config.yml
index 1234567..abcdefg 100644
--- a/config.yml
+++ b/config.yml
@@ -1,3 +1,4 @@
 database:
   host: localhost
+  api_key: "AKIAIOSFODNN7EXAMPLE"
"#;

        let matches = scanner.scan_diff(diff).unwrap();
        assert!(!matches.is_empty());
    }
}
