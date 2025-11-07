package cmd

import (
	"fmt"
	"os"

	"github.com/joshkornreich/secular/internal/color"
	"github.com/spf13/cobra"
	"github.com/spf13/pflag"
)

var (
	// Global flags
	verboseFlag bool
	quietFlag   bool
)

var rootCmd = &cobra.Command{
	Use:   "secular",
	Short: color.C("🌊 Secure & cost-optimized P2P code collaboration"),
	Long: color.C(`🌊 SECULAR - Secure & Cost-Optimized P2P Code Collaboration

🔒 SECURITY-FIRST FEATURES:
   • 🔍 Built-in secret scanning - protecting your credentials
   • 🛡️  Vulnerability detection - safeguarding dependencies
   • 🔐 Privacy-focused - your code, your control
   • 🚨 Real-time security alerts - instant threat awareness

💎 COST OPTIMIZATION:
   • 💰 Aggressive resource optimization
   • 📊 Cost monitoring and analytics
   • ⚡ Efficient P2P networking
   • 🎯 Smart resource allocation

🌐 P2P COLLABORATION:
   • 🤝 Decentralized code sharing
   • 🔄 Seamless synchronization
   • 🌍 Global peer network
   • 📦 Repository management`),
	Version: "1.0.0",
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "%s %v\n", color.ColorizeSection("headerbold", "Error:"), color.C(err.Error()))
		os.Exit(1)
	}
}

func init() {
	// Disable default completion command
	rootCmd.CompletionOptions.DisableDefaultCmd = true

	// Add global flags
	rootCmd.PersistentFlags().BoolVarP(&verboseFlag, "verbose", "v", false, "Enable verbose logging")
	rootCmd.PersistentFlags().BoolVarP(&quietFlag, "quiet", "q", false, "Suppress output")

	// Custom help command with full cyan styling
	helpCmd := &cobra.Command{
		Use:   "help [command]",
		Short: color.C("Help about any command"),
		Long: color.C(`Help provides help for any command in the application.
Simply type secular help [command] for full details.`),
		Run: func(cmd *cobra.Command, args []string) {
			showColoredHelp(rootCmd)
		},
	}

	rootCmd.SetHelpCommand(helpCmd)

	// Override help function for all commands
	rootCmd.SetHelpFunc(func(cmd *cobra.Command, args []string) {
		showColoredHelp(cmd)
	})

	// Initialize all commands
	initCommands()
}

// showColoredHelp displays custom help with full cyan styling
func showColoredHelp(cmd *cobra.Command) {
	// Show the long description
	if cmd.Long != "" {
		fmt.Println(cmd.Long)
	} else if cmd.Short != "" {
		fmt.Println(cmd.Short)
	}
	fmt.Println()

	// Show usage
	fmt.Printf("%s\n  %s\n  %s\n\n",
		color.ColorizeSection("headerbold", "Usage:"),
		color.C(cmd.CommandPath()+" [flags]"),
		color.C(cmd.CommandPath()+" [command]"))

	if !cmd.HasAvailableSubCommands() {
		showFlags(cmd)
		return
	}

	fmt.Println(color.ColorizeSection("headerbold", "🌊 SECULAR COMMANDS:"))
	fmt.Println()

	// Define command groups
	groups := []struct {
		title    string
		commands []string
	}{
		{
			title:    "🔒 SECURITY OPERATIONS:",
			commands: []string{"scan", "audit"},
		},
		{
			title:    "🌐 NODE MANAGEMENT:",
			commands: []string{"init", "node", "status"},
		},
		{
			title:    "🤝 PEER COLLABORATION:",
			commands: []string{"peers", "peer", "repos"},
		},
		{
			title:    "☁️  DEPLOYMENT & MONITORING:",
			commands: []string{"deploy", "monitor", "backup"},
		},
		{
			title:    "⚙️  OPTIMIZATION & TOOLS:",
			commands: []string{"convert", "optimize", "completions", "docs"},
		},
	}

	// Display each group
	for _, group := range groups {
		fmt.Printf("  %s\n", color.ColorizeSection("ocean", group.title))

		for _, cmdName := range group.commands {
			if subcmd, _, _ := cmd.Find([]string{cmdName}); subcmd != nil && subcmd != cmd && subcmd.IsAvailableCommand() {
				fmt.Printf("    %s%s\n",
					color.ColorizeSection("cyanlight", fmt.Sprintf("%-20s", cmdName)),
					color.C(subcmd.Short))
			}
		}
		fmt.Println()
	}

	// Show help command separately
	fmt.Printf("  %s\n", color.ColorizeSection("ocean", "ℹ️  HELP & INFORMATION:"))
	fmt.Printf("    %s%s\n\n",
		color.ColorizeSection("cyanlight", fmt.Sprintf("%-20s", "help")),
		color.C("Help about any command"))

	showFlags(cmd)

	fmt.Printf("\n%s\n",
		color.ColorizeSection("emphasis",
			"Use \"secular [command] --help\" for more information about a command."))
}

// showFlags displays flags in cyan
func showFlags(cmd *cobra.Command) {
	if cmd.HasAvailableLocalFlags() {
		fmt.Printf("%s\n", color.ColorizeSection("headerbold", "🎛️  FLAGS:"))
		flags := cmd.LocalFlags()
		flags.VisitAll(func(flag *pflag.Flag) {
			if !flag.Hidden {
				flagStr := fmt.Sprintf("  --%s", flag.Name)
				if flag.Shorthand != "" {
					flagStr = fmt.Sprintf("  -%s, --%s", flag.Shorthand, flag.Name)
				}
				fmt.Printf("%s%s\n",
					color.ColorizeSection("cyanlight", fmt.Sprintf("%-25s", flagStr)),
					color.C(flag.Usage))
			}
		})
	}

	if cmd.HasAvailableInheritedFlags() {
		fmt.Printf("\n%s\n", color.ColorizeSection("headerbold", "🌐 GLOBAL FLAGS:"))
		flags := cmd.InheritedFlags()
		flags.VisitAll(func(flag *pflag.Flag) {
			if !flag.Hidden {
				flagStr := fmt.Sprintf("  --%s", flag.Name)
				if flag.Shorthand != "" {
					flagStr = fmt.Sprintf("  -%s, --%s", flag.Shorthand, flag.Name)
				}
				fmt.Printf("%s%s\n",
					color.ColorizeSection("cyanlight", fmt.Sprintf("%-25s", flagStr)),
					color.C(flag.Usage))
			}
		})
	}
}

// initCommands initializes all subcommands
func initCommands() {
	// Security commands
	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(scanCmd)
	rootCmd.AddCommand(auditCmd)

	// Node management
	// rootCmd.AddCommand(nodeCmd) // node.go.disabled - has syntax errors
	rootCmd.AddCommand(statusCmd)

	// Peer collaboration
	// rootCmd.AddCommand(peersCmd) // peers.go not implemented yet
	// rootCmd.AddCommand(peerCmd)  // peer.go.disabled - has syntax errors
	rootCmd.AddCommand(reposCmd)  // REPOS COMMAND FULLY PORTED!

	// Deployment & monitoring
	rootCmd.AddCommand(deployCmd)
	rootCmd.AddCommand(monitorCmd)
	rootCmd.AddCommand(backupCmd)

	// Optimization & tools
	rootCmd.AddCommand(convertCmd)
	rootCmd.AddCommand(optimizeCmd)
	rootCmd.AddCommand(completionsCmd)
	rootCmd.AddCommand(docsCmd)
}

// Command stubs - these will be implemented in separate files
var initCmd = &cobra.Command{
	Use:   "init",
	Short: color.C("Initialize a secular node"),
	Long:  color.C("Initialize a secular node with security scanning and P2P configuration"),
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println(color.C("🌊 Initializing secular node..."))
		// Implementation coming
	},
}

var scanCmd = &cobra.Command{
	Use:   "scan",
	Short: color.C("Scan for secrets in code"),
	Long:  color.C("Scan codebase for exposed secrets, credentials, and sensitive data"),
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println(color.C("🔍 Scanning for secrets..."))
		// Implementation coming
	},
}

var auditCmd = &cobra.Command{
	Use:   "audit",
	Short: color.C("Audit dependencies for vulnerabilities"),
	Long:  color.C("Check dependencies for known security vulnerabilities"),
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println(color.C("🛡️  Auditing dependencies..."))
		// Implementation coming
	},
}

var deployCmd = &cobra.Command{
	Use:   "deploy",
	Short: color.C("Deploy to cloud platforms"),
	Long:  color.C("Deploy secular node to cloud platforms (GCP, AWS, etc.)"),
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println(color.C("☁️  Deploying to cloud..."))
		// Implementation coming
	},
}

var monitorCmd = &cobra.Command{
	Use:   "monitor",
	Short: color.C("Monitor resource usage and costs"),
	Long:  color.C("Monitor node resource usage, costs, and performance metrics"),
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println(color.C("📊 Monitoring resources..."))
		// Implementation coming
	},
}

// nodeCmd is disabled (node.go has syntax errors)
// peersCmd is not yet implemented
// peerCmd is disabled (peer.go has syntax errors)
// reposCmd is defined in repos.go

// var nodeCmd = &cobra.Command{} // Disabled - moved to node.go.disabled

var backupCmd = &cobra.Command{
	Use:   "backup",
	Short: color.C("Backup operations"),
	Long:  color.C("Create and manage backups of node data and repositories"),
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println(color.C("💾 Creating backup..."))
		// Implementation coming
	},
}

var convertCmd = &cobra.Command{
	Use:   "convert",
	Short: color.C("Convert git repositories to radicle"),
	Long:  color.C("Convert existing git repositories to radicle format"),
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println(color.C("🔄 Converting repository..."))
		// Implementation coming
	},
}

var optimizeCmd = &cobra.Command{
	Use:   "optimize",
	Short: color.C("Optimize configuration for cost savings"),
	Long:  color.C("Analyze and optimize node configuration for cost reduction"),
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println(color.C("⚡ Optimizing configuration..."))
		// Implementation coming
	},
}

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: color.C("Show status of deployment and node"),
	Long:  color.C("Display current status of node, deployment, and P2P connections"),
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println(color.C("📊 Node Status"))
		// Implementation coming
	},
}

var completionsCmd = &cobra.Command{
	Use:   "completions [bash|zsh|fish|powershell]",
	Short: color.C("Generate shell completions"),
	Long:  color.C("Generate shell completion scripts for your shell"),
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println(color.C("🔧 Generating completions..."))
		// Implementation coming
	},
}

var docsCmd = &cobra.Command{
	Use:   "docs",
	Short: color.C("Show command documentation and usage examples"),
	Long:  color.C("Display detailed documentation and usage examples for all commands"),
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println(color.C("📚 Command Documentation"))
		// Implementation coming
	},
}
