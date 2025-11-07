package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/joshkornreich/secular/internal/color"
	"github.com/spf13/cobra"
)

// reposCmd represents the repos command
var reposCmd = &cobra.Command{
	Use:   "repos",
	Short: color.C("Repository management commands"),
	Long:  color.C("Manage Radicle repositories and peer-to-peer collaboration"),
}

// pushCmd represents the push command
var pushCmd = &cobra.Command{
	Use:   "push",
	Short: color.C("Push changes to a friend"),
	Long:  color.C("Push repository changes to a friend's remote"),
	RunE:  runPush,
}

var (
	pushFriend string
	pushRepo   string
	pushBranch string
	pushPath   string
)

// pullCmd represents the pull command
var pullCmd = &cobra.Command{
	Use:   "pull",
	Short: color.C("Pull changes from a friend"),
	Long:  color.C("Pull repository changes from a friend's remote"),
	RunE:  runPull,
}

var (
	pullFriend string
	pullRepo   string
	pullBranch string
	pullPath   string
)

// syncCmd represents the sync command
var syncCmd = &cobra.Command{
	Use:   "sync",
	Short: color.C("Sync with the Radicle network"),
	Long:  color.C("Synchronize repository with the Radicle network"),
	RunE:  runSync,
}

var (
	syncPath     string
	syncAnnounce bool
	syncFetch    bool
)

// initRepoCmd represents the init command for repos
var initRepoCmd = &cobra.Command{
	Use:   "init",
	Short: color.C("Initialize a Radicle repository"),
	Long:  color.C("Initialize a new Radicle repository"),
	RunE:  runInitRepo,
}

var (
	initRepoName        string
	initRepoDescription string
	initRepoPrivate     bool
	initRepoPath        string
)

// cloneRepoCmd represents the clone command
var cloneRepoCmd = &cobra.Command{
	Use:   "clone [rid-or-name]",
	Short: color.C("Clone a repository from a friend"),
	Long:  color.C("Clone a Radicle repository using RID or name"),
	Args:  cobra.ExactArgs(1),
	RunE:  runCloneRepo,
}

var (
	cloneRepoPath   string
	cloneRepoSeed   string
	cloneRepoFriend string
)

// listReposCmd represents the list command
var listReposCmd = &cobra.Command{
	Use:   "list",
	Short: color.C("List repositories"),
	Long:  color.C("List all Radicle repositories"),
	RunE:  runListRepos,
}

var (
	listReposDetailed bool
)

// statusRepoCmd represents the status command
var statusRepoCmd = &cobra.Command{
	Use:   "status",
	Short: color.C("Show repository status"),
	Long:  color.C("Show Radicle and Git repository status"),
	RunE:  runStatusRepo,
}

var (
	statusRepoPath string
)

// publishCmd represents the publish command
var publishCmd = &cobra.Command{
	Use:   "publish",
	Short: color.C("Publish repository to network"),
	Long:  color.C("Push and announce repository to the Radicle network"),
	RunE:  runPublish,
}

var (
	publishRepo   string
	publishPath   string
	publishBranch string
)

func init() {
	// Register subcommands
	reposCmd.AddCommand(pushCmd)
	reposCmd.AddCommand(pullCmd)
	reposCmd.AddCommand(syncCmd)
	reposCmd.AddCommand(initRepoCmd)
	reposCmd.AddCommand(cloneRepoCmd)
	reposCmd.AddCommand(listReposCmd)
	reposCmd.AddCommand(statusRepoCmd)
	reposCmd.AddCommand(publishCmd)

	// Push flags
	pushCmd.Flags().StringVarP(&pushFriend, "friend", "f", "", "Friend's name")
	pushCmd.Flags().StringVarP(&pushRepo, "repo", "r", "", "Repository name")
	pushCmd.Flags().StringVarP(&pushBranch, "branch", "b", "", "Branch to push")
	pushCmd.Flags().StringVarP(&pushPath, "path", "p", "", "Repository path")
	pushCmd.MarkFlagRequired("friend")

	// Pull flags
	pullCmd.Flags().StringVarP(&pullFriend, "friend", "f", "", "Friend's name")
	pullCmd.Flags().StringVarP(&pullRepo, "repo", "r", "", "Repository name")
	pullCmd.Flags().StringVarP(&pullBranch, "branch", "b", "", "Branch to pull")
	pullCmd.Flags().StringVarP(&pullPath, "path", "p", "", "Repository path")
	pullCmd.MarkFlagRequired("friend")

	// Sync flags
	syncCmd.Flags().StringVarP(&syncPath, "path", "p", "", "Repository path")
	syncCmd.Flags().BoolVarP(&syncAnnounce, "announce", "a", false, "Announce changes to network")
	syncCmd.Flags().BoolVarP(&syncFetch, "fetch", "f", false, "Fetch from network")

	// Init flags
	initRepoCmd.Flags().StringVarP(&initRepoName, "name", "n", "", "Repository name")
	initRepoCmd.Flags().StringVarP(&initRepoDescription, "description", "d", "", "Repository description")
	initRepoCmd.Flags().BoolVarP(&initRepoPrivate, "private", "P", false, "Make repository private")
	initRepoCmd.Flags().StringVarP(&initRepoPath, "path", "p", "", "Repository path")
	initRepoCmd.MarkFlagRequired("name")

	// Clone flags
	cloneRepoCmd.Flags().StringVarP(&cloneRepoPath, "path", "p", "", "Clone to specific path")
	cloneRepoCmd.Flags().StringVarP(&cloneRepoSeed, "seed", "s", "", "Seed node (Node ID or friend name)")
	cloneRepoCmd.Flags().StringVarP(&cloneRepoFriend, "friend", "f", "", "Friend's name to clone from")

	// List flags
	listReposCmd.Flags().BoolVarP(&listReposDetailed, "detailed", "d", false, "Show detailed information")

	// Status flags
	statusRepoCmd.Flags().StringVarP(&statusRepoPath, "path", "p", "", "Repository path")

	// Publish flags
	publishCmd.Flags().StringVarP(&publishRepo, "repo", "r", "", "Repository name")
	publishCmd.Flags().StringVarP(&publishPath, "path", "p", "", "Repository path")
	publishCmd.Flags().StringVarP(&publishBranch, "branch", "b", "", "Branch to publish")
}

func runPush(cmd *cobra.Command, args []string) error {
	// Determine working directory
	workingDir, err := determineWorkingDir(pushRepo, pushPath)
	if err != nil {
		return err
	}

	// Get branch
	branch := pushBranch
	if branch == "" {
		branch = getCurrentBranch(workingDir)
		if branch == "" {
			branch = "main"
		}
	}

	// Display push info
	fmt.Println(color.C(fmt.Sprintf("Pushing to friend '%s'...", pushFriend)))
	if workingDir != "" {
		fmt.Printf("  Repository: %s\n", color.ColorizeSection("headerbold", workingDir))
	}
	fmt.Printf("  Branch: %s\n", color.ColorizeSection("text", branch))

	// Execute git push
	gitCmd := exec.Command("git", "push", pushFriend, branch)
	if workingDir != "" {
		gitCmd.Dir = workingDir
	}
	gitCmd.Stdout = os.Stdout
	gitCmd.Stderr = os.Stderr

	if err := gitCmd.Run(); err != nil {
		return fmt.Errorf("push failed: %w", err)
	}

	fmt.Println(color.ColorizeSection("headerbold", fmt.Sprintf("✓ Successfully pushed to '%s'!", pushFriend)))
	return nil
}

func runPull(cmd *cobra.Command, args []string) error {
	// Determine working directory
	workingDir, err := determineWorkingDir(pullRepo, pullPath)
	if err != nil {
		return err
	}

	// Get branch
	branch := pullBranch
	if branch == "" {
		branch = getCurrentBranch(workingDir)
		if branch == "" {
			branch = "main"
		}
	}

	// Display pull info
	fmt.Println(color.C(fmt.Sprintf("Pulling from friend '%s'...", pullFriend)))
	if workingDir != "" {
		fmt.Printf("  Repository: %s\n", color.ColorizeSection("headerbold", workingDir))
	}
	fmt.Printf("  Branch: %s\n", color.ColorizeSection("text", branch))

	// Execute git pull
	gitCmd := exec.Command("git", "pull", pullFriend, branch)
	if workingDir != "" {
		gitCmd.Dir = workingDir
	}
	gitCmd.Stdout = os.Stdout
	gitCmd.Stderr = os.Stderr

	if err := gitCmd.Run(); err != nil {
		return fmt.Errorf("pull failed: %w", err)
	}

	fmt.Println(color.ColorizeSection("headerbold", fmt.Sprintf("✓ Successfully pulled from '%s'!", pullFriend)))
	return nil
}

func runSync(cmd *cobra.Command, args []string) error {
	fmt.Println(color.C("Syncing with Radicle network..."))

	// Build rad sync command
	radCmd := exec.Command("rad", "sync")

	if syncAnnounce {
		radCmd.Args = append(radCmd.Args, "--announce")
		fmt.Printf("  Mode: %s\n", color.ColorizeSection("text", "Announce changes"))
	}

	if syncFetch {
		radCmd.Args = append(radCmd.Args, "--fetch")
		fmt.Printf("  Mode: %s\n", color.ColorizeSection("text", "Fetch from network"))
	}

	if syncPath != "" {
		radCmd.Dir = syncPath
	}

	radCmd.Stdout = os.Stdout
	radCmd.Stderr = os.Stderr

	if err := radCmd.Run(); err != nil {
		return fmt.Errorf("sync failed: %w", err)
	}

	fmt.Println(color.ColorizeSection("headerbold", "✓ Sync complete!"))
	return nil
}

func runInitRepo(cmd *cobra.Command, args []string) error {
	fmt.Println(color.C(fmt.Sprintf("Initializing repository '%s'...", initRepoName)))

	// Build rad init command
	radCmd := exec.Command("rad", "init", "--name", initRepoName)

	if initRepoDescription != "" {
		radCmd.Args = append(radCmd.Args, "--description", initRepoDescription)
	}

	if initRepoPrivate {
		radCmd.Args = append(radCmd.Args, "--private")
		fmt.Printf("  Visibility: %s\n", color.ColorizeSection("ocean", "Private"))
	} else {
		radCmd.Args = append(radCmd.Args, "--public")
		fmt.Printf("  Visibility: %s\n", color.ColorizeSection("headerbold", "Public"))
	}

	radCmd.Args = append(radCmd.Args, "--no-confirm")

	if initRepoPath != "" {
		radCmd.Dir = initRepoPath
	}

	radCmd.Stdout = os.Stdout
	radCmd.Stderr = os.Stderr

	if err := radCmd.Run(); err != nil {
		return fmt.Errorf("initialization failed: %w", err)
	}

	fmt.Println(color.ColorizeSection("headerbold", fmt.Sprintf("✓ Repository '%s' initialized!", initRepoName)))
	return nil
}

func runCloneRepo(cmd *cobra.Command, args []string) error {
	ridOrName := args[0]

	// Determine if it's a RID or name
	rid := ridOrName
	if !strings.HasPrefix(ridOrName, "rad:") {
		// Try to find RID by name
		foundRID, err := findRIDByName(ridOrName, cloneRepoFriend)
		if err != nil {
			return err
		}
		if foundRID != "" {
			fmt.Printf("  Found: %s -> %s\n", color.ColorizeSection("headerbold", ridOrName), color.ColorizeSection("text", foundRID))
			rid = foundRID
		} else {
			return fmt.Errorf("repository '%s' not found. Use full RID (rad:z...) or add friend first", ridOrName)
		}
	}

	fmt.Println(color.C(fmt.Sprintf("Cloning %s...", ridOrName)))

	// Build rad clone command
	radCmd := exec.Command("rad", "clone", rid)

	if cloneRepoPath != "" {
		radCmd.Args = append(radCmd.Args, "--path", cloneRepoPath)
	}

	// Resolve seed (can be Node ID or friend name)
	if cloneRepoSeed != "" {
		nodeID := cloneRepoSeed
		if !strings.HasPrefix(cloneRepoSeed, "z6Mk") && !strings.HasPrefix(cloneRepoSeed, "did:key:") {
			// Try to look up friend by name
			foundNodeID, err := getFriendNodeID(cloneRepoSeed)
			if err != nil {
				return err
			}
			if foundNodeID != "" {
				fmt.Printf("  Seed: %s -> %s\n", color.ColorizeSection("headerbold", cloneRepoSeed), color.ColorizeSection("text", foundNodeID))
				nodeID = foundNodeID
			} else {
				return fmt.Errorf("friend '%s' not found. Add first with: secular peer add --name %s <node-id>", cloneRepoSeed, cloneRepoSeed)
			}
		}
		radCmd.Args = append(radCmd.Args, "--seed", nodeID)
	}

	radCmd.Stdout = os.Stdout
	radCmd.Stderr = os.Stderr

	if err := radCmd.Run(); err != nil {
		return fmt.Errorf("clone failed: %w", err)
	}

	fmt.Println(color.ColorizeSection("headerbold", "✓ Repository cloned successfully!"))
	return nil
}

func runListRepos(cmd *cobra.Command, args []string) error {
	fmt.Println(color.ColorizeSection("headerbold", "Repositories:"))
	fmt.Println()

	// Execute rad ls
	radCmd := exec.Command("rad", "ls")
	output, err := radCmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to list repositories: %w", err)
	}

	// Parse output
	repos := parseReposList(string(output))

	if len(repos) == 0 {
		fmt.Printf("  %s\n", color.ColorizeSection("ocean", "No repositories found"))
		fmt.Println()
		fmt.Println(color.ColorizeSection("text", "Initialize a repository with:"))
		fmt.Println("  secular repos init --name my-project")
		return nil
	}

	// Display repositories
	for _, repo := range repos {
		if listReposDetailed {
			visIcon := "🌐"
			if repo.Visibility == "private" {
				visIcon = "🔒"
			}
			fmt.Printf("  %s %s %s\n", color.ColorizeSection("headerbold", "●"), color.ColorizeSection("headerbold", repo.Name), visIcon)
			fmt.Printf("    RID: %s\n", color.ColorizeSection("text", repo.RID))
		} else {
			visIcon := "🌐"
			if repo.Visibility == "private" {
				visIcon = "🔒"
			}
			fmt.Printf("  %s %s %s\n", color.ColorizeSection("headerbold", "●"), color.C(repo.Name), visIcon)
		}
	}

	fmt.Println()
	fmt.Println(color.ColorizeSection("text", fmt.Sprintf("Total: %d repository(ies)", len(repos))))
	fmt.Println()
	fmt.Println(color.ColorizeSection("headerbold", "Push to friend:"))
	fmt.Println("  secular repos push --friend <friend-name>")
	fmt.Println()
	fmt.Println(color.ColorizeSection("headerbold", "Sync to network:"))
	fmt.Println("  secular repos sync --announce")

	return nil
}

func runStatusRepo(cmd *cobra.Command, args []string) error {
	fmt.Println(color.ColorizeSection("headerbold", "Repository Status:"))

	// Execute rad inspect
	radCmd := exec.Command("rad", "inspect")
	if statusRepoPath != "" {
		radCmd.Dir = statusRepoPath
	}

	output, err := radCmd.CombinedOutput()
	if err != nil {
		fmt.Printf("  %s\n", color.ColorizeSection("ocean", "Not a Radicle repository"))
		fmt.Printf("\n%s\n", color.ColorizeSection("text", "Initialize with:"))
		fmt.Println("  secular repos init --name my-project")
	} else {
		fmt.Println(string(output))
	}

	// Show git status
	fmt.Printf("\n%s\n", color.ColorizeSection("headerbold", "Git Status:"))
	gitCmd := exec.Command("git", "status", "--short")
	if statusRepoPath != "" {
		gitCmd.Dir = statusRepoPath
	}

	gitOutput, gitErr := gitCmd.Output()
	if gitErr != nil {
		fmt.Printf("  %s\n", color.ColorizeSection("ocean", "Not a git repository"))
	} else if len(gitOutput) == 0 {
		fmt.Printf("  %s\n", color.ColorizeSection("headerbold", "Working tree clean"))
	} else {
		fmt.Print(string(gitOutput))
	}

	return nil
}

func runPublish(cmd *cobra.Command, args []string) error {
	// Determine working directory
	workingDir, err := determineWorkingDir(publishRepo, publishPath)
	if err != nil {
		return err
	}

	// Get branch
	branch := publishBranch
	if branch == "" {
		branch = getCurrentBranch(workingDir)
		if branch == "" {
			branch = "main"
		}
	}

	fmt.Println(color.ColorizeSection("headerbold", "Publishing repository to network..."))
	if workingDir != "" {
		fmt.Printf("  Repository: %s\n", color.ColorizeSection("headerbold", workingDir))
	}
	fmt.Printf("  Branch: %s\n", color.ColorizeSection("text", branch))
	fmt.Println()

	// Step 1: Push to rad remote
	fmt.Println(color.C("Step 1/2: Pushing to Radicle..."))
	pushRadCmd := exec.Command("git", "push", "rad", branch)
	if workingDir != "" {
		pushRadCmd.Dir = workingDir
	}
	pushRadCmd.Stdout = os.Stdout
	pushRadCmd.Stderr = os.Stderr

	if err := pushRadCmd.Run(); err != nil {
		return fmt.Errorf("push failed: %w", err)
	}
	fmt.Printf("  %s Pushed\n", color.ColorizeSection("headerbold", "✓"))

	// Step 2: Announce to network
	fmt.Println()
	fmt.Println(color.C("Step 2/2: Announcing to network..."))
	announceCmd := exec.Command("rad", "sync", "--announce")
	if workingDir != "" {
		announceCmd.Dir = workingDir
	}

	if err := announceCmd.Run(); err == nil {
		fmt.Printf("  %s Announced\n", color.ColorizeSection("headerbold", "✓"))
	} else {
		fmt.Printf("  %s Network announcement timed out (repo is still accessible)\n", color.ColorizeSection("ocean", "⚠"))
	}

	// Display success
	fmt.Println()
	fmt.Println(color.ColorizeSection("headerbold", "═══════════════════════════════════════════"))
	fmt.Println(color.ColorizeSection("headerbold", "✓ PUBLISHED TO NETWORK!"))
	fmt.Println(color.ColorizeSection("headerbold", "═══════════════════════════════════════════"))
	fmt.Println()

	// Get and display RID
	inspectCmd := exec.Command("rad", "inspect")
	if workingDir != "" {
		inspectCmd.Dir = workingDir
	}
	if ridOutput, err := inspectCmd.Output(); err == nil {
		rid := strings.TrimSpace(string(ridOutput))
		fmt.Printf("  RID: %s\n", color.ColorizeSection("headerbold", rid))
	}

	// Get and display Node ID
	nodeCmd := exec.Command("rad", "node", "status", "--only", "nid")
	if nidOutput, err := nodeCmd.Output(); err == nil {
		nid := strings.TrimSpace(string(nidOutput))
		fmt.Printf("  Your Node ID: %s\n", color.C(nid))
	}

	fmt.Println()
	fmt.Println(color.ColorizeSection("text", "Friends can clone with:"))
	fmt.Println("  secular repos clone <RID> --seed <YOUR_NODE_ID>")
	fmt.Println()

	return nil
}

// Helper functions

func determineWorkingDir(repoName, path string) (string, error) {
	if repoName != "" {
		return findRepoPath(repoName)
	}
	if path != "" {
		return path, nil
	}
	return "", nil
}

func findRepoPath(repoName string) (string, error) {
	// Try rad path command
	cmd := exec.Command("rad", "path", "--repo", repoName)
	if output, err := cmd.Output(); err == nil {
		path := strings.TrimSpace(string(output))
		if path != "" {
			return path, nil
		}
	}

	// Search in current directory tree
	currentDir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	var foundPath string
	filepath.Walk(currentDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if info.IsDir() && info.Name() == repoName {
			gitPath := filepath.Join(path, ".git")
			if _, err := os.Stat(gitPath); err == nil {
				foundPath = path
				return filepath.SkipDir
			}
		}
		// Limit search depth
		if strings.Count(path, string(os.PathSeparator))-strings.Count(currentDir, string(os.PathSeparator)) > 3 {
			return filepath.SkipDir
		}
		return nil
	})

	if foundPath != "" {
		return foundPath, nil
	}

	return "", fmt.Errorf("repository '%s' not found. Try using --path instead", repoName)
}

func getCurrentBranch(dir string) string {
	cmd := exec.Command("git", "rev-parse", "--abbrev-ref", "HEAD")
	if dir != "" {
		cmd.Dir = dir
	}
	if output, err := cmd.Output(); err == nil {
		return strings.TrimSpace(string(output))
	}
	return ""
}

func getFriendNodeID(friendName string) (string, error) {
	cmd := exec.Command("rad", "remote", "list")
	output, err := cmd.Output()
	if err != nil {
		return "", nil
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		parts := strings.Fields(line)
		if len(parts) >= 2 && parts[0] == friendName {
			nodeID := parts[1]
			// Strip did:key: prefix if present
			nodeID = strings.TrimPrefix(nodeID, "did:key:")
			return nodeID, nil
		}
	}

	return "", nil
}

func findRIDByName(name, friend string) (string, error) {
	// Check local repos first
	cmd := exec.Command("rad", "ls")
	output, err := cmd.Output()
	if err != nil {
		return "", nil
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, name) && strings.Contains(line, "rad:") {
			// Parse RID from line
			if idx := strings.Index(line, "rad:"); idx != -1 {
				ridPart := line[idx:]
				fields := strings.Fields(ridPart)
				if len(fields) > 0 {
					return fields[0], nil
				}
			}
		}
	}

	return "", nil
}

type Repository struct {
	Name       string
	RID        string
	Visibility string
}

func parseReposList(output string) []Repository {
	var repos []Repository
	lines := strings.Split(output, "\n")

	for _, line := range lines {
		// Skip table borders and headers
		if strings.HasPrefix(line, "╭") || strings.HasPrefix(line, "├") ||
			strings.HasPrefix(line, "╰") || strings.Contains(line, "Name") ||
			strings.Contains(line, "───") || strings.TrimSpace(line) == "│" ||
			strings.TrimSpace(line) == "" {
			continue
		}

		// Parse data rows: │ Name  RID  Visibility  Head  Description │
		if strings.Contains(line, "│") {
			parts := strings.Split(line, "│")
			if len(parts) >= 2 {
				data := strings.TrimSpace(parts[1])
				if data != "" {
					fields := strings.Fields(data)
					if len(fields) >= 3 {
						repo := Repository{
							Name:       fields[0],
							RID:        fields[1],
							Visibility: fields[2],
						}
						repos = append(repos, repo)
					}
				}
			}
		}
	}

	return repos
}
