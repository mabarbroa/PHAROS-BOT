const chalk = require("chalk").default || require("chalk");
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const service = require("./pharosActions");
const { setupLogger } = require("./src/utils/logger");

// ---- MENU OPTIONS (Clean, No Emojis) ----
const menuOptions = [
  { label: "Account Login", value: "accountLogin" },
  { label: "Account Check-in", value: "accountCheckIn" },
  { label: "Account Check", value: "accountCheck" },
  { label: "Claim Faucet PHRS", value: "accountClaimFaucet" },
  { label: "Claim Faucet USDC", value: "claimFaucetUSDC" },
  { label: "Swap PHRS to USDC", value: "performSwapUSDC" },
  { label: "Swap PHRS to USDT", value: "performSwapUSDT" },
  { label: "Random Transfer", value: "randomTransfer" },
  { label: "Social Task", value: "socialTask" },
  { label: "Set Transaction Count", value: "setTransactionCount" },
  { label: "Auto Mode (All Tasks)", value: "autoMode" },
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
global.autoMode = false;
global.loopInterval = 60; // minutes
global.autoTasks = [
  "accountLogin",
  "accountCheckIn", 
  "accountClaimFaucet",
  "claimFaucetUSDC",
  "performSwapUSDC", // Swap dengan amount random
  "randomTransfer", // Random transfer ditambahkan
  "socialTask"
];

// ---- UTILITY FUNCTIONS ----
// Generate random PHRS amount between 0.001 and 0.002
function generateRandomSwapAmount() {
  const min = 0.001;
  const max = 0.002;
  const randomAmount = Math.random() * (max - min) + min;
  return parseFloat(randomAmount.toFixed(6)); // 6 decimal places for precision
}

// Generate random transfer amount (very small amount)
function generateRandomTransferAmount() {
  const min = 0.0000001;
  const max = 0.0000002;
  const randomAmount = Math.random() * (max - min) + min;
  return parseFloat(randomAmount.toFixed(10)); // 10 decimal places for precision
}

function loadWalletsFromTxt(logger) {
  const filePath = path.join(__dirname, 'private.txt');
  if (!fs.existsSync(filePath)) {
    logger.error('Error: private.txt file not found.');
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

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
      logger.warn(`Warning: Line ${index + 1} in private.txt is not a valid private key. Skipping.`);
      return null;
    }
    return {
      name: `wallet${index + 1}`,
      privatekey: key
    };
  }).filter(item => item !== null);

  global.selectedWallets = wallets;
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
      process.stdout.write("\r\x1b[K");
    },
  };
}

// Readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Input prompt with timeout for auto mode
function requestInput(promptText, type = "text", defaultValue = "", timeout = 0) {
  return new Promise((resolve) => {
    if (global.autoMode && timeout > 0) {
      // Auto mode dengan timeout
      setTimeout(() => {
        resolve(defaultValue);
      }, timeout);
      console.log(chalk.yellow(`${promptText} [Auto: ${defaultValue}] (${timeout/1000}s)`));
      return;
    }
    
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
  if (global.autoMode) {
    console.log(chalk.yellow.bold("🤖 AUTO MODE AKTIF - Bot berjalan otomatis"));
    console.log(chalk.yellow(`⏱️  Loop interval: ${global.loopInterval} menit`));
    console.log(chalk.cyan(`💰 Swap Amount: Random 0.001-0.002 PHRS`));
    console.log(chalk.cyan(`📤 Transfer Amount: Random 0.0000001-0.0000002 PHRS`));
    console.log();
  }
}

// Display menu
function displayMenu() {
  console.log(chalk.blueBright.bold("\n========[ Pharos Testnet Bot Menu ]========"));
  menuOptions.forEach((opt, idx) => {
    const optionNumber = `${idx + 1}`.padStart(2, '0');
    const marker = global.autoMode && global.autoTasks.includes(opt.value) ? "✅" : "  ";
    console.log(chalk.blue(`${marker}${optionNumber} > ${opt.label.padEnd(35)} <`));
  });
  console.log(chalk.blueBright.bold(">═══════════════════════════════<\n"));
}

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Format time
function formatTime(date) {
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Modified swap function with random amount
async function performRandomSwapUSDC(logger) {
  const randomAmount = generateRandomSwapAmount();
  logger.info(`💰 Melakukan swap dengan amount random: ${randomAmount} PHRS`);
  
  // Set global variable untuk amount yang akan digunakan di pharosActions
  global.randomSwapAmount = randomAmount;
  
  // Call original swap function
  if (service.performSwapUSDC) {
    await service.performSwapUSDC(logger);
  } else {
    logger.error("performSwapUSDC function tidak ditemukan di pharosActions");
  }
}

// Modified random transfer function with very small random amount
async function performRandomTransfer(logger) {
  const randomAmount = generateRandomTransferAmount();
  logger.info(`📤 Melakukan random transfer dengan amount: ${randomAmount} PHRS`);
  
  // Set global variable untuk amount yang akan digunakan di pharosActions
  global.randomTransferAmount = randomAmount;
  
  // Call original random transfer function
  if (service.randomTransfer) {
    await service.randomTransfer(logger);
  } else {
    logger.error("randomTransfer function tidak ditemukan di pharosActions");
  }
}

// Execute auto tasks
async function executeAutoTasks(logger) {
  logger.info("🤖 Memulai Auto Mode - Menjalankan semua tugas otomatis...");
  
  for (const taskValue of global.autoTasks) {
    if (!global.autoMode) break; // Stop jika auto mode dimatikan
    
    const task = menuOptions.find(opt => opt.value === taskValue);
    if (!task) continue;
    
    let spinner;
    try {
      spinner = createSpinner(`Auto: ${task.label}...`);
      
      // Special handling untuk swap dengan random amount
      if (taskValue === "performSwapUSDC") {
        const randomAmount = generateRandomSwapAmount();
        logger.info(`🔄 Auto: Menjalankan ${task.label} dengan amount ${randomAmount} PHRS...`);
        await performRandomSwapUSDC(logger);
      } 
      // Special handling untuk random transfer dengan very small random amount
      else if (taskValue === "randomTransfer") {
        const randomAmount = generateRandomTransferAmount();
        logger.info(`🔄 Auto: Menjalankan ${task.label} dengan amount ${randomAmount} PHRS...`);
        await performRandomTransfer(logger);
      } 
      // Regular tasks
      else {
        logger.info(`🔄 Auto: Menjalankan ${task.label}...`);
        const scriptFunc = service[taskValue];
        if (scriptFunc) {
          await scriptFunc(logger);
        } else {
          logger.warn(`⚠️  Auto: ${task.label} tidak tersedia.`);
        }
      }
      
      logger.info(`✅ Auto: ${task.label} selesai.`);
      spinner.stop();
      
      // Delay antar task (5-10 detik)
      const delay = Math.floor(Math.random() * 5000) + 5000;
      logger.info(`⏳ Menunggu ${delay/1000} detik sebelum task berikutnya...`);
      await sleep(delay);
      
    } catch (error) {
      if (spinner) spinner.stop();
      logger.error(`❌ Auto: Error pada ${task.label}: ${error.message}`);
      await sleep(3000); // Wait 3 seconds before continuing
    }
  }
}

// Auto mode loop
async function autoModeLoop(logger) {
  while (global.autoMode) {
    try {
      const startTime = new Date();
      logger.info(`🚀 Memulai cycle auto mode pada ${formatTime(startTime)}`);
      
      await executeAutoTasks(logger);
      
      if (!global.autoMode) break;
      
      const endTime = new Date();
      const cycleDuration = Math.floor((endTime - startTime) / 1000);
      logger.info(`✅ Cycle selesai dalam ${cycleDuration} detik`);
      
      // Hitung waktu tunggu
      const waitTime = global.loopInterval * 60 * 1000; // Convert to milliseconds
      const nextRun = new Date(Date.now() + waitTime);
      
      logger.info(`⏰ Cycle berikutnya akan dimulai pada ${formatTime(nextRun)}`);
      logger.info(`💤 Menunggu ${global.loopInterval} menit...`);
      
      // Countdown timer
      for (let i = global.loopInterval; i > 0 && global.autoMode; i--) {
        process.stdout.write(`\r${chalk.yellow(`⏳ Sisa waktu: ${i} menit...`)}`);
        await sleep(60000); // Wait 1 minute
      }
      
      if (global.autoMode) {
        process.stdout.write("\r\x1b[K"); // Clear countdown line
      }
      
    } catch (error) {
      logger.error(`❌ Error dalam auto mode loop: ${error.message}`);
      await sleep(30000); // Wait 30 seconds before retry
    }
  }
  
  logger.info("🛑 Auto mode dihentikan.");
}

// Setup auto mode
async function setupAutoMode(logger) {
  console.log(chalk.yellow.bold("\n🤖 SETUP AUTO MODE"));
  console.log(chalk.cyan("Auto mode akan menjalankan semua tugas secara otomatis dalam loop."));
  console.log(chalk.cyan("Tugas yang akan dijalankan:"));
  
  global.autoTasks.forEach((taskValue, index) => {
    const task = menuOptions.find(opt => opt.value === taskValue);
    if (task) {
      let taskLabel = task.label;
      if (taskValue === "performSwapUSDC") {
        taskLabel += " (Random 0.001-0.002 PHRS)";
      } else if (taskValue === "randomTransfer") {
        taskLabel += " (Random 0.0000001-0.0000002 PHRS)";
      }
      console.log(chalk.green(`  ${index + 1}. ${taskLabel}`));
    }
  });
  
  const interval = await requestInput("\nMasukkan interval loop (menit)", "number", "60");
  if (interval && interval > 0) {
    global.loopInterval = interval;
  }
  
  const txCount = await requestInput("Jumlah transaksi per wallet", "number", global.maxTransaction.toString());
  if (txCount && txCount > 0) {
    global.maxTransaction = txCount;
  }
  
  console.log(chalk.yellow(`\n⚙️  Konfigurasi Auto Mode:`));
  console.log(chalk.yellow(`   - Interval: ${global.loopInterval} menit`));
  console.log(chalk.yellow(`   - Transaksi per wallet: ${global.maxTransaction}`));
  console.log(chalk.yellow(`   - Jumlah wallet: ${global.selectedWallets.length}`));
  console.log(chalk.cyan(`   - Swap Amount: Random 0.001-0.002 PHRS`));
  console.log(chalk.cyan(`   - Transfer Amount: Random 0.0000001-0.0000002 PHRS`));
  
  const confirm = await requestInput("\nMulai auto mode? (y/n)", "text", "y");
  if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
    global.autoMode = true;
    logger.info("🤖 Auto mode diaktifkan!");
    
    // Start auto mode loop in background
    autoModeLoop(logger).catch(error => {
      logger.error(`Auto mode error: ${error.message}`);
      global.autoMode = false;
    });
    
    return true;
  }
  
  return false;
}

// ---- MAIN ----
async function main() {
  const logger = setupLogger();
  
  // Initialize
  displayBanner();
  loadWalletsFromTxt(logger);
  logger.info(`✅ Pharos Bot is live | Wallets loaded: ${global.selectedWallets.length}`);

  // Setup awal
  if (!global.autoMode) {
    const txCount = await requestInput("Jumlah transaksi per wallet", "number", "5");
    if (isNaN(txCount) || txCount <= 0) {
      global.maxTransaction = 5;
      logger.info("System | Invalid transaction count. Using default: 5");
    } else {
      global.maxTransaction = txCount;
      logger.info(`System | Set transaction count to: ${txCount}`);
    }
  }

  // Main loop
  while (true) {
    if (!global.autoMode) {
      displayBanner();
      displayMenu();
      
      const choice = await requestInput("Pilih opsi (1-12)", "number");
      const idx = choice - 1;

      if (isNaN(idx) || idx < 0 || idx >= menuOptions.length) {
        logger.warn("System | Opsi tidak valid. Coba lagi.");
        await sleep(1000);
        continue;
      }

      const selected = menuOptions[idx];
      
      if (selected.value === "exit") {
        global.autoMode = false;
        logger.info("System | Keluar...");
        await sleep(500);
        rl.close();
        process.exit(0);
      }

      if (selected.value === "autoMode") {
        const started = await setupAutoMode(logger);
        if (started) {
          continue; // Continue to let auto mode run
        } else {
          await sleep(1000);
          continue;
        }
      }

      if (selected.value === "setTransactionCount") {
        const newTxCount = await requestInput("Jumlah transaksi per wallet", "number", global.maxTransaction.toString());
        if (isNaN(newTxCount) || newTxCount <= 0) {
          logger.warn("System | Invalid transaction count. Keeping current: " + global.maxTransaction);
        } else {
          global.maxTransaction = newTxCount;
          logger.info(`System | Set transaction count to: ${newTxCount}`);
        }
        await sleep(1000);
        continue;
      }

      let spinner;
      try {
        spinner = createSpinner(`Running ${selected.label}...`);
        logger.info(`System | Starting ${selected.label}...`);
        
        // Special handling untuk manual swap dengan random amount
        if (selected.value === "performSwapUSDC") {
          await performRandomSwapUSDC(logger);
        } 
        // Special handling untuk manual random transfer dengan very small random amount
        else if (selected.value === "randomTransfer") {
          await performRandomTransfer(logger);
        } 
        // Regular tasks
        else {
          const scriptFunc = service[selected.value];
          if (scriptFunc) {
            await scriptFunc(logger);
          } else {
            logger.error(`System | Error: ${selected.label} not implemented.`);
          }
        }
        
        logger.info(`System | ${selected.label} completed.`);
        spinner.stop();
      } catch (e) {
        logger.error(`System | Error in ${selected.label}: ${e.message}`);
        if (spinner) spinner.stop();
      }

      await requestInput("Tekan Enter untuk melanjutkan...");
    } else {
      // Auto mode is running, just wait
      await sleep(5000);
      
      // Check for user input to stop auto mode
      if (process.stdin.readable) {
        const input = await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(null), 100);
          process.stdin.once('data', (data) => {
            clearTimeout(timeout);
            resolve(data.toString().trim());
          });
        });
        
        if (input && (input.toLowerCase() === 'stop' || input.toLowerCase() === 'exit')) {
          global.autoMode = false;
          logger.info("🛑 Auto mode dihentikan oleh user.");
        }
      }
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Bot dihentikan oleh user (Ctrl+C)'));
  global.autoMode = false;
  rl.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n🛑 Bot dihentikan oleh sistem'));
  global.autoMode = false;
  rl.close();
  process.exit(0);
});

// ---- Run ----
(async () => {
  try {
    await main();
  } catch (error) {
    console.error(chalk.red(`Fatal error: ${error.message}`));
    rl.close();
    process.exit(1);
  }
})();
