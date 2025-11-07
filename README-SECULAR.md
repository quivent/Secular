# Secular - Secure & Cost-Optimized P2P Code Collaboration

**Secular** is a security-enhanced and cost-optimized fork of [Radicle Heartwood](https://radicle.xyz) - a peer-to-peer code collaboration stack.

**Key Features:**
- 🔒 Built-in secret scanning and vulnerability detection
- 💰 70-85% cost reduction vs. standard deployment ($3-8/month)
- 🚀 Optimized for small teams (3-5 users)
- 🔐 Perfect for highly sensitive source code

**Etymology:** *Secular* (from Latin "saeculum" - generation/age) - representing a modern, pragmatic approach to code collaboration security.

---

## Quick Start

```bash
# Install the CLI
cargo install --path secular-cli

# Create alias
alias sec='secular'

# Initialize
sec init

# Scan for secrets
sec scan

# Deploy to GCP
sec deploy --platform gcp

# Monitor costs
sec monitor
```

---

## CLI Commands

### Core Commands

- `sec init` - Initialize secular node
- `sec scan` - Scan for secrets in commits/files
- `sec audit` - Check dependencies for vulnerabilities
- `sec deploy` - Deploy to cloud (GCP/AWS/Azure)
- `sec monitor` - Monitor resource usage and costs
- `sec node` - Manage P2P node
- `sec backup` - Backup repositories

### Deployment & Operations

- `sec deploy gcp` - Deploy to Google Cloud
- `sec deploy local` - Run locally
- `sec status` - Check deployment status
- `sec logs` - View logs
- `sec shell` - SSH into deployment

### Security

- `sec scan --staged` - Scan staged changes for secrets
- `sec scan --commit <hash>` - Scan specific commit
- `sec audit --lockfile Cargo.lock` - Audit dependencies
- `sec quarantine` - List quarantined commits

### Cost Management

- `sec monitor` - Show current resource usage & cost estimate
- `sec optimize` - Run cost optimization analysis
- `sec archive` - Archive old data to cold storage

---

## Installation

### From Source

```bash
git clone https://github.com/YOUR_USERNAME/secular.git
cd secular
cargo install --path secular-cli --locked
```

### Pre-built Binaries

```bash
# Download latest release
curl -sSf https://secular.dev/install | sh

# Or use cargo
cargo install secular-cli
```

---

## Project Structure

```
secular/
├── secular-cli/          # Main CLI tool (sec command)
├── crates/
│   ├── radicle/          # Core library (with security module)
│   ├── radicle-node/     # P2P daemon
│   └── ...
├── deployment/
│   ├── gcp/              # GCP deployment configs
│   ├── aws/              # AWS deployment configs (future)
│   └── scripts/          # Utility scripts (now CLI subcommands)
└── docs/
    ├── OPTIMIZATION_GUIDE.md
    └── SECURITY.md
```

---

## Cost Comparison

### Traditional Radicle Hosting

```
Instance: e2-small (2 vCPU, 2GB RAM)
Monthly: ~$30

Components:
  Compute:  $12.23
  Storage:  $ 3.20
  Egress:   $12.00
  Static IP: $ 2.88
```

### Secular Optimized Hosting

```
Instance: e2-micro (0.25-1 vCPU, 1GB RAM)
Monthly: ~$3-8

Components:
  Compute:  $ 3.65 (idle shutdown)
  Storage:  $ 0.80 (HDD + compression)
  Egress:   $ 2.40 (delta compression)
  Static IP: $ 2.88
```

**Savings: 70-85%**

---

## Security Features

### Secret Scanning

Automatically detects and prevents commit of sensitive data:

```bash
# Scan current changes
sec scan

# Scan specific file
sec scan --file config.yaml

# Scan entire repo history
sec scan --all
```

Detects:
- AWS & GCP credentials
- GitHub tokens
- Private keys
- API keys & passwords
- JWT tokens
- Stripe/Slack keys

### Vulnerability Detection

Scans dependencies for known security issues:

```bash
# Audit Rust dependencies
sec audit

# Audit specific lockfile
sec audit --lockfile path/to/Cargo.lock

# Fix vulnerabilities
sec audit --fix
```

### Compression

Reduces bandwidth and storage:

```bash
# Enable compression
sec compress --enable

# View compression stats
sec stats compression
```

---

## Deployment

### Deploy to GCP (Recommended)

```bash
# One-command deployment
sec deploy gcp

# Custom configuration
sec deploy gcp \
  --instance-type e2-micro \
  --region us-central1 \
  --disk-size 20GB
```

### Monitor Deployment

```bash
# View status
sec status

# Monitor costs
sec monitor

# View logs
sec logs --follow
```

### Manage Node

```bash
# Start node
sec node start

# Stop node
sec node stop

# View peers
sec node peers

# Check storage
sec node storage
```

---

## Development

### Build from Source

```bash
git clone https://github.com/YOUR_USERNAME/secular.git
cd secular
cargo build --release
```

### Run Tests

```bash
# All tests
cargo test --all

# Security module
cargo test -p radicle security

# CLI tests
cargo test -p secular-cli
```

### Add to Development Path

```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$HOME/secular/target/release:$PATH"
alias sec='secular'
```

---

## Documentation

- [OPTIMIZATION_GUIDE.md](OPTIMIZATION_GUIDE.md) - Complete optimization guide
- [SECURITY.md](docs/SECURITY.md) - Security features documentation
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment guide
- [API.md](docs/API.md) - API documentation

---

## Why "Secular"?

**Secular** represents a pragmatic, modern approach to code collaboration:

- **Secure**: Built-in security scanning
- **Economic**: Cost-optimized for small teams
- **Collaborative**: P2P architecture
- **Universal**: Works for all types of projects
- **Lean**: Minimal resource footprint
- **Autonomous**: Self-hosted, no vendor lock-in
- **Resilient**: Decentralized infrastructure

---

## Comparison: Secular vs. Others

| Feature | Secular | GitHub | GitLab (self-hosted) | Radicle |
|---------|---------|--------|---------------------|---------|
| Cost (3-5 users) | $3-8/mo | $4-21/user/mo | ~$100+/mo | $30+/mo |
| Secret Scanning | ✅ Built-in | ✅ Pro+ | ✅ Ultimate | ❌ |
| Vulnerability Detection | ✅ Built-in | ✅ Pro+ | ✅ Ultimate | ❌ |
| Self-hosted | ✅ | ❌ | ✅ | ✅ |
| P2P Architecture | ✅ | ❌ | ❌ | ✅ |
| Idle Shutdown | ✅ | N/A | ❌ | ❌ |
| Compression | ✅ Advanced | ✅ Basic | ✅ Basic | ✅ Basic |

---

## Contributing

We welcome contributions! Areas of focus:

- Additional secret patterns
- Multi-language vulnerability scanning
- Cloud provider integrations (AWS, Azure)
- Cost optimization strategies
- Documentation improvements

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Roadmap

### Phase 1: Core (✅ Complete)
- [x] Secret scanning
- [x] Vulnerability detection
- [x] Compression
- [x] CLI tool

### Phase 2: Optimization (✅ Complete)
- [x] Idle shutdown
- [x] Cost monitoring
- [x] GCP deployment
- [x] Socket activation

### Phase 3: Advanced (In Progress)
- [ ] Multi-cloud support (AWS, Azure)
- [ ] Web UI deployment
- [ ] Advanced delta compression
- [ ] Tiered storage
- [ ] Real-time alerting

### Phase 4: Enterprise
- [ ] SAML/SSO integration
- [ ] Advanced audit logging
- [ ] Compliance reporting
- [ ] Multi-region deployment
- [ ] High availability setup

---

## License

MIT OR Apache-2.0 (same as Radicle Heartwood)

See [LICENSE-MIT](LICENSE-MIT) and [LICENSE-APACHE](LICENSE-APACHE).

---

## Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/secular/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/secular/discussions)
- **Community**: [Discord](https://discord.gg/secular) (coming soon)

---

## Acknowledgments

Built on [Radicle Heartwood](https://radicle.xyz) by the Radicle team.

Inspired by:
- [Gitleaks](https://github.com/gitleaks/gitleaks) - Secret scanning
- [RustSec](https://rustsec.org/) - Vulnerability database
- [Trivy](https://github.com/aquasecurity/trivy) - Multi-language scanning

---

**Secular: Secure code collaboration for the modern age**

`sec init && sec deploy`
