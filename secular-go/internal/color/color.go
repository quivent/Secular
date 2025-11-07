package color

import (
	"fmt"
	"os"
)

// Color codes for ocean/cyan palette
const (
	Reset = "\033[0m"
	Bold  = "\033[1m"

	// Ocean blue/cyan palette for Secular
	CyanCode       = "\033[38;5;51m"  // Bright cyan
	CyanLightCode  = "\033[38;5;87m"  // Lighter cyan
	CyanDarkCode   = "\033[38;5;45m"  // Darker cyan
	OceanCode      = "\033[38;5;39m"  // Ocean blue
	OceanLightCode = "\033[38;5;75m"  // Light ocean blue
	OceanDarkCode  = "\033[38;5;33m"  // Dark ocean blue
	
	// Headers and emphasis
	HeaderCode      = "\033[38;5;51m"  // Bright cyan
	HeaderBoldCode  = "\033[1;38;5;51m"
	EmphasisCode    = "\033[1;38;5;87m" // Bright cyan bold
	
	// All text should be cyan - no white
	TextCode        = "\033[38;5;87m"  // Light cyan for regular text
	TextBoldCode    = "\033[1;38;5;87m"
)

// Colorize applies color to text if terminal supports it
func Colorize(colorCode, text string) string {
	if !SupportsColor() {
		return text
	}
	return colorCode + text + Reset
}

// ColorizeSection applies section-specific coloring (all cyan variants)
func ColorizeSection(section, text string) string {
	var colorCode string

	switch section {
	case "header":
		colorCode = HeaderCode
	case "headerbold":
		colorCode = HeaderBoldCode
	case "emphasis":
		colorCode = EmphasisCode
	case "text":
		colorCode = TextCode
	case "textbold":
		colorCode = TextBoldCode
	case "cyan":
		colorCode = CyanCode
	case "cyanlight":
		colorCode = CyanLightCode
	case "cyandark":
		colorCode = CyanDarkCode
	case "ocean":
		colorCode = OceanCode
	case "oceanlight":
		colorCode = OceanLightCode
	case "oceandark":
		colorCode = OceanDarkCode
	default:
		colorCode = CyanCode // Default to cyan
	}

	return Colorize(colorCode, text)
}

// Cyan formatting shortcuts
func C(text string) string {
	return ColorizeSection("cyan", text)
}

func CL(text string) string {
	return ColorizeSection("cyanlight", text)
}

func CD(text string) string {
	return ColorizeSection("cyandark", text)
}

func O(text string) string {
	return ColorizeSection("ocean", text)
}

func OL(text string) string {
	return ColorizeSection("oceanlight", text)
}

func OD(text string) string {
	return ColorizeSection("oceandark", text)
}

// SupportsColor checks if the terminal supports color output
func SupportsColor() bool {
	term := os.Getenv("TERM")
	if term == "" || term == "dumb" {
		return false
	}

	if os.Getenv("NO_COLOR") != "" {
		return false
	}

	if term == "xterm-256color" || term == "screen-256color" || term == "tmux-256color" ||
		term == "xterm" || term == "screen" || term == "tmux" {
		return true
	}

	if !isTerminal() {
		return false
	}

	return true
}

func isTerminal() bool {
	fileInfo, _ := os.Stdout.Stat()
	return (fileInfo.Mode() & os.ModeCharDevice) != 0
}

// ShowPalette displays the cyan/ocean blue color palette
func ShowPalette() {
	fmt.Println(ColorizeSection("headerbold", "🌊 SECULAR COLOR PALETTE"))
	fmt.Println()

	colors := []struct {
		name, key, desc string
	}{
		{"cyan", "Cyan", "Bright cyan for headers"},
		{"cyanlight", "Cyan Light", "Light cyan for text"},
		{"cyandark", "Cyan Dark", "Dark cyan for emphasis"},
		{"ocean", "Ocean", "Ocean blue for commands"},
		{"oceanlight", "Ocean Light", "Light ocean blue for descriptions"},
		{"oceandark", "Ocean Dark", "Dark ocean blue for accents"},
	}

	for _, c := range colors {
		fmt.Printf("  %s - %s\n",
			ColorizeSection(c.name, c.key),
			ColorizeSection("text", c.desc))
	}
	fmt.Println()
}

