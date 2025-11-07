use serde::{Deserialize, Serialize};
use serde_json::{Value, from_str};
use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader, BufWriter, Write};
use std::time::Instant;
use rayon::prelude::*;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawMessage {
    parent_uuid: Option<String>,
    session_id: Option<String>,
    #[serde(rename = "type")]
    msg_type: String,
    message: Option<Value>,
    uuid: String,
    timestamp: Option<String>,
}

#[derive(Debug, Clone)]
struct ConversationMessage {
    role: String,
    content: String,
    timestamp: String,
    uuid: String,
}

#[derive(Debug, Serialize)]
struct TrainingItem {
    m: Vec<HashMap<String, String>>,
}

struct Extractor {
    sessions: HashMap<String, Vec<RawMessage>>,
    min_turns: usize,
    min_tokens: usize,
}

impl Extractor {
    fn new(min_turns: usize, min_tokens: usize) -> Self {
        Self {
            sessions: HashMap::new(),
            min_turns,
            min_tokens,
        }
    }

    fn load_raw_data(&mut self, filepath: &str) -> std::io::Result<()> {
        let start = Instant::now();
        println!("Loading {}...", filepath);

        let file = File::open(filepath)?;
        let reader = BufReader::with_capacity(1024 * 1024, file); // 1MB buffer

        let mut line_count = 0;
        for line in reader.lines() {
            let line = line?;
            if line.trim().is_empty() {
                continue;
            }

            if let Ok(msg) = from_str::<RawMessage>(&line) {
                let session_id = msg.session_id.clone().unwrap_or_else(|| "unknown".to_string());
                self.sessions.entry(session_id).or_insert_with(Vec::new).push(msg);
                line_count += 1;
            }
        }

        println!(
            "Loaded {} messages from {} sessions in {:?}",
            line_count,
            self.sessions.len(),
            start.elapsed()
        );
        Ok(())
    }

    fn extract_content(&self, msg: &RawMessage) -> Option<String> {
        let message = msg.message.as_ref()?;

        match msg.msg_type.as_str() {
            "user" => {
                // Handle user messages
                if let Some(content) = message.get("content") {
                    // String content
                    if let Some(text) = content.as_str() {
                        return Some(text.to_string());
                    }

                    // Array of content blocks
                    if let Some(blocks) = content.as_array() {
                        let texts: Vec<String> = blocks
                            .iter()
                            .filter_map(|block| {
                                if block.get("type")?.as_str()? == "text" {
                                    Some(block.get("text")?.as_str()?.to_string())
                                } else {
                                    None
                                }
                            })
                            .collect();

                        if !texts.is_empty() {
                            return Some(texts.join("\n"));
                        }
                    }
                }
            }
            "assistant" => {
                // Handle assistant messages
                if let Some(content) = message.get("content") {
                    if let Some(blocks) = content.as_array() {
                        let mut texts = Vec::new();
                        let mut tool_uses = Vec::new();

                        for block in blocks {
                            match block.get("type")?.as_str()? {
                                "text" => {
                                    if let Some(text) = block.get("text").and_then(|t| t.as_str()) {
                                        texts.push(text.to_string());
                                    }
                                }
                                "tool_use" => {
                                    if let Some(name) = block.get("name").and_then(|n| n.as_str()) {
                                        tool_uses.push(format!("[TOOL: {}]", name));
                                    }
                                }
                                _ => {}
                            }
                        }

                        let mut response = texts.join("\n");
                        if !tool_uses.is_empty() {
                            response.push('\n');
                            response.push_str(&tool_uses.join("\n"));
                        }

                        if !response.trim().is_empty() {
                            return Some(response);
                        }
                    }
                }
            }
            _ => {}
        }

        None
    }

    fn reconstruct_conversations(&self) -> Vec<Vec<ConversationMessage>> {
        let start = Instant::now();

        let all_conversations: Vec<Vec<ConversationMessage>> = self.sessions
            .par_iter()
            .flat_map(|(_, messages)| {
                // Build message map
                let msg_map: HashMap<&str, &RawMessage> = messages
                    .iter()
                    .map(|msg| (msg.uuid.as_str(), msg))
                    .collect();

                // Find roots
                let roots: Vec<&RawMessage> = messages
                    .iter()
                    .filter(|msg| {
                        msg.parent_uuid.is_none() ||
                        !msg_map.contains_key(msg.parent_uuid.as_ref().unwrap().as_str())
                    })
                    .collect();

                // Build conversations from each root
                roots
                    .into_iter()
                    .filter_map(|root| {
                        let mut conversation = Vec::new();
                        let mut current = root;

                        loop {
                            if let Some(content) = self.extract_content(current) {
                                conversation.push(ConversationMessage {
                                    role: current.msg_type.clone(),
                                    content,
                                    timestamp: current.timestamp.clone().unwrap_or_default(),
                                    uuid: current.uuid.clone(),
                                });
                            }

                            // Find next message
                            let next_msg = messages
                                .iter()
                                .find(|msg| {
                                    msg.parent_uuid.as_ref() == Some(&current.uuid)
                                });

                            match next_msg {
                                Some(msg) => current = msg,
                                None => break,
                            }
                        }

                        if conversation.len() >= self.min_turns {
                            Some(conversation)
                        } else {
                            None
                        }
                    })
                    .collect::<Vec<_>>()
            })
            .collect();

        println!(
            "Reconstructed {} conversations in {:?}",
            all_conversations.len(),
            start.elapsed()
        );

        all_conversations
    }

    fn filter_quality(&self, conversations: Vec<Vec<ConversationMessage>>) -> Vec<Vec<ConversationMessage>> {
        let start = Instant::now();

        let agentic_keywords = [
            "let me", "first", "then", "next", "because", "however",
            "consider", "alternatively", "analysis", "approach",
        ];

        let filtered: Vec<Vec<ConversationMessage>> = conversations
            .into_par_iter()
            .filter(|conv| {
                // Check minimum token count
                let total_tokens: usize = conv
                    .iter()
                    .map(|msg| msg.content.split_whitespace().count())
                    .sum();

                if total_tokens < self.min_tokens {
                    return false;
                }

                // Check for agentic patterns
                let has_tools = conv
                    .iter()
                    .any(|msg| msg.role == "assistant" && msg.content.contains("[TOOL:"));

                let has_reasoning = conv
                    .iter()
                    .any(|msg| {
                        if msg.role == "assistant" && msg.content.len() > 200 {
                            let content_lower = msg.content.to_lowercase();
                            agentic_keywords.iter().any(|kw| content_lower.contains(kw))
                        } else {
                            false
                        }
                    });

                has_tools || has_reasoning
            })
            .collect();

        println!(
            "Filtered to {} high-quality conversations in {:?}",
            filtered.len(),
            start.elapsed()
        );

        filtered
    }

    fn format_for_training(&self, conversations: Vec<Vec<ConversationMessage>>) -> Vec<TrainingItem> {
        conversations
            .into_iter()
            .map(|conv| {
                let messages = conv
                    .into_iter()
                    .map(|msg| {
                        let mut map = HashMap::new();
                        let role = if msg.role == "user" { "u" } else { "a" };
                        map.insert("r".to_string(), role.to_string());
                        map.insert("c".to_string(), msg.content);
                        map
                    })
                    .collect();

                TrainingItem { m: messages }
            })
            .collect()
    }

    fn save_training_data(&self, output_path: &str, training_data: &[TrainingItem]) -> std::io::Result<()> {
        let start = Instant::now();

        let file = File::create(output_path)?;
        let mut writer = BufWriter::with_capacity(1024 * 1024, file); // 1MB buffer

        let mut total_messages = 0;
        for item in training_data {
            serde_json::to_writer(&mut writer, item)?;
            writer.write_all(b"\n")?;
            total_messages += item.m.len();
        }

        writer.flush()?;

        // Get file size
        let metadata = std::fs::metadata(output_path)?;
        let size_mb = metadata.len() as f64 / (1024.0 * 1024.0);

        println!("\n{}", "=".repeat(60));
        println!("Training data saved to: {}", output_path);
        println!("{}", "=".repeat(60));
        println!("Total conversations: {}", training_data.len());
        println!("Total messages: {}", total_messages);
        println!("File size: {:.2} MB", size_mb);
        println!("Compression ratio: {:.1}x smaller", 1700.0 / size_mb);
        println!("Processing time: {:?}", start.elapsed());
        println!("{}\n", "=".repeat(60));

        Ok(())
    }
}

fn main() -> std::io::Result<()> {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 3 {
        eprintln!("Usage: {} <input.jsonl> <output.jsonl> [min_turns] [min_tokens]", args[0]);
        std::process::exit(1);
    }

    let input_file = &args[1];
    let output_file = &args[2];
    let min_turns = args.get(3).and_then(|s| s.parse().ok()).unwrap_or(3);
    let min_tokens = args.get(4).and_then(|s| s.parse().ok()).unwrap_or(50);

    let total_start = Instant::now();

    let mut extractor = Extractor::new(min_turns, min_tokens);

    extractor.load_raw_data(input_file)?;
    let conversations = extractor.reconstruct_conversations();
    let filtered = extractor.filter_quality(conversations);
    let training_data = extractor.format_for_training(filtered);
    extractor.save_training_data(output_file, &training_data)?;

    println!("Total execution time: {:?}", total_start.elapsed());

    Ok(())
}
