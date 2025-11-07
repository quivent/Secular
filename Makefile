# Secular - Makefile

.PHONY: help build install clean test check fmt lint release

# Colors
CYAN := \033[0;36m
GREEN := \033[0;32m
NC := \033[0m

# Configuration
INSTALL_DIR ?= $(HOME)/.local/bin
COMP_DIR_BASH ?= $(HOME)/.local/share/bash-completion/completions
COMP_DIR_ZSH ?= $(HOME)/.zsh/completions

help: ## Show this help
	@echo "$(CYAN)Secular - Build & Install$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

build: ## Build secular CLI (debug)
	@echo "$(CYAN)Building secular...$(NC)"
	@cargo build -p secular
	@echo "$(GREEN)✓ Build complete$(NC)"

release: ## Build secular CLI (release)
	@echo "$(CYAN)Building secular (release)...$(NC)"
	@cargo build --release -p secular
	@echo "$(GREEN)✓ Release build complete$(NC)"

install: release ## Build and install secular CLI
	@echo "$(CYAN)Installing secular...$(NC)"
	@mkdir -p $(INSTALL_DIR)
	@cp target/release/secular $(INSTALL_DIR)/secular
	@ln -sf $(INSTALL_DIR)/secular $(INSTALL_DIR)/sec
	@echo "$(GREEN)✓ Installed to $(INSTALL_DIR)$(NC)"
	@echo ""
	@echo "Add to PATH if needed:"
	@echo "  export PATH=\"$(INSTALL_DIR):\$$PATH\""
	@echo ""
	@echo "Generate completions:"
	@echo "  make completions"

completions: install ## Generate and install shell completions
	@echo "$(CYAN)Installing shell completions...$(NC)"
	@mkdir -p $(COMP_DIR_BASH) $(COMP_DIR_ZSH)
	@$(INSTALL_DIR)/secular completions bash > $(COMP_DIR_BASH)/secular 2>/dev/null || true
	@ln -sf $(COMP_DIR_BASH)/secular $(COMP_DIR_BASH)/sec 2>/dev/null || true
	@$(INSTALL_DIR)/secular completions zsh > $(COMP_DIR_ZSH)/_secular 2>/dev/null || true
	@ln -sf $(COMP_DIR_ZSH)/_secular $(COMP_DIR_ZSH)/_sec 2>/dev/null || true
	@echo "$(GREEN)✓ Completions installed$(NC)"
	@echo ""
	@echo "For zsh, add to ~/.zshrc:"
	@echo "  fpath=($(COMP_DIR_ZSH) \$$fpath)"

test: ## Run tests
	@echo "$(CYAN)Running tests...$(NC)"
	@cargo test --all
	@echo "$(GREEN)✓ Tests passed$(NC)"

check: ## Check code compiles
	@echo "$(CYAN)Checking code...$(NC)"
	@cargo check --all
	@echo "$(GREEN)✓ Check complete$(NC)"

fmt: ## Format code
	@echo "$(CYAN)Formatting code...$(NC)"
	@cargo fmt --all
	@echo "$(GREEN)✓ Format complete$(NC)"

lint: ## Run clippy
	@echo "$(CYAN)Running clippy...$(NC)"
	@cargo clippy --all -- -D warnings
	@echo "$(GREEN)✓ Lint complete$(NC)"

clean: ## Clean build artifacts
	@echo "$(CYAN)Cleaning...$(NC)"
	@cargo clean
	@echo "$(GREEN)✓ Clean complete$(NC)"

uninstall: ## Uninstall secular CLI
	@echo "$(CYAN)Uninstalling secular...$(NC)"
	@rm -f $(INSTALL_DIR)/secular $(INSTALL_DIR)/sec
	@rm -f $(COMP_DIR_BASH)/secular $(COMP_DIR_BASH)/sec
	@rm -f $(COMP_DIR_ZSH)/_secular $(COMP_DIR_ZSH)/_sec
	@echo "$(GREEN)✓ Uninstalled$(NC)"

# Development shortcuts
dev: build ## Quick build for development
	@echo "$(GREEN)✓ Ready for development$(NC)"
	@./target/debug/secular --version

# Full setup
setup: release install completions ## Complete setup (build + install + completions)
	@echo ""
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)  Secular installation complete!$(NC)"
	@echo "$(GREEN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "Try it out:"
	@echo "  $(CYAN)sec --help$(NC)"
	@echo "  $(CYAN)sec init$(NC)"
	@echo "  $(CYAN)sec scan$(NC)"
	@echo ""

# CI/CD targets
ci: check test lint ## Run CI checks
	@echo "$(GREEN)✓ CI checks passed$(NC)"

# Quick install for users
quick: ## Quick install (release + install only)
	@make release install
	@echo ""
	@echo "$(GREEN)✓ Quick install complete!$(NC)"
	@echo "Run: $(CYAN)sec --help$(NC)"
