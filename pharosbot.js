const chalk = require("chalk").default || require("chalk");
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const service =require("./pharosActions");
const { setupLogger } = require("./src/utils/logger"); // Import Winston logger

// ---- MENU OPTIONS (Clean, No Emojis) ----
const menuOptions = [
  { label: "Account Login", value: "accountLogin" },
  { label: "Account Check-in", value: "accountCheckIn" },
  { label: "Account Check", value: "accountCheck" },
  { label: "Claim Faucet PHRS", value: "accountClaimFaucet" },
  { label: "Claim Faucet USDC", value: "claimFaucetUSDC" },
  { label: "Swap PHRS to USDC", value: "performSwapUSDC" },
  { label: "Swap PHRS to USDT", value: "performSwapUSDT" },
  { label: "Add Liquidity PHRS-USDC", value: "addLpUSDC" },
  { label: "Add Liquidity PHRS-USDT", value: "addLpUSDT" },
  { label: "Random Transfer", value: "randomTransfer" },
  { label: "Social Task", value: "socialTask" },
  { label: "Set Transaction Count", value: "setTransactionCount" },
  { label: "Exit", value: "exit" },
];

// ASCII Art Banner
const asciiBannerLines = [
  "██████╗     ██╗  ██╗     █████╗     ██████╗      ██████╗     ███████╗",
  "██╔══██╗    ██║  ██║    ██╔══██╗    ██╔══██╗    ██╔═══██╗    ██╔════╝",
  "██████╔╝    ███████║    ███████║    ██████╔╝    ██║   ██║    ███████╗",
  "██╔═══╝     ██╔══██║    ██╔══██║    ██╔══██╗    ██║   ██║    ╚════██║",
  "██║         ██║  ██║    ██║  ██║    ██║  ██║    ╚██████╔╝    ███████║",
  "╚═╝         ╚═╝  ╚═╝    ╚═╝  ╚═╝    ╚═╝  ╚═╝     ╚═════╝     ╚══════╝",
  "",
  "       Pharos Testnet Bot -- Modified by CryptoWithShashi       ",
];

// ---- GLOBAL VARIABLES ----
global.selectedWallets = [];
global.maxTransaction = 5;

// ---- UTILITY FUNCTIONS ----
// Load wallets from private.txt
function loadWalletsFromTxt(logger) { // Pass logger instance
  const filePath = path.join(__dirname, 'private.txt');
  if (!fs.existsSync(filePath)) {
    logger.error('Error: private.txt file not found.'); // Use logger
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

  // Validate and normalize each line
  function isValidPrivateKey(key) {
    const hex = key.startsWith('0x') ? key.slice(2) : key;
    return /^[0-9A-Fa-f]{64}$/.test(hex);
  }

  const wallets = lines.map((rawKey, index) => {
    let key = rawKey.trim();
    if (!key.startsWith('0x')) {
      key = `0x${key}`;
    }
    if (!isValidPrivateKey(key)) {
      logger.warn(`Warning: Line ${index + 1} in private.txt is not a valid private key. Skipping.`); // Use logger
      return null;
    }
    return {
      name: `wallet${index + 1}`,
      privatekey: key
    };
  }).filter(item => item !== null);

  global.selectedWallets = wallets; // Update global variable
  return wallets;
}

// Spinner animation
const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
function createSpinner(text) {
  let frameIndex = 0;
  let stopped = false;

  const interval = setInterval(() => {
    if (stopped) return;
    process.stdout.write(`\r${chalk.green(spinnerFrames[frameIndex])} ${chalk.greenBright(text)}`);
    frameIndex = (frameIndex + 1) % spinnerFrames.length;
  }, 100);

  return {
    stop: () => {
      stopped = true;
      clearInterval(interval);
      process.stdout.write("\r\x1b[K"); // Clear line
    },
  };
}

// Readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Input prompt
function requestInput(promptText, type = "text", defaultValue = "") {
  return new Promise((resolve) => {
    rl.question(chalk.greenBright(`${promptText}${defaultValue ? ` [${defaultValue}]` : ""}: `), (value) => {
      if (type === "number") value = Number(value);
      if (value === "" || (type === "number" && isNaN(value))) value = defaultValue;
      resolve(value);
    });
  });
}

// Display banner
function displayBanner() {
  console.clear();
  console.log(chalk.hex("#D8BFD8").bold(asciiBannerLines.join("\n")));
  console.log();
}

// Display menu
function displayMenu() {
  console.log(chalk.blueBright.bold("\n========[ Pharos Testnet Bot Menu ]========"));
  menuOptions.forEach((opt, idx) => {
    const optionNumber = `${idx + 1}`.padStart(2, '0'); // Two-digit numbering
    console.log(chalk.blue(`  ${optionNumber} > ${opt.label.padEnd(35)} <`));
  });
  console.log(chalk.blueBright.bold(">═══════════════════════════════<\n"));
}

// ---- MAIN ----
async function main() {
  // Initialize Winston Logger
  const logger = setupLogger();

  // Initialize
  displayBanner();
  loadWalletsFromTxt(logger); // Pass logger instance
  logger.info(`✅ Pharos Bot is live | Wallets loaded: ${global.selectedWallets.length}`);

  // Initial transaction count
  const txCount = await requestInput("How many transactions should be executed per wallet?", "number", "5");
  if (isNaN(txCount) || txCount <= 0) {
    global.maxTransaction = 5;
    logger.info("System | Invalid transaction count. Using default: 5");
  } else {
    global.maxTransaction = txCount;
    logger.info(`System | Set transaction count to: ${txCount}`);
  }

  // Main loop
  while (true) {
    displayBanner();
    displayMenu();
    const choice = await requestInput("Select an option (1-13)", "number");
    const idx = choice - 1;

    if (isNaN(idx) || idx < 0 || idx >= menuOptions.length) {
      logger.warn("System | Invalid option. Try again."); // Use logger.warn
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    const selected = menuOptions[idx];
    if (selected.value === "exit") {
      logger.info("System | Exiting...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      rl.close();
      process.exit(0);
    }

    if (selected.value === "setTransactionCount") {
      const newTxCount = await requestInput("How many transactions should be executed per wallet?", "number", global.maxTransaction.toString());
      if (isNaN(newTxCount) || newTxCount <= 0) {
        logger.warn("System | Invalid transaction count. Keeping current: " + global.maxTransaction); // Use logger.warn
      } else {
        global.maxTransaction = newTxCount;
        logger.info(`System | Set transaction count to: ${newTxCount}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    let spinner; // Declare spinner outside try block
    try {
      spinner = createSpinner(`Running ${selected.label}...`);
      logger.info(`System | Starting ${selected.label}...`);
      const scriptFunc = service[selected.value];
      if (scriptFunc) {
        await scriptFunc(logger); // Pass Winston logger
        logger.info(`System | ${selected.label} completed.`);
      } else {
        logger.error(`System | Error: ${selected.label} not implemented.`); // Use logger.error
      }
      spinner.stop();
    } catch (e) {
      logger.error(`System | Error in ${selected.label}: ${e.message}`); // Use logger.error
      if (spinner) spinner.stop(); // Ensure spinner is stopped on error
    }

    await requestInput("Press Enter to continue...");
  }
}

// ---- Run ----
(async () => {
  try {
    await main();
  } catch (error) {

    rl.close();
    process.exit(1);
  }
})();
