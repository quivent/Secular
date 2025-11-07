package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"
)

type Message struct {
	ParentUUID  string                 `json:"parentUuid"`
	SessionID   string                 `json:"sessionId"`
	Type        string                 `json:"type"`
	Message     json.RawMessage        `json:"message"`
	UUID        string                 `json:"uuid"`
	Timestamp   string                 `json:"timestamp"`
	ToolResult  map[string]interface{} `json:"toolUseResult,omitempty"`
}

type MessageContent struct {
	Role    string                   `json:"role"`
	Content interface{}              `json:"content"`
}

type ContentBlock struct {
	Type  string                 `json:"type"`
	Text  string                 `json:"text,omitempty"`
	Name  string                 `json:"name,omitempty"`
	Input map[string]interface{} `json:"input,omitempty"`
}

type ConversationMessage struct {
	Role      string `json:"role"`
	Content   string `json:"content"`
	Timestamp string `json:"timestamp"`
	UUID      string `json:"uuid"`
}

type TrainingItem struct {
	Messages []map[string]string `json:"messages"`
}

type Extractor struct {
	sessions   map[string][]Message
	minTurns   int
	minTokens  int
}

func NewExtractor(minTurns, minTokens int) *Extractor {
	return &Extractor{
		sessions:  make(map[string][]Message),
		minTurns:  minTurns,
		minTokens: minTokens,
	}
}

func (e *Extractor) LoadRawData(filepath string) error {
	start := time.Now()
	fmt.Printf("Loading %s...\n", filepath)

	file, err := os.Open(filepath)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	buf := make([]byte, 0, 64*1024)
	scanner.Buffer(buf, 10*1024*1024) // 10MB buffer for large lines

	lineCount := 0
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			continue
		}

		var msg Message
		if err := json.Unmarshal([]byte(line), &msg); err != nil {
			continue // Skip malformed lines
		}

		sessionID := msg.SessionID
		if sessionID == "" {
			sessionID = "unknown"
		}

		e.sessions[sessionID] = append(e.sessions[sessionID], msg)
		lineCount++
	}

	if err := scanner.Err(); err != nil {
		return err
	}

	fmt.Printf("Loaded %d messages from %d sessions in %v\n",
		lineCount, len(e.sessions), time.Since(start))
	return nil
}

func (e *Extractor) extractContent(msg Message) string {
	if msg.Type == "user" {
		var content MessageContent
		if err := json.Unmarshal(msg.Message, &content); err != nil {
			return ""
		}

		// Handle string content
		if str, ok := content.Content.(string); ok {
			return str
		}

		// Handle content blocks
		if blocks, ok := content.Content.([]interface{}); ok {
			var texts []string
			for _, block := range blocks {
				if blockMap, ok := block.(map[string]interface{}); ok {
					if blockMap["type"] == "text" {
						if text, ok := blockMap["text"].(string); ok {
							texts.append(text)
						}
					}
				}
			}
			return strings.Join(texts, "\n")
		}
	} else if msg.Type == "assistant" {
		var content MessageContent
		if err := json.Unmarshal(msg.Message, &content); err != nil {
			return ""
		}

		blocks, ok := content.Content.([]interface{})
		if !ok {
			return ""
		}

		var texts []string
		var toolUses []string

		for _, block := range blocks {
			blockMap, ok := block.(map[string]interface{})
			if !ok {
				continue
			}

			blockType, _ := blockMap["type"].(string)
			switch blockType {
			case "text":
				if text, ok := blockMap["text"].(string); ok {
					texts = append(texts, text)
				}
			case "tool_use":
				if name, ok := blockMap["name"].(string); ok {
					toolUses = append(toolUses, fmt.Sprintf("[TOOL: %s]", name))
				}
			}
		}

		response := strings.Join(texts, "\n")
		if len(toolUses) > 0 {
			response += "\n" + strings.Join(toolUses, "\n")
		}

		return strings.TrimSpace(response)
	}

	return ""
}

func (e *Extractor) ReconstructConversations() [][]ConversationMessage {
	start := time.Now()
	var allConversations [][]ConversationMessage

	for sessionID, messages := range e.sessions {
		_ = sessionID // unused

		// Build message map
		msgMap := make(map[string]Message)
		for _, msg := range messages {
			msgMap[msg.UUID] = msg
		}

		// Find roots
		var roots []Message
		for _, msg := range messages {
			if msg.ParentUUID == "" || msgMap[msg.ParentUUID].UUID == "" {
				roots = append(roots, msg)
			}
		}

		// Build conversations from each root
		for _, root := range roots {
			var conversation []ConversationMessage
			current := root

			for {
				content := e.extractContent(current)
				if content != "" {
					conversation = append(conversation, ConversationMessage{
						Role:      current.Type,
						Content:   content,
						Timestamp: current.Timestamp,
						UUID:      current.UUID,
					})
				}

				// Find next message
				var nextMsg *Message
				for i := range messages {
					if messages[i].ParentUUID == current.UUID {
						nextMsg = &messages[i]
						break
					}
				}

				if nextMsg == nil {
					break
				}
				current = *nextMsg
			}

			if len(conversation) >= e.minTurns {
				allConversations = append(allConversations, conversation)
			}
		}
	}

	fmt.Printf("Reconstructed %d conversations in %v\n",
		len(allConversations), time.Since(start))
	return allConversations
}

func (e *Extractor) FilterQuality(conversations [][]ConversationMessage) [][]ConversationMessage {
	start := time.Now()
	var filtered [][]ConversationMessage

	agenticKeywords := []string{
		"let me", "first", "then", "next", "because", "however",
		"consider", "alternatively", "analysis", "approach",
	}

	for _, conv := range conversations {
		// Check minimum token count
		totalTokens := 0
		for _, msg := range conv {
			totalTokens += len(strings.Fields(msg.Content))
		}
		if totalTokens < e.minTokens {
			continue
		}

		// Check for agentic patterns
		hasTools := false
		hasReasoning := false

		for _, msg := range conv {
			if msg.Role == "assistant" {
				if strings.Contains(msg.Content, "[TOOL:") {
					hasTools = true
				}

				if len(msg.Content) > 200 {
					contentLower := strings.ToLower(msg.Content)
					for _, keyword := range agenticKeywords {
						if strings.Contains(contentLower, keyword) {
							hasReasoning = true
							break
						}
					}
				}
			}
		}

		if hasTools || hasReasoning {
			filtered = append(filtered, conv)
		}
	}

	fmt.Printf("Filtered to %d high-quality conversations in %v\n",
		len(filtered), time.Since(start))
	return filtered
}

func (e *Extractor) FormatForTraining(conversations [][]ConversationMessage) []TrainingItem {
	var trainingData []TrainingItem

	for _, conv := range conversations {
		var messages []map[string]string
		for _, msg := range conv {
			messages = append(messages, map[string]string{
				"role":    msg.Role,
				"content": msg.Content,
			})
		}

		trainingData = append(trainingData, TrainingItem{
			Messages: messages,
		})
	}

	return trainingData
}

func (e *Extractor) SaveTrainingData(outputPath string, trainingData []TrainingItem) error {
	start := time.Now()

	file, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := bufio.NewWriter(file)
	defer writer.Flush()

	totalMessages := 0
	for _, item := range trainingData {
		data, err := json.Marshal(item)
		if err != nil {
			continue
		}
		writer.Write(data)
		writer.WriteByte('\n')
		totalMessages += len(item.Messages)
	}

	// Get file size
	fileInfo, _ := os.Stat(outputPath)
	sizeMB := float64(fileInfo.Size()) / (1024 * 1024)

	fmt.Println("\n" + strings.Repeat("=", 60))
	fmt.Printf("Training data saved to: %s\n", outputPath)
	fmt.Println(strings.Repeat("=", 60))
	fmt.Printf("Total conversations: %d\n", len(trainingData))
	fmt.Printf("Total messages: %d\n", totalMessages)
	fmt.Printf("File size: %.2f MB\n", sizeMB)
	fmt.Printf("Compression ratio: %.1fx smaller\n", 1700.0/sizeMB)
	fmt.Printf("Processing time: %v\n", time.Since(start))
	fmt.Println(strings.Repeat("=", 60) + "\n")

	return nil
}

func main() {
	inputFile := flag.String("input", "", "Input JSONL file (Claude Code export)")
	outputFile := flag.String("output", "", "Output JSONL file (training format)")
	minTurns := flag.Int("min-turns", 3, "Minimum conversation turns")
	minTokens := flag.Int("min-tokens", 50, "Minimum total tokens")

	flag.Parse()

	if *inputFile == "" || *outputFile == "" {
		fmt.Println("Usage: extract_training_data -input <file> -output <file>")
		flag.PrintDefaults()
		os.Exit(1)
	}

	totalStart := time.Now()

	extractor := NewExtractor(*minTurns, *minTokens)

	if err := extractor.LoadRawData(*inputFile); err != nil {
		fmt.Printf("Error loading data: %v\n", err)
		os.Exit(1)
	}

	conversations := extractor.ReconstructConversations()
	filtered := extractor.FilterQuality(conversations)
	trainingData := extractor.FormatForTraining(filtered)

	if err := extractor.SaveTrainingData(*outputFile, trainingData); err != nil {
		fmt.Printf("Error saving data: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Total execution time: %v\n", time.Since(totalStart))
}
