#!/usr/bin/env python3
"""
Extract training data from Claude Code conversation exports.
Filters for high-quality agentic conversations showing self-reinforcement patterns.
"""

import json
from pathlib import Path
from collections import defaultdict
from typing import List, Dict, Optional

class ConversationExtractor:
    def __init__(self, min_turns: int = 3, min_tokens: int = 50):
        """
        Args:
            min_turns: Minimum conversation turns to include (filters trivial Q&A)
            min_tokens: Minimum assistant response length (filters low-quality)
        """
        self.min_turns = min_turns
        self.min_tokens = min_tokens
        self.sessions = defaultdict(list)

    def load_raw_data(self, filepath: str):
        """Load Claude Code export JSONL"""
        print(f"Loading {filepath}...")
        with open(filepath, 'r') as f:
            for line in f:
                if line.strip():
                    msg = json.loads(line)
                    session_id = msg.get('sessionId', 'unknown')
                    self.sessions[session_id].append(msg)

        print(f"Found {len(self.sessions)} sessions")

    def extract_content(self, msg: Dict) -> Optional[str]:
        """Extract actual text content from message"""
        if msg['type'] == 'user':
            # User text messages
            content = msg.get('message', {})
            if isinstance(content, dict):
                text_parts = content.get('content', [])
                if isinstance(text_parts, str):
                    return text_parts
                # Extract from content blocks
                texts = []
                for part in text_parts:
                    if isinstance(part, dict) and part.get('type') == 'text':
                        texts.append(part.get('text', ''))
                return '\n'.join(texts) if texts else None
            elif isinstance(content, str):
                return content

        elif msg['type'] == 'assistant':
            # Assistant text responses
            content = msg.get('message', {}).get('content', [])
            texts = []
            tool_uses = []

            for block in content:
                if block.get('type') == 'text':
                    texts.append(block.get('text', ''))
                elif block.get('type') == 'tool_use':
                    # Include tool use for agentic patterns
                    tool_name = block.get('name', '')
                    tool_input = block.get('input', {})
                    tool_uses.append(f"[TOOL: {tool_name}]")

            response = '\n'.join(texts)
            if tool_uses:
                response += '\n' + '\n'.join(tool_uses)
            return response if response.strip() else None

        return None

    def reconstruct_conversations(self) -> List[List[Dict]]:
        """Reconstruct conversation threads from messages"""
        conversations = []

        for session_id, messages in self.sessions.items():
            # Build parent-child map
            msg_map = {msg['uuid']: msg for msg in messages}

            # Find conversation roots (no parent or parent not in session)
            roots = []
            for msg in messages:
                parent = msg.get('parentUuid')
                if not parent or parent not in msg_map:
                    roots.append(msg)

            # Build conversations from each root
            for root in roots:
                conversation = []
                current = root

                while current:
                    content = self.extract_content(current)
                    if content:
                        conversation.append({
                            'role': 'user' if current['type'] == 'user' else 'assistant',
                            'content': content,
                            'timestamp': current.get('timestamp', ''),
                            'uuid': current['uuid']
                        })

                    # Find next message (child of current)
                    next_msg = None
                    for msg in messages:
                        if msg.get('parentUuid') == current['uuid']:
                            next_msg = msg
                            break
                    current = next_msg

                if len(conversation) >= self.min_turns:
                    conversations.append(conversation)

        return conversations

    def filter_quality(self, conversations: List[List[Dict]]) -> List[List[Dict]]:
        """Filter for high-quality agentic conversations"""
        filtered = []

        for conv in conversations:
            # Check minimum token count
            total_tokens = sum(len(msg['content'].split()) for msg in conv)
            if total_tokens < self.min_tokens:
                continue

            # Check for agentic patterns (tool use, iteration, reasoning)
            has_tools = any('[TOOL:' in msg['content'] for msg in conv if msg['role'] == 'assistant')
            has_reasoning = any(
                len(msg['content']) > 200 and
                any(keyword in msg['content'].lower() for keyword in [
                    'let me', 'first', 'then', 'next', 'because', 'however',
                    'consider', 'alternatively', 'analysis', 'approach'
                ])
                for msg in conv if msg['role'] == 'assistant'
            )

            if has_tools or has_reasoning:
                filtered.append(conv)

        return filtered

    def format_for_training(self, conversations: List[List[Dict]]) -> List[Dict]:
        """Format conversations for training"""
        training_data = []

        for conv in conversations:
            # Multi-turn conversation format
            messages = []
            for msg in conv:
                messages.append({
                    'role': msg['role'],
                    'content': msg['content']
                })

            training_data.append({
                'messages': messages
            })

        return training_data

    def save_training_data(self, output_path: str, training_data: List[Dict]):
        """Save formatted training data"""
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'w') as f:
            for item in training_data:
                f.write(json.dumps(item) + '\n')

        # Calculate statistics
        total_size = output_file.stat().st_size / (1024**2)  # MB
        total_messages = sum(len(item['messages']) for item in training_data)

        print(f"\n{'='*60}")
        print(f"Training data saved to: {output_path}")
        print(f"{'='*60}")
        print(f"Total conversations: {len(training_data)}")
        print(f"Total messages: {total_messages}")
        print(f"File size: {total_size:.2f} MB")
        print(f"Compression ratio: {(1700/total_size):.1f}x smaller")
        print(f"{'='*60}\n")

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Extract training data from Claude Code exports')
    parser.add_argument('input', help='Input JSONL file (Claude Code export)')
    parser.add_argument('output', help='Output JSONL file (training format)')
    parser.add_argument('--min-turns', type=int, default=3,
                       help='Minimum conversation turns (default: 3)')
    parser.add_argument('--min-tokens', type=int, default=50,
                       help='Minimum total tokens (default: 50)')

    args = parser.parse_args()

    # Extract and filter
    extractor = ConversationExtractor(
        min_turns=args.min_turns,
        min_tokens=args.min_tokens
    )

    extractor.load_raw_data(args.input)
    conversations = extractor.reconstruct_conversations()
    print(f"Reconstructed {len(conversations)} conversations")

    filtered = extractor.filter_quality(conversations)
    print(f"Filtered to {len(filtered)} high-quality conversations")

    training_data = extractor.format_for_training(filtered)
    extractor.save_training_data(args.output, training_data)

if __name__ == '__main__':
    main()
