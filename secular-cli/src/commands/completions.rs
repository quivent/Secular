//! Shell completions generation

use clap::CommandFactory;
use clap_complete::Shell;

pub fn generate(shell: Shell) {
    let mut cmd = crate::Cli::command();
    let bin_name = "secular";

    clap_complete::generate(shell, &mut cmd, bin_name, &mut std::io::stdout());
}
