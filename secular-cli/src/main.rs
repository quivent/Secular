//! Secular CLI - Secure & cost-optimized P2P code collaboration
//!
//! A CLI tool for managing Radicle nodes with built-in security scanning
//! and cost optimization features.

use clap::{Parser, Subcommand};
use colored::Colorize;
use std::process;

mod commands;
mod utils;

use commands::*;

#[derive(Parser)]
#[command(
    name = "secular",
    version,
    about = "Secure & cost-optimized P2P code collaboration",
    long_about = "Secular is a security-enhanced fork of Radicle Heartwood with built-in \
                  secret scanning, vulnerability detection, and aggressive cost optimizations.",
    styles = get_styles(),
    help_template = "\x1b[36m{about}\x1b[0m\n\n\x1b[1;36m{usage-heading}\x1b[0m \x1b[36m{usage}\x1b[0m\n\n\x1b[1;36m{all-args}\x1b[0m{after-help}"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    /// Enable verbose logging
    #[arg(short, long, global = true)]
    verbose: bool,

    /// Suppress output
    #[arg(short, long, global = true)]
    quiet: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Initialize a secular node
    Init {
        /// Path to initialize (defaults to current directory)
        #[arg(short, long)]
        path: Option<String>,

        /// Skip secret scanning setup
        #[arg(long)]
        no_scan: bool,
    },

    /// Scan for secrets in code
    Scan(scan::ScanArgs),

    /// Audit dependencies for vulnerabilities
    Audit(audit::AuditArgs),

    /// Deploy to cloud platforms
    Deploy(deploy::DeployArgs),

    /// Monitor resource usage and costs
    Monitor(monitor::MonitorArgs),

    /// Manage secular node
    #[command(subcommand)]
    Node(node::NodeCommands),

    /// Manage peers collection (add, list, remove all)
    #[command(subcommand)]
    Peers(peer::PeerCommands),

    /// Manage specific peer by name
    #[command(subcommand)]
    Peer(peer::PeerCommands),

    /// Repository operations (push, pull, sync)
    #[command(subcommand)]
    Repos(repo::RepoCommands),

    /// Backup operations
    Backup(backup::BackupArgs),

    /// Convert git repositories to radicle
    Convert {
        /// Repository path (if not provided, will prompt for selection)
        #[arg(short, long)]
        path: Option<String>,

        /// Make repository public (default is private)
        #[arg(long)]
        public: bool,

        /// List available repositories
        #[arg(short, long)]
        list: bool,
    },

    /// Optimize configuration for cost savings
    Optimize {
        /// Run optimization analysis only (don't apply)
        #[arg(long)]
        dry_run: bool,
    },

    /// Show status of deployment and node
    Status {
        /// Show detailed status
        #[arg(short, long)]
        detailed: bool,

        /// Output format (text, json, yaml)
        #[arg(short, long, default_value = "text")]
        format: String,
    },

    /// Generate shell completions
    Completions {
        /// Shell to generate completions for
        #[arg(value_enum)]
        shell: clap_complete::Shell,
    },

    /// Show command documentation and usage examples
    Docs,
}

#[tokio::main]
async fn main() {
    // Intercept help flags for custom colored output
    let args: Vec<String> = std::env::args().collect();

    // Show custom help if no args or --help/-h is provided
    let should_show_help = args.len() == 1 ||
        (args.len() == 2 && (args[1] == "--help" || args[1] == "-h"));

    if should_show_help {
        print_custom_help();
        return;
    }

    let cli = Cli::parse();

    // Setup logging
    setup_logging(cli.verbose, cli.quiet);

    // Run command
    let result = match cli.command {
        Commands::Init { path, no_scan } => init::run(path, no_scan).await,
        Commands::Scan(args) => scan::run(args).await,
        Commands::Audit(args) => audit::run(args).await,
        Commands::Deploy(args) => deploy::run(args).await,
        Commands::Monitor(args) => monitor::run(args).await,
        Commands::Node(cmd) => node::run(cmd).await,
        Commands::Peers(cmd) => peer::run(cmd).await,
        Commands::Peer(cmd) => peer::run(cmd).await,
        Commands::Repos(cmd) => repo::run(cmd).await,
        Commands::Backup(args) => backup::run(args).await,
        Commands::Convert { path, public, list } => convert::run(path, !public, list).await,
        Commands::Optimize { dry_run } => optimize::run(dry_run).await,
        Commands::Status { detailed, format } => status::run(detailed, &format).await,
        Commands::Completions { shell } => {
            completions::generate(shell);
            Ok(())
        }
        Commands::Docs => docs::run().await,
    };

    // Handle errors
    if let Err(e) = result {
        eprintln!("{} {}", "Error:".red().bold(), e);
        process::exit(1);
    }
}

fn setup_logging(verbose: bool, quiet: bool) {
    use tracing_subscriber::{fmt, prelude::*, EnvFilter};

    let filter = if verbose {
        EnvFilter::new("secular=debug,radicle=debug")
    } else if quiet {
        EnvFilter::new("secular=error")
    } else {
        EnvFilter::new("secular=info")
    };

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer())
        .init();
}

fn get_styles() -> clap::builder::Styles {
    use clap::builder::styling::*;

    Styles::styled()
        .header(AnsiColor::Cyan.on_default().bold())
        .usage(AnsiColor::Cyan.on_default().bold())
        .literal(AnsiColor::Cyan.on_default())
        .placeholder(AnsiColor::Cyan.on_default())
        .error(AnsiColor::Red.on_default().bold())
        .valid(AnsiColor::Cyan.on_default())
        .invalid(AnsiColor::Yellow.on_default())
}

fn print_custom_help() {
    use colored::Colorize;

    println!("{}", "Secure & cost-optimized P2P code collaboration".cyan());
    println!();
    println!("{} {}", "Usage:".cyan().bold(), "secular [OPTIONS] <COMMAND>".cyan());
    println!();
    println!("{}", "Commands:".cyan().bold());
    println!("  {}  {}", "init".cyan(), "Initialize a secular node".cyan());
    println!("  {}  {}", "scan".cyan(), "Scan for secrets in code".cyan());
    println!("  {} {}", "audit".cyan(), "Audit dependencies for vulnerabilities".cyan());
    println!("  {} {}", "deploy".cyan(), "Deploy to cloud platforms".cyan());
    println!("  {} {}", "monitor".cyan(), "Monitor resource usage and costs".cyan());
    println!("  {}  {}", "node".cyan(), "Manage secular node".cyan());
    println!("  {} {}", "peers".cyan(), "Manage peers collection (add, list, remove all)".cyan());
    println!("  {}  {}", "peer".cyan(), "Manage specific peer by name".cyan());
    println!("  {} {}", "repos".cyan(), "Repository operations (push, pull, sync)".cyan());
    println!("  {} {}", "backup".cyan(), "Backup operations".cyan());
    println!("  {} {}", "convert".cyan(), "Convert git repositories to radicle".cyan());
    println!("  {} {}", "optimize".cyan(), "Optimize configuration for cost savings".cyan());
    println!("  {} {}", "status".cyan(), "Show status of deployment and node".cyan());
    println!("  {} {}", "completions".cyan(), "Generate shell completions".cyan());
    println!("  {}  {}", "docs".cyan(), "Show command documentation and usage examples".cyan());
    println!("  {}  {}", "help".cyan(), "Print this message or the help of the given subcommand(s)".cyan());
    println!();
    println!("{}", "Options:".cyan().bold());
    println!("  {} {}", "-v, --verbose".cyan(), "Enable verbose logging".cyan());
    println!("  {} {}", "-q, --quiet  ".cyan(), "Suppress output".cyan());
    println!("  {} {}", "-h, --help   ".cyan(), "Print help".cyan());
    println!("  {} {}", "-V, --version".cyan(), "Print version".cyan());
}
