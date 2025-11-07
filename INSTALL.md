# Secular Installation Guide

## Prerequisites

- **Rust** (1.70+): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node.js** (18+): `brew install node` or https://nodejs.org
- **Radicle CLI**: Install from https://radicle.xyz or build from source

## Quick Install

```bash
# Clone from Radicle
rad clone rad:zyJ2zJQUrgpcqreTkK2vFfWAifSd

cd Secular

# Install CLI
make install

# Install GUI dependencies
cd secular-gui
npm install
```

## Components

### 1. Rust CLI Binary (`secular` / `sec`)

The main Secular CLI tool with security features.

```bash
# Build and install
make install

# Or quick install
make quick

# Usage
sec --help
secular scan
secular audit
```

Installs to `~/.local/bin/secular` (aliased as `sec`)

### 2. Desktop GUI

Beautiful Tauri desktop app for visual management.

```bash
cd secular-gui

# Install dependencies
npm install

# Run in development
npm run tauri dev

# Build for production
npm run tauri build
```

**Installers created at:**
- macOS: `src-tauri/target/release/bundle/dmg/Secular_0.1.0_aarch64.dmg`
- Windows: `src-tauri/target/release/bundle/msi/Secular_0.1.0_x64_en-US.msi`
- Linux: `src-tauri/target/release/bundle/deb/secular-gui_0.1.0_amd64.deb`

### 3. Radicle CLI (`rad`)

The underlying P2P collaboration tool.

```bash
# Build Radicle CLI
cargo build --release -p radicle-cli

# Install
cp target/release/rad ~/.local/bin/
```

## Usage

### CLI Commands

```bash
# Security scanning
sec scan                    # Scan current directory
sec scan ~/my-project       # Scan specific path

# Dependency auditing
sec audit                   # Audit Rust dependencies
sec audit --fix             # Auto-fix vulnerabilities

# Node management
sec node start              # Start P2P node
sec node status             # Check node status

# Deployment
sec deploy                  # Deploy to cloud
sec monitor                 # Monitor resources
```

### Desktop GUI

```bash
# Launch the app
secular gui

# Or from Applications folder
open /Applications/Secular.app
```

**Features:**
- Dashboard with real-time metrics
- Secret scanner with visual results
- Repository browser
- Cost monitoring
- Deployment management

## Updating

### Pull Latest Changes

```bash
# Using rad CLI
rad sync

# Or using git-remote-rad
git pull rad
```

### Rebuild After Update

```bash
# Reinstall CLI
make install

# Rebuild GUI
cd secular-gui
npm install
npm run tauri build
```

## Repository Structure

```
Secular/
├── secular-cli/          # Bash wrapper script
├── secular-gui/          # Tauri desktop app
│   ├── src/             # React + TypeScript frontend
│   │   ├── views/       # Dashboard, Scanner, Monitor, Deploy
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── src-tauri/       # Rust backend
│   │   └── src/main.rs
│   └── package.json
├── crates/
│   ├── radicle/         # Core library (with security module)
│   └── radicle-cli/     # rad command source
├── deployment/          # Cloud deployment configs
├── Makefile             # Build and install automation
└── README-SECULAR.md    # Full documentation
```

## Troubleshooting

### `rad: command not found`

Install the Radicle CLI:

```bash
cargo build --release -p radicle-cli
cp target/release/rad ~/.local/bin/
```

Add to PATH if needed:
```bash
export PATH="$HOME/.local/bin:$PATH"
```

### GUI won't build

Make sure you have all dependencies:

```bash
cd secular-gui
rm -rf node_modules package-lock.json
npm install
npm run tauri build
```

### Permission denied on `secular` command

Make it executable:

```bash
chmod +x ~/.local/bin/secular
# Or
chmod +x secular-cli/secular
```

## Development

### Run GUI in dev mode

```bash
cd secular-gui
npm run tauri dev
```

### Build CLI for development

```bash
make dev
./target/debug/secular --help
```

### Run tests

```bash
cargo test --all
```

## Support

- **Radicle ID**: `rad:zyJ2zJQUrgpcqreTkK2vFfWAifSd`
- **Issues**: Open an issue or patch in Radicle
- **Documentation**: See README-SECULAR.md

---

**Quick Start**: `make install && secular gui`
