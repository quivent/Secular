package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/joshkornreich/secular/internal/color"
	"github.com/spf13/cobra"
)

var nodeCmd = &cobra.Command{
	Use:   "node",
	Short: color.C("Manage secular node lifecycle"),
	Long: color.C(`Manage the secular node - start, stop, restart, and monitor status.

The node powers P2P collaboration and repository synchronization.
All operations execute rad CLI commands with enhanced cyan styling.`),
}

var nodeStartCmd = &cobra.Command{
	Use:   "start",
	Short: color.C("Start the secular node"),
	Long:  color.C("Start the secular node with optional port and debug configuration"),
	RunE:  nodeStart,
}

var nodeStopCmd = &cobra.Command{
	Use:   "stop",
	Short: color.C("Stop the secular node"),
	Long:  color.C("Stop the running secular node gracefully"),
	RunE:  nodeStop,
}

var nodeRestartCmd = &cobra.Command{
	Use:   "restart",
	Short: color.C("Restart the secular node"),
	Long:  color.C("Stop and restart the secular node with current configuration"),
	RunE:  nodeRestart,
}

var nodeStatusCmd = &cobra.Command{
	Use:   "status",
	Short: color.C("Show node status"),
	Long:  color.C("Display the current status and process information of the secular node"),
	RunE:  nodeStatusRun,
}

var nodePeersCmd = &cobra.Command{
	Use:   "peers",
	Short: color.C("List connected peers"),
	Long:  color.C("Show all peers currently connected to the node"),
	RunE:  nodePeersRun,
}

var nodeReposCmd = &cobra.Command{
	Use:   "repos",
	Short: color.C("List node repositories"),
	Long:  color.C("Display all repositories managed by the node"),
	RunE:  nodeRepos,
}

var nodeStorageCmd = &cobra.Command{
	Use:   "storage",
	Short: color.C("Show storage information"),
	Long:  color.C("Display storage usage and breakdown for node data"),
	RunE:  nodeStorage,
}

var nodeLogsCmd = &cobra.Command{
	Use:   "logs",
	Short: color.C("Show node logs"),
	Long:  color.C("Display node logs with optional follow mode and line limit"),
	RunE:  nodeLogs,
}

var nodeAnnounceCmd = &cobra.Command{
	Use:   "announce",
	Short: color.C("Announce repositories to the network"),
	Long: color.C(`Announce repositories to the Radicle network for peer discovery.

This makes your repositories discoverable by friends and peers on the network.
Friends can clone using your Node ID and the repository RID.`),
	RunE: nodeAnnounce,
}

// Command flags
var (
	nodePort     int
	nodeDebug    bool
	nodeDetailed bool
	nodeFollow   bool
	nodeLines    int
	nodePath     string
)

func init() {
	// Add subcommands to node command
	nodeCmd.AddCommand(nodeStartCmd)
	nodeCmd.AddCommand(nodeStopCmd)
	nodeCmd.AddCommand(nodeRestartCmd)
	nodeCmd.AddCommand(nodeStatusCmd)
	nodeCmd.AddCommand(nodePeersCmd)
	nodeCmd.AddCommand(nodeReposCmd)
	nodeCmd.AddCommand(nodeStorageCmd)
	nodeCmd.AddCommand(nodeLogsCmd)
	nodeCmd.AddCommand(nodeAnnounceCmd)

	// Start command flags
	nodeStartCmd.Flags().IntVarP(&nodePort, "port", "p", 8776, "Port to listen on")
	nodeStartCmd.Flags().BoolVar(&nodeDebug, "debug", false, "Enable debug logging")

	// Peers command flags
	nodePeersCmd.Flags().BoolVarP(&nodeDetailed, "detailed", "d", false, "Show detailed peer information")

	// Storage command flags
	nodeStorageCmd.Flags().BoolVarP(&nodeDetailed, "detailed", "d", false, "Show detailed storage breakdown")

	// Logs command flags
	nodeLogsCmd.Flags().BoolVarP(&nodeFollow, "follow", "f", false, "Follow logs in real-time")
	nodeLogsCmd.Flags().IntVarP(&nodeLines, "lines", "l", 100, "Number of lines to show")

	// Announce command flags
	nodeAnnounceCmd.Flags().StringVarP(&nodePath, "path", "p", "", "Repository path (defaults to current directory)")
}

func nodeStart(cmd *cobra.Command, args []string) error {
	fmt.Println(color.ColorizeSection("headerbold", "🌊 Starting Secular Node"))
	fmt.Println()

	// Check if already running
	if isNodeRunning() {
		fmt.Println(color.ColorizeSection("ocean", "⚠ Node is already running"))
		fmt.Println()
		fmt.Println(color.ColorizeSection("text", "Check status with:"))
		fmt.Println(color.CL("  secular node status"))
		return nil
	}

	// Start via systemd if available, otherwise direct
	if isSystemdAvailable() {
		fmt.Println(color.C("Starting via systemd..."))
		execCmd := exec.Command("sudo", "systemctl", "start", "secular-node")
		if err := execCmd.Run(); err != nil {
			return fmt.Errorf("%s failed to start node via systemd: %w", color.ColorizeSection("ocean", "Error:"), err)
		}
		fmt.Println()
		fmt.Println(color.ColorizeSection("headerbold", "✓ Node started via systemd"))
	} else {
		// Start directly
		fmt.Printf("%s Port: %s\n", color.C("Config:"), color.ColorizeSection("headerbold", fmt.Sprintf("%d", nodePort)))
		if nodeDebug {
			fmt.Printf("%s Debug logging: %s\n", color.C("Config:"), color.ColorizeSection("headerbold", "enabled"))
		}
		fmt.Println()

		cmdArgs := []string{"--listen", fmt.Sprintf("0.0.0.0:%d", nodePort)}
		execCmd := exec.Command("radicle-node", cmdArgs...)

		if nodeDebug {
			execCmd.Env = append(os.Environ(), "RUST_LOG=debug")
		}

		if err := execCmd.Start(); err != nil {
			return fmt.Errorf("%s failed to start node: %w", color.ColorizeSection("ocean", "Error:"), err)
		}
		fmt.Println(color.ColorizeSection("headerbold", fmt.Sprintf("✓ Node started on port %d", nodePort)))
	}

	fmt.Println()
	fmt.Println(color.ColorizeSection("text", "Verify with:"))
	fmt.Println(color.CL("  secular node status"))

	return nil
}

func nodeStop(cmd *cobra.Command, args []string) error {
	fmt.Println(color.ColorizeSection("headerbold", "🌊 Stopping Secular Node"))
	fmt.Println()

	if !isNodeRunning() {
		fmt.Println(color.ColorizeSection("ocean", "⚠ Node is not running"))
		return nil
	}

	fmt.Println(color.C("Stopping node..."))

	if isSystemdAvailable() {
		execCmd := exec.Command("sudo", "systemctl", "stop", "secular-node")
		if err := execCmd.Run(); err != nil {
			return fmt.Errorf("%s failed to stop node via systemd: %w", color.ColorizeSection("ocean", "Error:"), err)
		}
	} else {
		// Find and kill process
		execCmd := exec.Command("pkill", "-f", "radicle-node")
		_ = execCmd.Run() // Ignore error if process not found
	}

	fmt.Println()
	fmt.Println(color.ColorizeSection("headerbold", "✓ Node stopped"))

	return nil
}

func nodeRestart(cmd *cobra.Command, args []string) error {
	fmt.Println(color.ColorizeSection("headerbold", "🌊 Restarting Secular Node"))
	fmt.Println()

	// Stop the node
	if isNodeRunning() {
		fmt.Println(color.C("Stopping node..."))
		if err := nodeStop(cmd, args); err != nil {
			return err
		}
		fmt.Println()
	}

	// Wait for graceful shutdown
	fmt.Println(color.ColorizeSection("text", "Waiting for graceful shutdown..."))
	time.Sleep(2 * time.Second)
	fmt.Println()

	// Start the node
	return nodeStart(cmd, args)
}

func nodeStatusRun(cmd *cobra.Command, args []string) error {
	fmt.Println(color.ColorizeSection("headerbold", "🌊 Node Status"))
	fmt.Println()

	if isSystemdAvailable() {
		fmt.Println(color.C("Systemd Status:"))
		fmt.Println()
		execCmd := exec.Command("systemctl", "status", "secular-node", "--no-pager")
		output, _ := execCmd.CombinedOutput()
		// Colorize output lines
		lines := strings.Split(string(output), "\n")
		for _, line := range lines {
			if strings.Contains(line, "Active:") {
				if strings.Contains(line, "active (running)") {
					fmt.Println(color.ColorizeSection("headerbold", line))
				} else {
					fmt.Println(color.ColorizeSection("ocean", line))
				}
			} else {
				fmt.Println(color.C(line))
			}
		}
	} else if isNodeRunning() {
		fmt.Printf("%s %s\n", color.C("Status:"), color.ColorizeSection("headerbold", "● Running"))
		fmt.Println()

		// Try to get process info
		execCmd := exec.Command("ps", "aux")
		output, err := execCmd.Output()
		if err == nil {
			fmt.Println(color.C("Process Information:"))
			lines := strings.Split(string(output), "\n")
			for _, line := range lines {
				if strings.Contains(line, "radicle-node") && !strings.Contains(line, "grep") {
					fmt.Println(color.CL("  " + line))
				}
			}
		}
	} else {
		fmt.Printf("%s %s\n", color.C("Status:"), color.ColorizeSection("ocean", "● Not running"))
		fmt.Println()
		fmt.Println(color.ColorizeSection("text", "Start the node with:"))
		fmt.Println(color.CL("  secular node start"))
	}

	return nil
}

func nodePeersRun(cmd *cobra.Command, args []string) error {
	fmt.Println(color.ColorizeSection("headerbold", "🌊 Connected Peers"))
	fmt.Println()

	// This would integrate with radicle-node API
	// For now, show placeholder with rad CLI integration planned
	fmt.Printf("%s %s\n", color.C("Peers:"), color.ColorizeSection("ocean", "0"))
	fmt.Println()

	if nodeDetailed {
		fmt.Println(color.ColorizeSection("text", "(No peers currently connected)"))
		fmt.Println()
	}

	fmt.Println(color.ColorizeSection("text", "Peer discovery via rad CLI integration coming soon"))

	return nil
}

func nodeRepos(cmd *cobra.Command, args []string) error {
	fmt.Println(color.ColorizeSection("headerbold", "🌊 Node Repositories"))
	fmt.Println()

	// This would integrate with radicle-node API
	// For now, show placeholder
	fmt.Printf("%s %s\n", color.C("Repositories:"), color.ColorizeSection("ocean", "0"))
	fmt.Println()

	fmt.Println(color.ColorizeSection("text", "Repository listing via rad CLI integration coming soon"))

	return nil
}

func nodeStorage(cmd *cobra.Command, args []string) error {
	fmt.Println(color.ColorizeSection("headerbold", "🌊 Storage Information"))
	fmt.Println()

	dataDir := "/var/lib/secular"

	// Get disk usage
	execCmd := exec.Command("du", "-sh", dataDir)
	output, err := execCmd.Output()
	if err == nil {
		parts := strings.Fields(string(output))
		if len(parts) > 0 {
			fmt.Printf("%s %s\n", color.C("Total Size:"), color.ColorizeSection("headerbold", parts[0]))
		}
	} else {
		fmt.Printf("%s %s\n", color.C("Total Size:"), color.ColorizeSection("ocean", "Directory not found"))
	}
	fmt.Println()

	if nodeDetailed {
		fmt.Println(color.C("Breakdown:"))
		fmt.Println()

		execCmd := exec.Command("du", "-h", "--max-depth=1", dataDir)
		detailOutput, err := execCmd.Output()
		if err == nil {
			lines := strings.Split(string(detailOutput), "\n")
			for _, line := range lines {
				if strings.TrimSpace(line) != "" {
					fmt.Println(color.CL("  " + line))
				}
			}
		} else {
			fmt.Println(color.ColorizeSection("text", "  Unable to retrieve detailed breakdown"))
		}
	}

	return nil
}

func nodeLogs(cmd *cobra.Command, args []string) error {
	fmt.Println(color.ColorizeSection("headerbold", "🌊 Node Logs"))
	fmt.Println()

	if isSystemdAvailable() {
		cmdArgs := []string{"-u", "secular-node", "-n", fmt.Sprintf("%d", nodeLines)}
		if nodeFollow {
			cmdArgs = append(cmdArgs, "-f")
			fmt.Println(color.ColorizeSection("text", "Following logs (Ctrl+C to stop)..."))
			fmt.Println()
		}

		execCmd := exec.Command("journalctl", cmdArgs...)
		execCmd.Stdout = os.Stdout
		execCmd.Stderr = os.Stderr
		return execCmd.Run()
	} else {
		// Try to find log file
		logFile := "/var/log/secular/node.log"
		if _, err := os.Stat(logFile); err == nil {
			cmdArgs := []string{"-n", fmt.Sprintf("%d", nodeLines)}
			if nodeFollow {
				cmdArgs = append(cmdArgs, "-f")
				fmt.Println(color.ColorizeSection("text", "Following logs (Ctrl+C to stop)..."))
				fmt.Println()
			}
			cmdArgs = append(cmdArgs, logFile)

			execCmd := exec.Command("tail", cmdArgs...)
			execCmd.Stdout = os.Stdout
			execCmd.Stderr = os.Stderr
			return execCmd.Run()
		} else {
			fmt.Println(color.ColorizeSection("ocean", "⚠ No logs found"))
			fmt.Println()
			fmt.Println(color.ColorizeSection("text", "Log file expected at:"))
			fmt.Println(color.CL("  " + logFile))
		}
	}

	return nil
}

func nodeAnnounce(cmd *cobra.Command, args []string) error {
	fmt.Println(color.ColorizeSection("headerbold", "🌊 Announcing Repositories to Network"))
	fmt.Println()

	// Make sure node is running first
	if !isNodeRunning() {
		fmt.Println(color.ColorizeSection("ocean", "⚠ Error: Node is not running"))
		fmt.Println()
		fmt.Println(color.ColorizeSection("text", "Start the node first:"))
		fmt.Println(color.CL("  secular node start"))
		return fmt.Errorf("node not running")
	}

	// Change to repo directory if specified
	originalDir, _ := os.Getwd()
	if nodePath != "" {
		if err := os.Chdir(nodePath); err != nil {
			return fmt.Errorf("%s failed to change to directory %s: %w", color.ColorizeSection("ocean", "Error:"), nodePath, err)
		}
		defer os.Chdir(originalDir)
		fmt.Printf("%s %s\n", color.C("Repository:"), color.ColorizeSection("headerbold", nodePath))
		fmt.Println()
	}

	// Run rad sync --announce
	fmt.Println(color.ColorizeSection("text", "Running: rad sync --announce"))
	fmt.Println()

	execCmd := exec.Command("rad", "sync", "--announce")
	output, err := execCmd.CombinedOutput()

	if err != nil {
		fmt.Println(color.ColorizeSection("ocean", "⚠ Failed to announce repositories"))
		fmt.Println()

		if len(output) > 0 {
			fmt.Println(color.ColorizeSection("ocean", "Error Output:"))
			fmt.Println(color.C(string(output)))
			fmt.Println()
		}

		fmt.Println(color.ColorizeSection("ocean", "Troubleshooting:"))
		fmt.Println(color.C("  • Make sure you're in a Radicle repository directory"))
		fmt.Println(color.C("  • Ensure the repository is initialized: rad inspect"))
		fmt.Println(color.C("  • Try pushing first: git push rad"))

		return fmt.Errorf("announcement failed")
	}

	fmt.Println(color.ColorizeSection("headerbold", "✓ Repositories announced successfully!"))
	fmt.Println()

	// Show output
	if len(output) > 0 {
		outputStr := strings.TrimSpace(string(output))
		if outputStr != "" {
			fmt.Println(color.C(outputStr))
			fmt.Println()
		}
	}

	fmt.Println(color.ColorizeSection("text", "Your repositories are now discoverable on the network"))
	fmt.Println(color.ColorizeSection("text", "Friends can clone using your Node ID and the repository RID"))

	return nil
}

// Helper functions

func isSystemdAvailable() bool {
	_, err := exec.LookPath("systemctl")
	return err == nil
}

func isNodeRunning() bool {
	execCmd := exec.Command("pgrep", "-f", "radicle-node")
	err := execCmd.Run()
	return err == nil
}
