#!/bin/bash

# Secular CLI Installation Script
# Builds and installs the secular binary to ~/.local/bin

set -e

BINARY_NAME="secular"
INSTALL_DIR="$HOME/.local/bin"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}Secular CLI Installation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo -e "${RED}Error: Go is not installed${NC}"
    echo "Please install Go from https://golang.org/dl/"
    exit 1
fi

echo -e "${CYAN}Go version:${NC} $(go version)"

# Navigate to project directory
cd "$PROJECT_DIR"

# Download dependencies
echo -e "\n${CYAN}Downloading dependencies...${NC}"
go mod download
go mod verify
go mod tidy

# Build the binary
echo -e "\n${CYAN}Building ${BINARY_NAME}...${NC}"
go build -v -ldflags "-s -w" -o "$BINARY_NAME" .

if [ ! -f "$BINARY_NAME" ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"

# Create installation directory if it doesn't exist
mkdir -p "$INSTALL_DIR"

# Install the binary
echo -e "\n${CYAN}Installing to ${INSTALL_DIR}...${NC}"
cp "$BINARY_NAME" "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/$BINARY_NAME"

echo -e "${GREEN}✓ Installation complete${NC}"

# Check if install directory is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo -e "\n${CYAN}Note:${NC} $INSTALL_DIR is not in your PATH"
    echo "Add this line to your ~/.bashrc or ~/.zshrc:"
    echo -e "${CYAN}export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}"
fi

# Test the installation
echo -e "\n${CYAN}Testing installation...${NC}"
if command -v secular &> /dev/null; then
    echo -e "${GREEN}✓ secular command is available${NC}"
    echo -e "\n${CYAN}Try running:${NC}"
    echo "  secular --help"
else
    echo -e "${RED}Warning: secular command not found in PATH${NC}"
    echo "You may need to restart your shell or update your PATH"
fi

echo -e "\n${CYAN}Installation Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Binary: $INSTALL_DIR/$BINARY_NAME"
echo "Version: $(./secular --version 2>&1 | grep -o 'v[0-9.]*' || echo 'v0.1.0')"
echo -e "${GREEN}Ready to use!${NC}"
