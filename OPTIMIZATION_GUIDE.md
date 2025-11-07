# Radicle Secure - Optimization & Security Implementation Guide

**Project:** Radicle Heartwood Fork with Security Enhancements
**Goal:** Add secret scanning, vulnerability detection, and reduce hosting costs by 70-85%
**Target Cost:** $3-8/month (from $30/month baseline)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Adding Security Features](#adding-security-features)
3. [Hosting Cost Breakdown Analysis](#hosting-cost-breakdown-analysis)
4. [Optimization Strategies](#optimization-strategies)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Deployment Guide](#deployment-guide)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Project Overview

### Repository Structure

```
radicle-secure/
├── crates/
│   ├── radicle/              # Core library
│   ├── radicle-cli/          # Command-line interface
│   ├── radicle-node/         # P2P network daemon
│   ├── radicle-remote-helper/# Git remote helper
│   └── ...                   # Other supporting crates
├── Cargo.toml                # Workspace configuration
└── systemd/                  # Systemd unit files
```

### Key Components

- **radicle-cli**: User-facing CLI tool
- **radicle-node**: Always-on P2P daemon (optimization target)
- **radicle-httpd**: HTTP API gateway (if added)
- **rad-web**: Web interface (deploy separately to reduce costs)

### License

MIT OR Apache-2.0 (fully permissive - fork-friendly)

---

## Adding Security Features

### 1. Secret Scanning Integration

**Available Rust Libraries:**

| Library    | Speed                        | Accuracy                | Integration Complexity |
|------------|------------------------------|-------------------------|------------------------|
| ripsecrets | 95x faster than alternatives | High                    | Low - simple CLI       |
| secretscan | 51,020 files/sec             | 99% detection           | Low - library API      |
| guardy     | Multi-threaded               | High (entropy analysis) | Medium - git hooks     |

#### Implementation Approach

```rust
// Create: crates/radicle/src/security/mod.rs
pub mod secrets;
pub mod vulnerabilities;
pub mod compression;

// Create: crates/radicle/src/security/secrets.rs
use secretscan::{Scanner, SecretMatch};
use std::path::Path;

pub struct SecretScanner {
    scanner: Scanner,
}

impl SecretScanner {
    pub fn new() -> Self {
        Self {
            scanner: Scanner::default(),
        }
    }

    /// Scan a git diff for secrets
    pub fn scan_diff(&self, diff: &str) -> Result<Vec<SecretMatch>, Error> {
        self.scanner.scan_text(diff)
    }

    /// Scan a file for secrets
    pub fn scan_file(&self, path: &Path) -> Result<Vec<SecretMatch>, Error> {
        self.scanner.scan_file(path)
    }

    /// Scan an entire repository
    pub fn scan_repository(&self, repo_path: &Path) -> Result<Vec<SecretMatch>, Error> {
        self.scanner.scan_directory(repo_path)
    }
}
```

#### Integration Points

**A. Pre-commit hooks in radicle-cli**

```rust
// Modify: crates/radicle-cli/src/commands/push.rs
use radicle::security::secrets::SecretScanner;

pub fn run(options: Options, ctx: impl term::Context) -> anyhow::Result<()> {
    // Existing code...

    // Add secret scanning before push
    let scanner = SecretScanner::new();
    let commits = get_new_commits(&repo)?;

    for commit in commits {
        let diff = commit.diff()?;
        if let Ok(secrets) = scanner.scan_diff(&diff) {
            if !secrets.is_empty() {
                term::error(format!("Found {} potential secrets in commit {}",
                    secrets.len(), commit.id()));
                for secret in secrets {
                    term::warning(format!("  {} at line {}", secret.kind, secret.line));
                }
                return Err(anyhow!("Commit contains potential secrets. Aborting."));
            }
        }
    }

    // Continue with push...
}
```

**B. Real-time scanning in radicle-node during replication**

```rust
// Modify: crates/radicle-node/src/service/sync.rs
use radicle::security::secrets::SecretScanner;

async fn sync_repository(&self, repo: &Repository) -> Result<(), Error> {
    let scanner = SecretScanner::new();

    // Scan incoming commits during replication
    for commit in repo.new_commits() {
        let diff = commit.diff()?;
        if let Ok(secrets) = scanner.scan_diff(&diff) {
            if !secrets.is_empty() {
                log::warn!("Found {} potential secrets in replicated commit {}",
                    secrets.len(), commit.id());
                // Optionally: quarantine, reject, or alert
            }
        }
    }

    // Continue sync...
    Ok(())
}
```

**C. API endpoint for on-demand scans**

```rust
// Create: crates/radicle-node/src/api/security.rs
use radicle::security::secrets::SecretScanner;
use axum::{Json, extract::Path};

#[derive(Deserialize)]
pub struct ScanRequest {
    repo_id: String,
    commit_id: Option<String>,
}

pub async fn scan_repository(
    Path(repo_id): Path<String>,
) -> Result<Json<ScanResult>, Error> {
    let scanner = SecretScanner::new();
    let repo = Repository::open(&repo_id)?;

    let secrets = scanner.scan_repository(repo.path())?;

    Ok(Json(ScanResult {
        total_secrets: secrets.len(),
        secrets: secrets.into_iter().map(|s| s.into()).collect(),
    }))
}
```

---

### 2. Vulnerability Detection Integration

#### RustSec Integration

```rust
// Create: crates/radicle/src/security/vulnerabilities.rs
use rustsec::{Database, Lockfile, Warning};
use std::path::Path;

pub struct VulnerabilityScanner {
    db: Database,
}

impl VulnerabilityScanner {
    pub fn new() -> Result<Self, Error> {
        let db = Database::fetch()?;
        Ok(Self { db })
    }

    /// Scan a Cargo.lock file for known vulnerabilities
    pub fn scan_cargo_lock(&self, lockfile_path: &Path) -> Result<ScanReport, Error> {
        let lockfile = Lockfile::load(lockfile_path)?;
        let warnings = rustsec::Warning::load_from_lockfile(&lockfile, &self.db)?;

        Ok(ScanReport {
            vulnerabilities: warnings.vulnerabilities.len(),
            warnings: warnings.warnings.len(),
            details: warnings,
        })
    }

    /// Scan all Cargo.lock files in a repository
    pub fn scan_repository(&self, repo_path: &Path) -> Result<Vec<ScanReport>, Error> {
        let mut reports = Vec::new();

        for entry in walkdir::WalkDir::new(repo_path)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if entry.file_name() == "Cargo.lock" {
                if let Ok(report) = self.scan_cargo_lock(entry.path()) {
                    reports.push(report);
                }
            }
        }

        Ok(reports)
    }
}

#[derive(Debug, Serialize)]
pub struct ScanReport {
    pub vulnerabilities: usize,
    pub warnings: usize,
    pub details: Warning,
}
```

#### Multi-Language Support (Trivy Integration)

```rust
// Create: crates/radicle/src/security/trivy.rs
use std::process::Command;
use serde_json::Value;

pub struct TrivyScanner {
    trivy_path: PathBuf,
}

impl TrivyScanner {
    pub fn new() -> Result<Self, Error> {
        // Check if trivy is installed
        let trivy_path = which::which("trivy")?;
        Ok(Self { trivy_path })
    }

    /// Scan a filesystem for vulnerabilities
    pub fn scan_filesystem(&self, path: &Path) -> Result<TrivyReport, Error> {
        let output = Command::new(&self.trivy_path)
            .args(&["fs", "--format", "json", path.to_str().unwrap()])
            .output()?;

        let report: Value = serde_json::from_slice(&output.stdout)?;
        Ok(TrivyReport::from_json(report))
    }
}
```

---

## Hosting Cost Breakdown Analysis

### Where Costs Come From

| Component          | Cost Driver               | % of Total | Optimization Potential |
|--------------------|---------------------------|------------|------------------------|
| **Compute (VM)**   | vCPU + RAM always running | 40-50%     | ⭐⭐⭐⭐⭐ High             |
| **Storage**        | SSD persistent disks      | 15-20%     | ⭐⭐⭐ Medium             |
| **Bandwidth (Egress)** | Data transfer out     | 25-35%     | ⭐⭐⭐⭐ High              |
| **Static IP**      | Reserved address          | 5-10%      | ⭐ Low                  |
| **Snapshots/Backups** | Optional redundancy    | 5-10%      | ⭐⭐⭐ Medium             |

### Detailed Cost Breakdown (e2-small example)

```
Monthly Costs:
├─ Compute: $12.23 (730 hrs × $0.01675/hr)
├─ Storage: $3.20 (20 GB × $0.16/GB)
├─ Egress: $12.00 (100 GB × $0.12/GB)
├─ Static IP: $2.88 (when not attached to running instance)
└─ Total: ~$30.31/month
```

**Key Insight:** Bandwidth egress is surprisingly expensive and scales with usage!

---

## Optimization Strategies

### 1. Compute Optimization (Reduce VM costs by 60-80%)

#### A. On-Demand Architecture

**Current:** radicle-node runs 24/7
**Optimized:** Socket activation + smart sleep

```rust
// Modify: crates/radicle-node/src/main.rs
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use std::sync::Arc;

struct IdleMonitor {
    last_activity: Arc<RwLock<Instant>>,
    idle_timeout: Duration,
}

impl IdleMonitor {
    fn new(idle_timeout: Duration) -> Self {
        Self {
            last_activity: Arc::new(RwLock::new(Instant::now())),
            idle_timeout,
        }
    }

    async fn record_activity(&self) {
        let mut last = self.last_activity.write().await;
        *last = Instant::now();
    }

    async fn check_idle(&self) -> bool {
        let last = self.last_activity.read().await;
        last.elapsed() > self.idle_timeout
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let node = Node::new()?;
    let monitor = IdleMonitor::new(Duration::from_secs(600)); // 10 min timeout

    // Clone for idle monitoring task
    let monitor_clone = Arc::new(monitor);
    let node_clone = node.clone();

    // Spawn idle monitor
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(60)).await;

            if monitor_clone.check_idle().await {
                log::info!("Node idle for 10 minutes, initiating shutdown...");

                // Persist state to disk
                if let Err(e) = node_clone.persist_state().await {
                    log::error!("Failed to persist state: {}", e);
                }

                // Graceful shutdown
                node_clone.shutdown().await;
                std::process::exit(0);
            }
        }
    });

    // Start node with activity tracking
    node.serve_with_monitor(monitor_clone).await?;

    Ok(())
}
```

**Cost Impact:**
- From 24/7 uptime → ~4-8 hrs/day active
- **Savings: ~70%** ($12/mo → $4/mo)

#### B. Systemd Socket Activation

```ini
# Create: systemd/radicle-node.socket
[Unit]
Description=Radicle Node Socket
PartOf=radicle-node.service

[Socket]
ListenStream=8776
Accept=false

[Install]
WantedBy=sockets.target
```

```ini
# Modify: systemd/radicle-node.service
[Unit]
Description=Radicle Node
Requires=radicle-node.socket
After=network.target radicle-node.socket

[Service]
Type=notify
ExecStart=/usr/local/bin/radicle-node
Restart=on-failure

# Auto-shutdown after idle
TimeoutStopSec=10
KillMode=mixed

[Install]
WantedBy=multi-user.target
```

---

### 2. Storage Optimization (Reduce by 40-50%)

#### A. Compression Middleware

```rust
// Create: crates/radicle/src/security/compression.rs
use zstd::stream::{encode_all, decode_all};
use std::io::{Read, Write};

pub struct CompressionLayer {
    level: i32,
}

impl CompressionLayer {
    pub fn new(level: i32) -> Self {
        Self { level }
    }

    /// Compress data using zstd
    pub fn compress(&self, data: &[u8]) -> Result<Vec<u8>, Error> {
        Ok(encode_all(data, self.level)?)
    }

    /// Decompress zstd data
    pub fn decompress(&self, compressed: &[u8]) -> Result<Vec<u8>, Error> {
        Ok(decode_all(compressed)?)
    }
}

// Usage in storage layer
// Modify: crates/radicle/src/storage/git.rs
use crate::security::compression::CompressionLayer;

impl Storage {
    pub fn store_object_compressed(&self, oid: Oid, data: &[u8]) -> Result<(), Error> {
        let compressor = CompressionLayer::new(3); // Level 3 for speed/ratio balance
        let compressed = compressor.compress(data)?;

        // Store compressed version
        self.write_object(oid, &compressed)?;
        Ok(())
    }

    pub fn read_object_compressed(&self, oid: Oid) -> Result<Vec<u8>, Error> {
        let compressed = self.read_object(oid)?;
        let compressor = CompressionLayer::new(3);
        Ok(compressor.decompress(&compressed)?)
    }
}
```

**Impact:** 30-50% storage reduction for text-heavy repos

#### B. Tiered Storage

```rust
// Create: crates/radicle-node/src/storage/tiered.rs
use chrono::{DateTime, Utc, Duration};
use std::path::PathBuf;

pub struct TieredStorage {
    hot_storage: PathBuf,
    cold_storage: String, // GCS bucket URI
    archive_threshold: Duration,
}

impl TieredStorage {
    pub fn new(hot: PathBuf, cold: String) -> Self {
        Self {
            hot_storage: hot,
            cold_storage: cold,
            archive_threshold: Duration::days(90),
        }
    }

    /// Archive old commits to cold storage
    pub async fn archive_cold_data(&self, repo: &Repository) -> Result<(), Error> {
        let cutoff = Utc::now() - self.archive_threshold;
        let old_commits = repo.commits_older_than(cutoff)?;

        for commit in old_commits {
            // Upload to GCS cold storage
            self.move_to_cold_storage(&commit).await?;

            // Keep metadata locally, remove blob data
            self.create_cold_reference(&commit)?;
        }

        Ok(())
    }

    async fn move_to_cold_storage(&self, commit: &Commit) -> Result<(), Error> {
        // Implementation using google-cloud-storage crate
        // Store in coldline storage class
        todo!()
    }
}
```

**Cost Comparison:**
- SSD persistent disk: $0.16/GB/month
- HDD persistent disk: $0.04/GB/month (75% cheaper)
- Coldline Storage: $0.004/GB/month (96% cheaper!)

**Savings:** For 50GB data, $8/mo → $2/mo (75%)

---

### 3. Bandwidth Optimization (Reduce by 60-70%)

#### A. Delta Compression Enhancement

```rust
// Modify: crates/radicle-fetch/src/transport.rs
use git2::{DeltaType, Odb};

pub struct OptimizedTransport {
    use_delta: bool,
}

impl OptimizedTransport {
    /// Send repository updates using delta compression
    pub async fn replicate_with_delta(
        &self,
        peer: &Peer,
        refs: &[Ref]
    ) -> Result<(), Error> {
        // Compute deltas instead of full objects
        let deltas = self.compute_minimal_deltas(refs)?;

        // Send packed delta stream
        peer.send_pack(deltas).await?;

        Ok(())
    }

    fn compute_minimal_deltas(&self, refs: &[Ref]) -> Result<Vec<Delta>, Error> {
        // Use git pack protocol with aggressive delta compression
        // 70-90% size reduction vs full objects
        todo!()
    }
}
```

**Impact:** 70-90% bandwidth reduction for incremental syncs

#### B. HTTP Compression Middleware

```rust
// Create: crates/radicle-node/src/api/compression.rs
use async_compression::tokio::bufread::BrotliEncoder;
use axum::{
    body::Body,
    http::{Request, Response, header},
    middleware::Next,
};
use tokio::io::AsyncReadExt;

pub async fn compression_middleware(
    req: Request<Body>,
    next: Next,
) -> Result<Response<Body>, Error> {
    let response = next.run(req).await;

    // Check if client accepts brotli
    if !accepts_encoding(&req, "br") {
        return Ok(response);
    }

    // Compress response body
    let (parts, body) = response.into_parts();
    let body_bytes = body.collect().await?.to_bytes();

    let mut encoder = BrotliEncoder::new(&body_bytes[..]);
    let mut compressed = Vec::new();
    encoder.read_to_end(&mut compressed).await?;

    let mut response = Response::from_parts(parts, Body::from(compressed));
    response.headers_mut().insert(
        header::CONTENT_ENCODING,
        "br".parse().unwrap()
    );

    Ok(response)
}

fn accepts_encoding(req: &Request<Body>, encoding: &str) -> bool {
    req.headers()
        .get(header::ACCEPT_ENCODING)
        .and_then(|v| v.to_str().ok())
        .map(|v| v.contains(encoding))
        .unwrap_or(false)
}
```

**Impact:** 50-70% bandwidth reduction for API calls

---

### 4. Component Optimization

#### Remove/Externalize Web UI

**Current Architecture:**
```
radicle-node (running 24/7)
├── P2P networking
├── HTTP API server
└── Static web UI serving  ← Wastes resources
```

**Optimized Architecture:**
```
radicle-node (idle-aware)
└── P2P networking + HTTP API

rad-web (external)
└── Deploy to Vercel/Netlify (FREE)
```

**Implementation:**

```bash
# Deploy web UI to Vercel
cd rad-web  # If it exists in the repo
vercel deploy --prod

# Update environment configuration
export RADICLE_API_URL=https://your-node-ip:8776
```

**Savings:** ~500MB RAM, ~0.5 vCPU → ~$6-8/month

---

## Implementation Roadmap

### Phase 1: Low-Hanging Fruit (Week 1-2)

**Estimated Savings: 30-40%**

```bash
cd radicle-secure

# 1. Add security dependencies
cat >> Cargo.toml << 'EOF'

# Security enhancements
secretscan = "0.2"
rustsec = "0.28"
walkdir = "2"

# Compression
zstd = "0.13"
async-compression = { version = "0.4", features = ["tokio", "brotli"] }
EOF

# 2. Create security module structure
mkdir -p crates/radicle/src/security
cat > crates/radicle/src/security/mod.rs << 'EOF'
pub mod secrets;
pub mod vulnerabilities;
pub mod compression;
EOF

# 3. Update radicle lib.rs to include security module
echo "pub mod security;" >> crates/radicle/src/lib.rs

# 4. Implement secret scanning (copy code from above)
# Create crates/radicle/src/security/secrets.rs

# 5. Implement vulnerability scanning
# Create crates/radicle/src/security/vulnerabilities.rs

# 6. Implement compression
# Create crates/radicle/src/security/compression.rs

# 7. Test compilation
cargo build --all

# 8. Run tests
cargo test --all
```

**Deliverables:**
- ✅ Secret scanning functionality
- ✅ Vulnerability detection
- ✅ Compression utilities
- ✅ All tests passing

---

### Phase 2: Architecture Changes (Week 3-4)

**Estimated Savings: 50-60% total**

```bash
# 1. Implement idle timeout in radicle-node
# Modify crates/radicle-node/src/main.rs (see code above)

# 2. Update systemd units for socket activation
cp systemd/radicle-node.service systemd/radicle-node.service.bak
# Edit systemd files (see code above)

# 3. Add compression middleware to HTTP API
# Modify crates/radicle-node/src/api/mod.rs

# 4. Test idle behavior
cargo build --release
./target/release/radicle-node --idle-timeout 600

# Monitor for 10+ minutes and verify shutdown
```

**Deliverables:**
- ✅ Idle-aware node daemon
- ✅ Socket activation support
- ✅ HTTP response compression
- ✅ Reduced runtime hours

---

### Phase 3: Advanced Optimization (Week 5-8)

**Estimated Savings: 70-80% total**

```bash
# 1. Implement tiered storage
# Create crates/radicle-node/src/storage/tiered.rs

# 2. Add GCS cold storage support
cargo add google-cloud-storage

# 3. Optimize delta compression
# Modify crates/radicle-fetch/src/transport.rs

# 4. Deploy web UI externally
cd rad-web  # If available
vercel deploy --prod

# 5. Configure CDN caching
# Setup Cloud CDN for static content
```

**Deliverables:**
- ✅ Tiered hot/cold storage
- ✅ Enhanced delta compression
- ✅ External web UI deployment
- ✅ CDN integration

---

## Deployment Guide

### Local Development Setup

```bash
# 1. Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Clone and build
cd radicle-secure
cargo build --release

# 3. Install locally
cargo install --path crates/radicle-cli --force --locked
cargo install --path crates/radicle-node --force --locked
cargo install --path crates/radicle-remote-helper --force --locked

# 4. Initialize node
rad auth init
rad node start
```

---

### GCP Deployment (e2-micro - Optimized)

#### 1. Create VM Instance

```bash
# Create instance with minimal specs
gcloud compute instances create radicle-node \
  --machine-type=e2-micro \
  --zone=us-central1-a \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --boot-disk-type=pd-standard \
  --tags=radicle-node

# Reserve static IP
gcloud compute addresses create radicle-ip \
  --region=us-central1

# Attach static IP
gcloud compute instances add-access-config radicle-node \
  --zone=us-central1-a \
  --address=$(gcloud compute addresses describe radicle-ip \
    --region=us-central1 --format='value(address)')
```

#### 2. Configure Firewall

```bash
# Allow P2P traffic
gcloud compute firewall-rules create radicle-p2p \
  --allow=tcp:8776 \
  --target-tags=radicle-node \
  --description="Radicle P2P port"

# Optional: Allow HTTP API (restrict to your IP)
gcloud compute firewall-rules create radicle-api \
  --allow=tcp:8777 \
  --source-ranges=YOUR_IP/32 \
  --target-tags=radicle-node
```

#### 3. Deploy Application

```bash
# SSH into instance
gcloud compute ssh radicle-node --zone=us-central1-a

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Clone and build
git clone https://github.com/YOUR_USERNAME/radicle-secure.git
cd radicle-secure
cargo build --release

# Install binaries
sudo cp target/release/radicle-node /usr/local/bin/
sudo cp target/release/rad /usr/local/bin/
sudo cp target/release/git-remote-rad /usr/local/bin/

# Setup systemd
sudo cp systemd/radicle-node.service /etc/systemd/system/
sudo cp systemd/radicle-node.socket /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable radicle-node.socket
sudo systemctl start radicle-node.socket
```

#### 4. Initialize Node

```bash
# Create radicle user
sudo useradd -r -s /bin/false radicle
sudo mkdir -p /var/lib/radicle
sudo chown radicle:radicle /var/lib/radicle

# Initialize as radicle user
sudo -u radicle rad auth init
sudo -u radicle rad node start
```

---

### Cost Monitoring

```bash
# Create monitoring script
cat > /usr/local/bin/radicle-cost-monitor.sh << 'EOF'
#!/bin/bash

# Monitor resource usage
echo "=== Radicle Node Resource Usage ==="
echo "Uptime: $(uptime -p)"
echo "CPU: $(top -bn1 | grep "radicle-node" | awk '{print $9"%"}')"
echo "Memory: $(ps aux | grep radicle-node | awk '{print $4"%"}')"
echo "Disk: $(df -h /var/lib/radicle | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"

# Estimate monthly costs
HOURS_UP=$(awk '{print int($1/3600)}' /proc/uptime)
MONTHLY_HOURS=$((HOURS_UP * 30 / $(date +%d)))
COMPUTE_COST=$(echo "$MONTHLY_HOURS * 0.00508" | bc -l)
STORAGE_COST=$(echo "$(df -BG /var/lib/radicle | tail -1 | awk '{print $3}' | tr -d 'G') * 0.04" | bc -l)

echo ""
echo "=== Estimated Monthly Costs ==="
printf "Compute (e2-micro): \$%.2f\n" $COMPUTE_COST
printf "Storage (HDD): \$%.2f\n" $STORAGE_COST
printf "Total: \$%.2f\n" $(echo "$COMPUTE_COST + $STORAGE_COST" | bc -l)
EOF

chmod +x /usr/local/bin/radicle-cost-monitor.sh

# Add to crontab for daily reports
(crontab -l 2>/dev/null; echo "0 9 * * * /usr/local/bin/radicle-cost-monitor.sh | mail -s 'Radicle Daily Report' you@example.com") | crontab -
```

---

## Monitoring & Maintenance

### Health Check Endpoints

```rust
// Add to crates/radicle-node/src/api/health.rs
use axum::{Json, response::IntoResponse};
use serde_json::json;

pub async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "healthy",
        "version": env!("CARGO_PKG_VERSION"),
        "uptime": get_uptime(),
    }))
}

pub async fn metrics() -> impl IntoResponse {
    Json(json!({
        "peers": get_peer_count(),
        "repos": get_repo_count(),
        "disk_usage": get_disk_usage(),
        "memory_usage": get_memory_usage(),
    }))
}
```

### Logging Configuration

```bash
# Configure log rotation
sudo cat > /etc/logrotate.d/radicle << EOF
/var/log/radicle/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 radicle radicle
}
EOF
```

### Backup Strategy

```bash
# Automated backup script
cat > /usr/local/bin/radicle-backup.sh << 'EOF'
#!/bin/bash

BACKUP_DATE=$(date +%Y%m%d)
BACKUP_DIR="/var/backups/radicle"
DATA_DIR="/var/lib/radicle"

mkdir -p $BACKUP_DIR

# Backup repositories
tar -czf $BACKUP_DIR/repos-$BACKUP_DATE.tar.gz $DATA_DIR/repos

# Backup configuration
tar -czf $BACKUP_DIR/config-$BACKUP_DATE.tar.gz $DATA_DIR/config

# Upload to GCS (optional)
gsutil cp $BACKUP_DIR/repos-$BACKUP_DATE.tar.gz gs://your-backup-bucket/
gsutil cp $BACKUP_DIR/config-$BACKUP_DATE.tar.gz gs://your-backup-bucket/

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DATE"
EOF

chmod +x /usr/local/bin/radicle-backup.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/radicle-backup.sh") | crontab -
```

---

## Final Cost Comparison

| Configuration                             | Monthly Cost | Savings |
|-------------------------------------------|--------------|---------|
| **Stock Radicle (e2-small)**              | $30          | Baseline |
| **+ Secret Scanning**                     | $32          | -$2 (minimal overhead) |
| **+ Phase 1 Optimizations**               | $20          | 33% |
| **+ Phase 2 Optimizations**               | $12          | 60% |
| **+ Phase 3 Optimizations**               | $8           | 73% |
| **Full Optimization (e2-micro + aggressive)** | $3-5     | 83-90% |

---

## Security Best Practices

### 1. Secret Scanning Pre-Commit Hook

```bash
# Install pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Run secret scanner on staged files
rad scan --staged

if [ $? -ne 0 ]; then
    echo "❌ Secret scanning failed. Commit aborted."
    exit 1
fi

echo "✅ Secret scanning passed."
exit 0
EOF

chmod +x .git/hooks/pre-commit
```

### 2. Regular Vulnerability Audits

```bash
# Weekly vulnerability scan
cat > /etc/cron.weekly/radicle-audit << 'EOF'
#!/bin/bash

cd /opt/radicle-secure
cargo audit >> /var/log/radicle/audit.log 2>&1

# Alert if vulnerabilities found
if grep -q "Vulnerabilities found" /var/log/radicle/audit.log; then
    echo "Vulnerabilities detected in Radicle dependencies" | \
        mail -s "Radicle Security Alert" admin@example.com
fi
EOF

chmod +x /etc/cron.weekly/radicle-audit
```

### 3. Access Control

```bash
# Restrict node access to specific peers
rad config set node.policy restricted
rad config set node.allowed-peers "peer1,peer2,peer3"

# Enable signature verification
rad config set node.verify-signatures true
```

---

## Troubleshooting

### Node Won't Start

```bash
# Check systemd status
sudo systemctl status radicle-node

# View logs
sudo journalctl -u radicle-node -f

# Check socket activation
sudo systemctl status radicle-node.socket

# Verify permissions
sudo ls -la /var/lib/radicle
```

### High Bandwidth Usage

```bash
# Monitor network traffic
sudo iftop -i eth0

# Check peer connections
rad node peers

# Limit replication bandwidth
rad config set node.max-bandwidth 1MB
```

### Storage Issues

```bash
# Check disk usage
du -sh /var/lib/radicle/*

# Run garbage collection
rad node gc

# Archive old data
/usr/local/bin/radicle-archive-cold-data.sh
```

---

## Next Steps

1. **Complete Phase 1** implementation (security features)
2. **Test** thoroughly in local environment
3. **Deploy** to GCP e2-micro instance
4. **Monitor** costs and performance for 1 week
5. **Iterate** on Phase 2 & 3 optimizations
6. **Document** team workflows and best practices

---

## References

- [Radicle Documentation](https://radicle.xyz/guides)
- [RustSec Advisory Database](https://rustsec.org/)
- [Secretscan Crate](https://crates.io/crates/secretscan)
- [GCP Pricing Calculator](https://cloud.google.com/products/calculator)
- [Zstd Compression](https://facebook.github.io/zstd/)

---

**Last Updated:** 2025-11-02
**Version:** 1.0
**Author:** Radicle Secure Project
