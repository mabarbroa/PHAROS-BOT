# Pharos Auto Bot

[![Version](https://img.shields.io/badge/version-v1.0.0-blue)](https://github.com/crypto-with-shashi/Pharos-Auto-Bot)

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**Pharos Auto Bot** is a robust, modular automation framework built in **Node.js** for interacting with the [Pharos Testnet](https://pharos.network). It handles day-to-day tasks like check-ins, faucet claims, social verifications, and on-chain operations with ease and precision.

Perfect for testers, point farmers, and developers who want to automate repetitive tasks securely and efficiently.



## Features

- **Multi-Account Support**  
  Process unlimited accounts using `private.txt`

- **Proxy Integration**  
  Optional proxy support via `proxy.txt` for IP rotation and privacy.

- **Modular Architecture**  
  Clearly separated services and utilities for clean, scalable code.

- **Task Automation**  
  Automates:
  - Daily check-ins
  - Native/Token (USDC, USDT) faucet claims
  - Social tasks (Follow on X, Retweet, Comment, Join Discord)
  - On-chain actions (Self-transfers, Token swaps, Add liquidity)

- **Multi-Threaded Execution**  
  Efficient task handling using asynchronous JavaScript threading.

- **Cross-Platform Compatibility**  
  Supports Windows, macOS, and Linux (Termux-friendly too).


## File Structure

```bash
PHAROS-BOT/
├── .github/
│   └── workflows/           # GitHub Actions workflows
├── chains/                  # Configuration files for Pharos testnet
├── logs/                    # Log files generated during execution
├── node_modules/            # Installed Node.js dependencies
├── src/                     # Source code directory
├── .gitignore               # Specifies files to ignore in Git
├── LICENSE                  # Project license (GPL-3.0)
├── README.md                # Project documentation
├── package-lock.json        # Records exact versions of installed dependencies
├── package.json             # Project metadata and dependencies
├── pharosActions.js         # Script containing Pharos-related actions
├── pharosbot.js             # Main bot script
├── private.txt              # Contains private keys, one per line
├── proxy.txt                # List of proxy addresses
└── wallet.txt               # Wallet addresses used by the bot

```
## ⚙️ Requirements

Before using the bot, make sure you have:

- [Node.js](https://nodejs.org/) v16+
- Git installed
- A valid Pharos Testnet account → [pharos.network](https://testnet.pharosnetwork.xyz/experience?inviteCode=L0HoBrbC34YT7ezk)
- Optional: Proxy list for stealth mode
- Terminal confidence (a little hacker energy helps)



## 🧠 Installation & setup

Clone this repository

```bash
git clone https://github.com/cryptowithshashi/PHAROS-BOT.git
cd Pharos-Auto-Bot
```
 Install dependencies
```
npm install
```
## Configure your settings

### Multi-Account Support with private.txt

 In `private.txt`, put one private key per line (with or without '0x'). Example:

   ```
   0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
   abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567891
   ```
The bot will read `private.txt` and process all accounts.

To edit `private.txt`:
```
nano private.txt
```
 or use any code editor - Put Your `wallet` Adddress in `wallet.txt` (This seems to be for a single main wallet for transfers, distinct from multi-account private keys)
```
nano wallet.txt
```

## Run the bot
```
node main.js
```
## Disclaimer

This script uses sensitive tokens to interact with a blockchain protocol. Always use with caution and at your own risk. The developer is not liable for any issues arising from use.

## ABOUT ME

- **Twitter**: [https://x.com/SHASHI522004](https://x.com/SHASHI522004)
- **GitHub**: [https://github.com/cryptowithshashi](https://github.com/cryptowithshashi)
