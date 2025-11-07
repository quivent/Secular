//! Color formatting utilities

use colored::Colorize;

pub fn success(msg: &str) {
    println!("{} {}", "✓".green(), msg);
}

pub fn error(msg: &str) {
    eprintln!("{} {}", "✗".red(), msg);
}

pub fn warning(msg: &str) {
    println!("{} {}", "⚠".yellow(), msg);
}

pub fn info(msg: &str) {
    println!("{} {}", "ℹ".cyan(), msg);
}

pub fn step(msg: &str) {
    println!("{} {}", "→".cyan(), msg);
}
