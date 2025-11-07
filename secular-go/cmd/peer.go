package cmd

import (
	"bufio"
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/joshkornreich/secular/internal/color"
	"github.com/spf13/cobra"
)

var peerCmd = &cobra.Command{
	Use:   "peer <name> [action]",
	Short: color.C("Manage a specific peer"),
	Long:  color.C("Manage individual peer: view details, check status, list repos, or remove."),
	Args:  cobra.MinimumNArgs(1),
	RunE:  runPeerCommand,
}

var (
	peerAddName   string
	peerAddNodeID string
)

func init() {
	// Add subcommand
	addCmd := &cobra.Command{
		Use:   "add",
		Short: color.C("Add a new peer"),
		Long:  color.C("Add a peer by their Node ID with a friendly name."),
		RunE:  runPeerAdd,
	}
	addCmd.Flags().StringVarP(&peerAddName, "name", "n", "", "Friendly name for this peer")
	addCmd.Flags().StringVar(&peerAddNodeID, "node-id", "", "Peer's Node ID (did:key:z6Mk... or z6Mk...)")
	addCmd.MarkFlagRequired("name")
	addCmd.MarkFlagRequired("node-id")

	peerCmd.AddCommand(addCmd)
}

func runPeerCommand(cmd *cobra.Command, args []string) error {
	peerName := args[0]

	// If no action specified, show full peer details
	if len(args) == 1 {
		return showPeerDetails(peerName)
	}

	action := args[1]
	switch action {
	case "status":
		return showPeerStatus(peerName)
	case "repos":
		return listPeerRepos(peerName)
	case "remove":
		return removePeer(peerName)
	default:
		return fmt.Errorf("unknown action '%s'. Use: status, repos, or remove", action)
	}
}

func runPeerAdd(cmd *cobra.Command, args []string) error {
	fmt.Println(color.C(fmt.Sprintf("Adding peer '%s'...", peerAddName)))

	// Trim whitespace/newlines from Node ID
	nodeID := strings.TrimSpace(peerAddNodeID)

	// Validate Node ID format
	if !strings.HasPrefix(nodeID, "did:key:z6Mk") && !strings.HasPrefix(nodeID, "z6Mk") {
		return fmt.Errorf("invalid Node ID format. Should start with 'did:key:z6Mk' or 'z6Mk'")
	}

	// Validate name (alphanumeric, dashes, underscores only)
	for _, c := range peerAddName {
		if !((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' || c == '_') {
			return fmt.Errorf("invalid peer name. Use only letters, numbers, dashes, and underscores")
		}
	}

	// Check if peer already exists
	listOutput, err := exec.Command("rad", "remote", "list").Output()
	if err == nil {
		scanner := bufio.NewScanner(bytes.NewReader(listOutput))
		for scanner.Scan() {
			line := scanner.Text()
			parts := strings.Fields(line)
			if len(parts) >= 2 && parts[0] == peerAddName {
				// Get node ID and clean it
				existingNodeIDRaw := strings.Join(parts[1:], " ")
				existingNodeID := strings.TrimSpace(
					strings.ReplaceAll(
						strings.ReplaceAll(existingNodeIDRaw, "(fetch)", ""),
						"(push)", ""))

				if existingNodeID == nodeID {
					// Already exists with same node ID - idempotent success
					fmt.Println(color.ColorizeSection("headerbold", fmt.Sprintf("✓ Peer '%s' already exists with this Node ID", peerAddName)))
					fmt.Printf("  Node ID: %s\n", color.ColorizeSection("text", nodeID))
					return nil
				} else {
					// Exists but with different node ID
					fmt.Println(color.ColorizeSection("ocean", fmt.Sprintf("⚠ Peer '%s' already exists with a different Node ID:", peerAddName)))
					fmt.Printf("  Existing: %s\n", color.ColorizeSection("text", existingNodeID))
					fmt.Printf("  Provided: %s\n", color.ColorizeSection("text", nodeID))
					fmt.Printf("\n%s\n", color.ColorizeSection("text", "Remove it first with:"))
					fmt.Printf("  %s\n", color.C(fmt.Sprintf("secular peer %s remove", peerAddName)))
					return nil
				}
			}
		}
	}

	// Add remote using rad CLI
	output, err := exec.Command("rad", "remote", "add", nodeID, "--name", peerAddName).CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to add peer: %s", string(output))
	}

	fmt.Println(color.ColorizeSection("headerbold", fmt.Sprintf("✓ Peer '%s' added!", peerAddName)))
	fmt.Printf("  Node ID: %s\n", color.ColorizeSection("text", nodeID))
	fmt.Printf("\n%s\n", color.ColorizeSection("text", "You can now push/pull with:"))
	fmt.Printf("  %s\n", color.C(fmt.Sprintf("secular repos push --peer %s", peerAddName)))
	fmt.Printf("  %s\n", color.C(fmt.Sprintf("secular repos pull --peer %s", peerAddName)))

	return nil
}

func removePeer(name string) error {
	fmt.Println(color.C(fmt.Sprintf("Removing peer '%s'...", name)))

	// Confirm removal
	fmt.Printf("Are you sure you want to remove peer '%s'? (y/N): ", name)
	reader := bufio.NewReader(os.Stdin)
	input, _ := reader.ReadString('\n')

	if !strings.EqualFold(strings.TrimSpace(input), "y") {
		fmt.Println(color.ColorizeSection("ocean", "Cancelled"))
		return nil
	}

	// Remove remote using rad CLI
	output, err := exec.Command("rad", "remote", "rm", name).CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to remove peer: %s", string(output))
	}

	fmt.Println(color.ColorizeSection("headerbold", fmt.Sprintf("✓ Peer '%s' removed", name)))
	return nil
}

func showPeerDetails(name string) error {
	fmt.Println(color.ColorizeSection("headerbold", fmt.Sprintf("Peer: %s", name)))

	// Check if remote exists
	output, err := exec.Command("rad", "remote", "list").Output()
	if err != nil {
		return fmt.Errorf("failed to execute 'rad remote list': %w", err)
	}

	scanner := bufio.NewScanner(bytes.NewReader(output))
	var peerInfo string
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Fields(line)
		if len(parts) > 0 && parts[0] == name {
			peerInfo = line
			break
		}
	}

	if peerInfo == "" {
		fmt.Printf("  %s\n", color.C("Not configured"))
		fmt.Printf("\n%s\n", color.ColorizeSection("text", "Add this peer with:"))
		fmt.Printf("  %s\n", color.C(fmt.Sprintf("secular peer add --name %s --node-id <node-id>", name)))
		return nil
	}

	// Extract node ID and clean it
	parts := strings.Fields(peerInfo)
	nodeIDRaw := ""
	if len(parts) >= 2 {
		nodeIDRaw = strings.Join(parts[1:], " ")
	} else {
		nodeIDRaw = "unknown"
	}
	nodeID := strings.TrimSpace(
		strings.ReplaceAll(
			strings.ReplaceAll(nodeIDRaw, "(fetch)", ""),
			"(push)", ""))

	fmt.Printf("\n%s\n", color.C("Configuration:"))
	fmt.Printf("  Status: %s\n", color.ColorizeSection("headerbold", "Added to remotes"))
	fmt.Printf("  Node ID: %s\n", color.ColorizeSection("text", nodeID))

	// Check live connection status
	isConnected := false
	nodeOutput, err := exec.Command("rad", "node", "status").Output()
	if err == nil {
		stdout := string(nodeOutput)
		fmt.Printf("\n%s\n", color.C("Live Status:"))
		if strings.Contains(stdout, nodeID) || strings.Contains(stdout, name) {
			fmt.Printf("  Connection: %s\n", color.ColorizeSection("headerbold", "Currently connected"))
			isConnected = true
		} else {
			fmt.Printf("  Connection: %s\n", color.C("Not currently connected"))

			// Attempt automatic connection
			fmt.Printf("\n%s\n", color.C("Attempting to connect..."))
			syncOutput, syncErr := exec.Command("rad", "sync", "--seed", nodeID).CombinedOutput()

			if syncErr == nil {
				fmt.Printf("  %s\n", color.ColorizeSection("headerbold", "✓ Connection established!"))
				isConnected = true

				// Verify connection was successful
				verifyOutput, _ := exec.Command("rad", "node", "status").Output()
				verifyStdout := string(verifyOutput)
				if strings.Contains(verifyStdout, nodeID) || strings.Contains(verifyStdout, name) {
					fmt.Printf("  Connection: %s\n", color.ColorizeSection("headerbold", "Currently connected"))
				}
			} else {
				syncMsg := string(syncOutput)
				if syncMsg != "" {
					fmt.Printf("  %s\n", color.C(fmt.Sprintf("Connection failed: %s", strings.TrimSpace(syncMsg))))
				} else {
					fmt.Printf("  %s\n", color.C("Connection failed (no error details)"))
				}
				fmt.Printf("  %s\n", color.ColorizeSection("text", "You may need to manually connect"))
			}
		}
	}

	fmt.Printf("\n%s\n", color.C("Actions:"))
	if isConnected {
		fmt.Printf("  %s - Show connection status\n", color.C(fmt.Sprintf("secular peer %s status", name)))
		fmt.Printf("  %s - List repositories\n", color.C(fmt.Sprintf("secular peer %s repos", name)))
		fmt.Printf("  %s - Remove this peer\n", color.C(fmt.Sprintf("secular peer %s remove", name)))
	} else {
		fmt.Printf("  %s - Connect and sync\n", color.C(fmt.Sprintf("secular repos push --peer %s", name)))
		fmt.Printf("  %s - Connect and fetch\n", color.C(fmt.Sprintf("secular repos pull --peer %s", name)))
		fmt.Printf("  %s - Remove this peer\n", color.C(fmt.Sprintf("secular peer %s remove", name)))
	}

	return nil
}

func showPeerStatus(name string) error {
	fmt.Println(color.ColorizeSection("headerbold", fmt.Sprintf("Peer Status: %s", name)))

	// Check if remote exists
	output, err := exec.Command("rad", "remote", "list").Output()
	if err != nil {
		return fmt.Errorf("failed to execute 'rad remote list': %w", err)
	}

	scanner := bufio.NewScanner(bytes.NewReader(output))
	var peerInfo string
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Fields(line)
		if len(parts) > 0 && parts[0] == name {
			peerInfo = line
			break
		}
	}

	if peerInfo == "" {
		fmt.Printf("  %s\n", color.C("Peer not configured"))
		fmt.Printf("\n%s\n", color.ColorizeSection("text", "Add this peer with:"))
		fmt.Printf("  %s\n", color.C(fmt.Sprintf("secular peer add --name %s --node-id <node-id>", name)))
		return nil
	}

	// Extract node ID and clean it
	parts := strings.Fields(peerInfo)
	nodeIDRaw := ""
	if len(parts) >= 2 {
		nodeIDRaw = strings.Join(parts[1:], " ")
	} else {
		nodeIDRaw = "unknown"
	}
	nodeID := strings.TrimSpace(
		strings.ReplaceAll(
			strings.ReplaceAll(nodeIDRaw, "(fetch)", ""),
			"(push)", ""))

	fmt.Printf("  Configuration: %s\n", color.ColorizeSection("headerbold", "Added to remotes"))
	fmt.Printf("  Node ID: %s\n", color.ColorizeSection("text", nodeID))

	// Try to get more info from rad node status
	nodeOutput, err := exec.Command("rad", "node", "status").Output()
	if err == nil {
		stdout := string(nodeOutput)
		// Check if this peer appears in connected peers
		if strings.Contains(stdout, nodeID) || strings.Contains(stdout, name) {
			fmt.Printf("  Live Status: %s\n", color.ColorizeSection("headerbold", "Currently connected"))
		} else {
			fmt.Printf("  Live Status: %s\n", color.ColorizeSection("ocean", "Not currently connected"))
			fmt.Printf("\n%s\n", color.ColorizeSection("text", "Tip: Try syncing to establish connection:"))
			fmt.Printf("  %s\n", color.C(fmt.Sprintf("secular repos push --peer %s", name)))
		}
	}

	return nil
}

func listPeerRepos(name string) error {
	fmt.Println(color.ColorizeSection("headerbold", fmt.Sprintf("Repositories from '%s':", name)))

	// First, get the peer's node ID from remotes
	output, err := exec.Command("rad", "remote", "list").Output()
	if err != nil {
		return fmt.Errorf("failed to execute 'rad remote list': %w", err)
	}

	scanner := bufio.NewScanner(bytes.NewReader(output))
	var peerNodeID string
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Fields(line)
		if len(parts) >= 2 && parts[0] == name {
			peerNodeID = parts[1]
			break
		}
	}

	if peerNodeID == "" {
		fmt.Printf("  %s\n", color.C(fmt.Sprintf("Peer '%s' not found", name)))
		fmt.Printf("\n%s\n", color.ColorizeSection("text", "Add this peer first with:"))
		fmt.Printf("  %s\n", color.C(fmt.Sprintf("secular peer add --name %s --node-id <node-id>", name)))
		return nil
	}

	fmt.Printf("  Peer Node: %s\n\n", color.ColorizeSection("text", peerNodeID))

	// Try to track repos from this node
	lsOutput, err := exec.Command("rad", "ls", "--replicas").Output()
	if err != nil {
		fmt.Printf("  %s\n", color.ColorizeSection("ocean", "Unable to query repositories"))
		fmt.Printf("\n%s\n", color.ColorizeSection("text", "Make sure:"))
		fmt.Printf("  %s\n", color.C("• Your Radicle node is running (secular node start)"))
		fmt.Printf("  %s\n", color.C("• You're connected to your peer's node"))
		return nil
	}

	lsStdout := string(lsOutput)
	lines := strings.Split(lsStdout, "\n")

	// Parse the repo list, filtering for ones that have replicas from this peer
	var foundRepos []string
	for _, line := range lines {
		// Look for lines containing the peer's node ID
		if strings.Contains(line, peerNodeID) || strings.Contains(line, name) {
			// Extract the repo info (name, RID)
			if strings.Contains(line, "rad:") {
				foundRepos = append(foundRepos, line)
			}
		}
	}

	if len(foundRepos) == 0 {
		fmt.Printf("  %s\n", color.ColorizeSection("ocean", "No repositories currently tracked from this peer"))
		fmt.Printf("\n%s\n", color.ColorizeSection("text", "To clone a repository from this peer:"))
		fmt.Printf("  %s\n", color.C(fmt.Sprintf("secular repos clone <rid> --seed %s", peerNodeID)))
		fmt.Printf("\n%s\n", color.ColorizeSection("text", "Example:"))
		fmt.Printf("  %s\n", color.C(fmt.Sprintf("secular repos clone rad:z4A1... --seed %s", peerNodeID)))
	} else {
		fmt.Printf("  %s repository/repositories:\n\n", color.C(fmt.Sprintf("%d", len(foundRepos))))
		for _, repoLine := range foundRepos {
			fmt.Printf("  %s\n", color.C(repoLine))
		}
		fmt.Printf("\n%s\n", color.ColorizeSection("text", "To clone:"))
		fmt.Printf("  %s\n", color.C("secular repos clone <rid>"))
	}

	return nil
}
