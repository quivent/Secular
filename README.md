<div align="center">

```
  ___               _          
 / __| ___ __ _  _| |__ _ _ _ 
 \__ \/ -_) _| || | / _` | '_|
 |___/\___\__|\_,_|_\__,_|_|  
```

**Radicle Heartwood Protocol & Stack**

*A powerful peer-to-peer code collaboration and publishing stack.*

[![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white)](#)
[![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)](#)
[![License](https://img.shields.io/badge/License-MIT%20%2F%20Apache--2.0-blue.svg?style=for-the-badge)](#)

</div>

---

## 📋 Table of Contents
- [🎯 Overview](#-overview)
- [📦 Installation](#-installation)
- [🚀 Running](#-running)
- [🤝 Feedback & Contributing](#-feedback--contributing)
- [📄 License](#-license)

---

## 🎯 Overview

Heartwood is the third iteration of the Radicle Protocol, a powerful peer-to-peer code collaboration and publishing stack. The repository contains a full implementation of Heartwood, complete with a user-friendly command-line interface (`rad`) and network daemon (`radicle-node`).

Radicle was designed to be a secure, decentralized and powerful alternative to code forges such as GitHub and GitLab that preserves user sovereignty and freedom.

> [!NOTE]
> See the [Radicle home page](https://radicle.xyz/) for general information, and the [Zulip chat](https://radicle.zulipchat.com/) to talk to the project.
> See the [Protocol Guide](https://radicle.xyz/guides/protocol) for an in-depth description of how Radicle works.

---

## 📦 Installation

**Requirements**
* *Linux* or *Unix* based operating system.
* Git 2.34 or later
* OpenSSH 9.1 or later with `ssh-agent`

### 📀 From binaries

> [!IMPORTANT]
> Requires `curl` and `tar`.

Run the following command to install the latest binary release:

```bash
curl -sSf https://radicle.xyz/install | sh
```

Or visit our [download](https://radicle.xyz/download) page.

### 📦 From source

> [!IMPORTANT]
> Requires the Rust toolchain.

You can install the Radicle stack from source, by running the following commands from inside this repository:

```bash
cargo install --path crates/radicle-cli --force --locked --root ~/.radicle
cargo install --path crates/radicle-node --force --locked --root ~/.radicle
cargo install --path crates/radicle-remote-helper --force --locked --root ~/.radicle
```

<details>
<summary>Or directly from our seed node</summary>

```bash
cargo install --force --locked --root ~/.radicle \
    --git https://seed.radicle.xyz/z3gqcJUoA1n9HaHKufZs5FCSGazv5.git \
    crates/radicle-cli crates/radicle-node crates/radicle-remote-helper
```
</details>

---

## 🚀 Running

*Systemd* unit files are provided for the node under the `/systemd` folder. They can be used as a starting point for further customization.

For running in debug mode, see [HACKING.md](HACKING.md).

---

## 🤝 Feedback & Contributing

If you have feedback, feel free to create issues using `rad issue`, join [our Zulip](https://radicle.zulipchat.com/), or email [feedback@radicle.xyz](mailto:feedback@radicle.xyz). Emails sent to this address are [automatically posted](https://talently.zulip.com/help/message-a-channel-by-email) to [our **public** #feedback channel on Zulip](https://radicle.zulipchat.com/#narrow/channel/392584-feedback), revealing the [`From` header](https://datatracker.ietf.org/doc/html/rfc2822#section-3.6.2) (which usually contains your name and email address). This allows us to discuss your feedback on Zulip, and, if necessary, respond to you via email.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [HACKING.md](HACKING.md) for an introduction to contributing to Radicle.

---

## 📄 License

Radicle is distributed under the terms of both the MIT license and the Apache License (Version 2.0).

See [LICENSE-APACHE](LICENSE-APACHE) and [LICENSE-MIT](LICENSE-MIT) for details.
