# Secular CLI - Go/Cobra Port

A secure & cost-optimized P2P code collaboration CLI tool, ported from Rust to Go with full cyan/ocean blue styling.

## Features

- **Full Cyan/Ocean Blue Styling**: All text output uses cyan color scheme matching the conductor CLI pattern
- **Comprehensive Command Set**: All commands from the Rust version implemented
- **Custom Help System**: Beautiful, fully colored help output with no white text
- **Modular Architecture**: Clean separation of concerns with internal packages

## Installation

```bash
# Build and install globally
go build -o secular
go install
```

## Commands

### Security Operations
- `secular scan` - Scan for secrets in code
- `secular audit` - Audit dependencies for vulnerabilities

### Node Management
- `secular init` - Initialize a secular node
- `secular node` - Manage secular node
- `secular status` - Show status of deployment and node

### Peer Collaboration
- `secular peers` - Manage peers collection
- `secular peer` - Manage specific peer by name
- `secular repos` - Repository operations (push, pull, sync)

### Deployment & Monitoring
- `secular deploy` - Deploy to cloud platforms
- `secular monitor` - Monitor resource usage and costs
- `secular backup` - Backup operations

### Optimization & Tools
- `secular convert` - Convert git repositories to radicle
- `secular optimize` - Optimize configuration for cost savings
- `secular completions` - Generate shell completions
- `secular docs` - Show command documentation

## Architecture

```
secular-go/
├── main.go                    # Entry point
├── cmd/
│   └── root.go               # Root command with all subcommands
├── internal/
│   └── color/
│       └── color.go          # Cyan/ocean blue color palette
├── go.mod                    # Go module definition
└── README.md                 # This file
```

## Color Palette

The CLI uses a consistent cyan/ocean blue color scheme:

- **Bright Cyan** (`#00ffff` / ANSI 51): Headers and primary text
- **Light Cyan** (`#87ffff` / ANSI 87): Command names and descriptions
- **Dark Cyan** (`#00d7ff` / ANSI 45): Emphasis and accents
- **Ocean Blue** (`#00afff` / ANSI 39): Section titles
- **Light Ocean** (`#5fafff` / ANSI 75): Secondary elements
- **Dark Ocean** (`#0087ff` / ANSI 33): Tertiary elements

## Implementation Status

- ✅ Project structure and build system
- ✅ Full cyan/ocean blue color system
- ✅ Custom help command with colored output
- ✅ All command stubs defined
- ✅ Global flags (verbose, quiet)
- 🔲 Command implementations (coming from Rust port)

## Usage

```bash
# Show help
secular --help

# Run a command
secular scan
secular init
secular status

# Get help for a specific command
secular scan --help
```

## Development

```bash
# Build
go build -o secular

# Install globally
go install

# Run tests
go test ./...
```

## Comparison with Conductor

This CLI follows the same structural pattern as the conductor CLI at `~/Documents/Projects/Orchestra/conductor/`:
- Custom help system with full color control
- Internal color package for consistent styling
- Command grouping in help output
- Global flag management
- Clean separation of concerns

The key difference is Secular uses a single cyan/ocean blue color palette instead of conductor's multi-colored musical theme.
