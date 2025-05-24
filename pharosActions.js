const fs = require("fs");
const path = require("path");
const qs = require("querystring");
const { ethers: e } = require("ethers");
const chalk = require("chalk").default || require("chalk");
const axios = require("axios");
const FakeUserAgent = require("fake-useragent");
const chains = require("./chains");
const pharos = chains.testnet.pharos;
const etc = chains.utils.cliHelpers;
const abi = chains.utils.contractInterfaces;
const contract = chains.utils.contract;

// Constants for Unlimited Faucet
const BASE_API = "https://api.pharosnetwork.xyz";
const REF_CODE = "L0HoBrbC34YT7ezk";
const RPC_URL = "https://testnet.dplabs-internal.com";

// Utility to generate random amount in range (inclusive, in PHRS)
function getRandomAmount(min, max) {
  const amount = (Math.random() * (max - min) + min).toFixed(4); // 4 decimal places
  return e.parseEther(amount);
}

// Utility to mask address
function maskAddress(address) {
  return address ? `${address.slice(0, 6)}${'*'.repeat(6)}${address.slice(-6)}` : "Unknown";
}

// Utility to ask for input (used for wallet generation)
async function askQuestion(question, logger) {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(chalk.greenBright(`${question}: `), (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function performSwapUSDC(logger) {
  for (let a of global.selectedWallets || []) {
    let { privatekey: t, name: $ } = a;
    if (!t) {
      logger.warn(`System | Warning: Skipping ${$ || "wallet with missing data"} due to missing private key`);
      continue;
    }
    try {
      let r = new e.Wallet(t, pharos.provider());
      let o = r.address;
      let i = getRandomAmount(0.2, 0.9); // Random amount between 0.2 and 0.9 PHRS
      let amountStr = e.formatEther(i);
      let s = contract.WPHRS.slice(2).padStart(64, "0") + contract.USDC.slice(2).padStart(64, "0");
      let n = i.toString(16).padStart(64, "0");
      let l =
        "0x04e45aaf" +
        s +
        "0000000000000000000000000000000000000000000000000000000000000bb8" +
        o.toLowerCase().slice(2).padStart(64, "0") +
        n +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
      let c = Math.floor(Date.now() / 1e3) + 600;
      let d = ["function multicall(uint256 deadline, bytes[] calldata data) payable"];
      let p = new e.Contract(contract.SWAP, d, r);
      let f = p.interface.encodeFunctionData("multicall", [c, [l]]);
      await pharos.provider().getFeeData();
      for (let w = 1; w <= global.maxTransaction; w++) {
        logger.info(`System | ${$} | Initiating Swap ${amountStr} PHRS to USDC (${w}/${global.maxTransaction})`);
        let g = {
          to: p.target,
          data: f,
          value: i,
        };
        g.gasLimit = (await pharos.provider().estimateGas(g)) * 12n / 10n;
        let m = await r.sendTransaction(g);
        await m.wait(1);
        logger.info(`System | ${$} | ${etc.timelog()} | Swap Confirmed: ${chalk.green(pharos.explorer.tx(m.hash))}`);
        await etc.delay(5e3);
      }
    } catch (u) {
      logger.error(`System | ${$} | ${etc.timelog()} | Error: ${chalk.red(u.message)}`);
    }
  }
}

async function performSwapUSDT(logger) {
  for (let a of global.selectedWallets || []) {
    let { privatekey: t, name: $ } = a;
    if (!t) {
      logger.warn(`System | Warning: Skipping ${$ || "wallet with missing data"} due to missing private key`);
      continue;
    }
    try {
      let r = new e.Wallet(t, pharos.provider());
      let o = r.address;
      let i = getRandomAmount(0.2, 0.9); // Random amount between 0.2 and 0.9 PHRS
      let amountStr = e.formatEther(i);
      let s = contract.WPHRS.slice(2).padStart(64, "0") + contract.USDT.slice(2).padStart(64, "0");
      let n = i.toString(16).padStart(64, "0");
      let l =
        "0x04e45aaf" +
        s +
        "0000000000000000000000000000000000000000000000000000000000000bb8" +
        o.toLowerCase().slice(2).padStart(64, "0") +
        n +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
      let c = Math.floor(Date.now() / 1e3) + 600;
      let d = ["function multicall(uint256 deadline, bytes[] calldata data) payable"];
      let p = new e.Contract(contract.SWAP, d, r);
      let f = p.interface.encodeFunctionData("multicall", [c, [l]]);
      await pharos.provider().getFeeData();
      for (let w = 1; w <= global.maxTransaction; w++) {
        logger.info(`System | ${$} | Initiating Swap ${amountStr} PHRS to USDT (${w}/${global.maxTransaction})`);
        let g = {
          to: p.target,
          data: f,
          value: i,
        };
        g.gasLimit = (await pharos.provider().estimateGas(g)) * 12n / 10n;
        let m = await r.sendTransaction(g);
        await m.wait(1);
        logger.info(`System | ${$} | ${etc.timelog()} | Swap Confirmed: ${chalk.green(pharos.explorer.tx(m.hash))}`);
        await etc.delay(5e3);
      }
    } catch (u) {
      logger.error(`System | ${$} | ${etc.timelog()} | Error: ${chalk.red(u.message)}`);
    }
  }
}

async function checkBalanceAndApprove(a, t, $, logger) {
  let r = new e.Contract(t, abi.ERC20, a);
  let o = await r.allowance(a.address, $);
  if (0n === o) {
    logger.info(`System | Approving token for ${a.address}`);
    let i = e.MaxUint256;
    try {
      let s = await r.approve($, i);
      await s.wait(1);
      await etc.delay(3e3);
      logger.info(`System | Approval successful for ${a.address}`);
    } catch (n) {
      logger.error(`System | Approval failed: ${chalk.red(n.message)}`);
      return false;
    }
  }
  return true;
}

async function addLpUSDC(logger) {
  for (let a of global.selectedWallets || []) {
    let { privatekey: t, name: $ } = a;
    if (!t) {
      logger.warn(`System | Warning: Skipping ${$ || "wallet with missing data"} due to missing private key`);
      continue;
    }
    try {
      let r = new e.Wallet(t, pharos.provider());
      let o = new e.Contract(contract.ROUTER, abi.ROUTER, r);
      let i = Math.floor(Date.now() / 1e3) + 1800;
      let l = await checkBalanceAndApprove(r, contract.USDC, contract.ROUTER, logger);
      if (!l) {
        continue;
      }
      let amount = getRandomAmount(0.2, 0.5); // Random amount between 0.2 and 0.5
      let amountStr = e.formatEther(amount);
      let c = {
        token0: contract.WPHRS,
        token1: contract.USDC,
        fee: 500,
        tickLower: -887220,
        tickUpper: 887220,
        amount0Desired: amount.toString(),
        amount1Desired: amount.toString(),
        amount0Min: "0",
        amount1Min: "0",
        recipient: r.address,
        deadline: i,
      };
      let d = o.interface.encodeFunctionData("mint", [c]);
      let p = o.interface.encodeFunctionData("refundETH", []);
      let f = [d, p];
      for (let w = 1; w <= global.maxTransaction; w++) {
        logger.info(
          `System | ${$} | Initiating Add Liquidity ${amountStr} PHRS + ${amountStr} USDC (${w}/${global.maxTransaction})`
        );
        let g = await o.multicall(f, {
          value: amount,
          gasLimit: 5e5,
        });
        await g.wait(1);
        logger.info(`System | ${$} | ${etc.timelog()} | Liquidity Added: ${chalk.green(pharos.explorer.tx(g.hash))}`);
        await etc.delay(5e3);
      }
    } catch (m) {
      logger.error(`System | ${$} | ${etc.timelog()} | Error: ${chalk.red(m.message)}`);
    }
  }
}

async function addLpUSDT(logger) {
  for (let a of global.selectedWallets || []) {
    let { privatekey: t, name: $ } = a;
    if (!t) {
      logger.warn(`System | Warning: Skipping ${$ || "wallet with missing data"} due to missing private key`);
      continue;
    }
    try {
      let r = new e.Wallet(t, pharos.provider());
      let o = new e.Contract(contract.ROUTER, abi.ROUTER, r);
      let i = Math.floor(Date.now() / 1e3) + 1800;
      let l = await checkBalanceAndApprove(r, contract.USDT, contract.ROUTER, logger);
      if (!l) {
        continue;
      }
      let amount = getRandomAmount(0.2, 0.5); // Random amount between 0.2 and 0.5
      let amountStr = e.formatEther(amount);
      let c = {
        token0: contract.WPHRS,
        token1: contract.USDT,
        fee: 500,
        tickLower: -887220,
        tickUpper: 887220,
        amount0Desired: amount.toString(),
        amount1Desired: amount.toString(),
        amount0Min: "0",
        amount1Min: "0",
        recipient: r.address,
        deadline: i,
      };
      let d = o.interface.encodeFunctionData("mint", [c]);
      let p = o.interface.encodeFunctionData("refundETH", []);
      let f = [d, p];
      for (let w = 1; w <= global.maxTransaction; w++) {
        logger.info(
          `System | ${$} | Initiating Add Liquidity ${amountStr} PHRS + ${amountStr} USDT (${w}/${global.maxTransaction})`
        );
        let g = await o.multicall(f, {
          value: amount,
          gasLimit: 5e5,
        });
        await g.wait(1);
        logger.info(`System | ${$} | ${etc.timelog()} | Liquidity Added: ${chalk.green(pharos.explorer.tx(g.hash))}`);
        await etc.delay(5e3);
      }
    } catch (m) {
      logger.error(`System | ${$} | ${etc.timelog()} | Error: ${chalk.red(m.message)}`);
    }
  }
}

async function randomTransfer(logger) {
  for (let a of global.selectedWallets || []) {
    let { privatekey: t, name: $ } = a;
    if (!t) {
      logger.warn(`System | Warning: Skipping ${$ || "wallet with missing private key"} due to missing private key`);
      continue;
    }
    try {
      let r = new e.Wallet(t, pharos.provider());
      let o = pharos.provider();
      let s = e.parseEther("0.000001");
      let n = await o.getBalance(r.address);
      if (n < s * BigInt(global.maxTransaction)) {
        logger.warn(
          `System | Warning: ${$} | Insufficient balance (${e.formatEther(
            n
          )}) to transfer 0.000001 PHRS x ${global.maxTransaction} times`
        );
        continue;
      }
      for (let l = 1; l <= global.maxTransaction; l++) {
        let c = e.Wallet.createRandom();
        let d = c.address;
        logger.info(`System | ${$} | Initiating Transfer 0.000001 PHRS to ${d} (${l}/${global.maxTransaction})`);
        let p = await r.sendTransaction({
          to: d,
          value: s,
          gasLimit: 21e3,
          gasPrice: 0,
        });
        await p.wait(1);
        logger.info(`System | ${$} | ${etc.timelog()} | Transfer Confirmed: ${chalk.green(pharos.explorer.tx(p.hash))}`);
        await etc.delay(5e3);
      }
    } catch (f) {
      logger.error(`System | ${$} | ${etc.timelog()} | Transfer Error: ${chalk.red(f.message)}`);
    }
  }
}

async function accountCheck(logger) {
  for (let a of global.selectedWallets || []) {
    let { privatekey: t, token: $, name: r } = a;
    if (!t || !$) {
      logger.warn(`System | Warning: Skipping ${r || "wallet with missing data"} due to missing data`);
      continue;
    }
    try {
      let o = new e.Wallet(t, pharos.provider());
      logger.info(`System | ${r} | Checking Profile Stats for ${o.address}`);
      let s = {
        ...etc.headers,
        authorization: `Bearer ${$}`,
      };
      let n = await axios.get(`https://api.pharosnetwork.xyz/user/profile?address=${o.address}`, {
        headers: s,
      });
      let l = n.data;
      if (0 !== l.code || !l.data.user_info) {
        logger.error(`System | ${r} | Profile check failed: ${chalk.red(l.msg)}`);
        continue;
      }
      let { ID: c, TotalPoints: d, TaskPoints: p, InvitePoints: f } = l.data.user_info;
      logger.info(
        `System | ${r} | ${etc.timelog()} | ID: ${c}, TotalPoints: ${d}, TaskPoints: ${p}, InvitePoints: ${f}`
      );
      await etc.delay(5e3);
    } catch (w) {
      if (axios.isAxiosError(w)) {
        logger.error(
          `System | ${r} | ${etc.timelog()} | HTTP Error: ${chalk.red(
            `${w.response?.status} - ${w.response?.data?.message || w.message}`
          )}`
        );
      } else {
        logger.error(`System | ${r} | ${etc.timelog()} | Error: ${chalk.red(w.message)}`);
      }
    }
    await etc.delay(5e3);
  }
}

async function accountLogin(logger) {
  for (let a of global.selectedWallets || []) {
    let { privatekey: t, token: $, name: r } = a;
    if (!t) {
      logger.warn(`System | Warning: Skipping ${r || "wallet with missing private key"} due to missing private key`);
      continue;
    }
    if (!$) {
      logger.info(`System | ${r} | No token found. Attempting login`);
      await etc.delay(3e3);
      try {
        let o = new e.Wallet(t, pharos.provider());
        let i = await o.signMessage("pharos");
        logger.info(`System | ${r} | Logging in to Pharos for ${o.address}`);
        let n = {
          ...etc.headers,
        };
        let l = await axios.post(
          `https://api.pharosnetwork.xyz/user/login?address=${o.address}&signature=${i}&invite_code=L0HoBrbC34YT7ezk`,
          null,
          { headers: n }
        );
        let c = l.data;
        if (0 !== c.code || !c.data?.jwt) {
          logger.error(`System | ${r} | Login failed: ${chalk.red(c.msg)}`);
          continue;
        }
        a.token = c.data.jwt;
        logger.info(`System | ${r} | Login successful`);
      } catch (p) {
        logger.error(`System | ${r} | ${etc.timelog()} | Login error: ${chalk.red(p.message)}`);
      }
    }
  }
  // Removed wallet.json update logic as private.txt is now used.
  // Tokens, if needed, would be managed in memory or via a different mechanism.
  await etc.delay(5e3);
}

async function accountCheckIn(logger) {
  for (let a of global.selectedWallets || []) {
    let { privatekey: t, token: $, name: r } = a;
    if (!t || !$) {
      logger.warn(`System | Warning: Skipping ${r || "wallet with missing data"} due to missing data`);
      continue;
    }
    try {
      let o = new e.Wallet(t, pharos.provider());
      logger.info(`System | ${r} | Checking in for ${o.address}`);
      let s = {
        ...etc.headers,
        authorization: `Bearer ${$}`,
      };
      let n = await axios.post(`https://api.pharosnetwork.xyz/sign/in?address=${o.address}`, null, {
        headers: s,
      });
      let l = n.data;
      if (0 === l.code) {
        logger.info(`System | ${r} | ${etc.timelog()} | Check-in successful: ${l.msg}`);
      } else if (l.msg?.toLowerCase().includes("already")) {
        logger.info(`System | ${r} | ${etc.timelog()} | Already checked in`);
      } else {
        logger.error(`System | ${r} | ${etc.timelog()} | Check-in failed: ${chalk.red(l.msg || "Unknown error")}`);
      }
    } catch (c) {
      if (axios.isAxiosError(c)) {
        logger.error(
          `System | ${r} | ${etc.timelog()} | HTTP Error: ${chalk.red(
            `${c.response?.status} - ${c.response?.data?.message || c.message}`
          )}`
        );
      } else {
        logger.error(`System | ${r} | ${etc.timelog()} | Error: ${chalk.red(c.message)}`);
      }
    }
    await etc.delay(5e3);
  }
}

async function claimFaucetUSDC(logger) {
  for (let a of global.selectedWallets || []) {
    let { privatekey: t, name: $ } = a;
    if (!t) {
      logger.warn(`System | Warning: Skipping ${$ || "wallet with missing private key"} due to missing private key`);
      continue;
    }
    let r = new e.Wallet(t, pharos.provider());
    try {
      logger.info(`System | ${$} | Claiming USDC for ${r.address}`);
      let o = await axios.post(
        "https://testnet-router.zenithswap.xyz/api/v1/faucet",
        {
          tokenAddress: "0xAD902CF99C2dE2f1Ba5ec4D642Fd7E49cae9EE37",
          userAddress: r.address,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...etc.headers,
          },
        }
      );
      let i = o.data;
      if (200 === i.status && i.data?.txHash) {
        logger.info(`System | ${$} | ${etc.timelog()} | USDC Claimed | TxHash: ${chalk.green(pharos.explorer.tx(i.data.txHash))}`);
      } else {
        logger.error(`System | ${$} | ${etc.timelog()} | USDC Claim failed: ${chalk.red(i.message || "Unknown error")}`);
      }
    } catch (s) {
      if (axios.isAxiosError(s)) {
        let n = s.response?.data?.message || s.message;
        logger.error(`System | ${$} | ${etc.timelog()} | USDC Claim Error: ${chalk.red(n)}`);
      } else {
        logger.error(`System | ${$} | ${etc.timelog()} | USDC Claim Unexpected error: ${chalk.red(s.message)}`);
      }
    }
    await etc.delay(5e3);
  }
}

async function socialTask(logger) {
  let a = [201, 202, 203, 204];
  for (let t of global.selectedWallets || []) {
    let { privatekey: $, token: r, name: o } = t;
    if (!$ || !r) {
      logger.warn(`System | Warning: Skipping ${o || "wallet with missing data"} due to missing data`);
      continue;
    }
    let i = new e.Wallet($, pharos.provider());
    for (let s of a) {
      try {
        logger.info(`System | ${o} | Verifying task ${s} for ${i.address}`);
        let n = qs.stringify({
          address: i.address,
          task_id: s,
        });
        let l = await axios.post("https://api.pharosnetwork.xyz/task/verify", n, {
          headers: {
            ...etc.headers,
            authorization: `Bearer ${r}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
        let c = l.data;
        if (0 === c.code && c.data?.verified) {
          logger.info(`System | ${o} | ${etc.timelog()} | Task ${s} verified successfully for ${i.address}`);
        } else {
          logger.error(`System | ${o} | ${etc.timelog()} | Task ${s} verification failed: ${chalk.red(c.msg || "Unknown error")}`);
        }
      } catch (d) {
        if (axios.isAxiosError(d)) {
          let p = d.response?.data?.msg || d.message;
          logger.error(`System | ${o} | ${etc.timelog()} | Task ${s} HTTP Error: ${chalk.red(p)}`);
        } else {
          logger.error(`System | ${o} | ${etc.timelog()} | Task ${s} Unexpected error: ${chalk.red(d.message)}`);
        }
      }
      await etc.countdown(15e3, "Countdown");
    }
  }
}

async function accountClaimFaucet(logger) {
  for (let a of global.selectedWallets || []) {
    let { privatekey: t, token: $, name: r } = a;
    if (!t || !$) {
      logger.warn(`System | Warning: Skipping ${r || "wallet with missing data"} due to missing data`);
      continue;
    }
    try {
      let o = new e.Wallet(t, pharos.provider());
      logger.info(`System | ${r} | Checking Faucet status for ${o.address}`);
      let s = {
        ...etc.headers,
        authorization: `Bearer ${$}`,
      };
      let n = await axios.get(`https://api.pharosnetwork.xyz/faucet/status?address=${o.address}`, {
        headers: s,
      });
      let l = n.data;
      if (0 !== l.code || !l.data) {
        logger.error(`System | ${r} | Faucet status check failed: ${chalk.red(l.msg || "Unknown error")}`);
        continue;
      }
      if (!l.data.is_able_to_faucet) {
        let c = new Date(1e3 * l.data.avaliable_timestamp).toLocaleString("en-US", {
          timeZone: "Asia/Jakarta",
        });
        logger.info(`System | ${r} | Faucet not available. Next available: ${c}`);
        continue;
      }
      logger.info(`System | ${r} | Claiming Faucet for ${o.address}`);
      let p = await axios.post(`https://api.pharosnetwork.xyz/faucet/daily?address=${o.address}`, null, {
        headers: s,
      });
      let f = p.data;
      if (0 === f.code) {
        logger.info(`System | ${r} | Faucet claimed successfully`);
      } else {
        logger.error(`System | ${r} | Faucet claim failed: ${chalk.red(f.msg || "Unknown error")}`);
      }
    } catch (w) {
      if (axios.isAxiosError(w)) {
        logger.error(
          `System | ${r} | ${etc.timelog()} | HTTP Error: ${chalk.red(
            `${w.response?.status} - ${w.response?.data?.message || w.message}`
          )}`
        );
      } else {
        logger.error(`System | ${r} | ${etc.timelog()} | Error: ${chalk.red(w.message)}`);
      }
    }
    await etc.delay(5e3);
  }
}

async function unlimitedFaucet(logger) {
  const provider = new e.JsonRpcProvider(RPC_URL, { chainId: 688688, name: "pharos-testnet" });
  const headers = {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    Origin: "https://testnet.pharosnetwork.xyz",
    Referer: "https://testnet.pharosnetwork.xyz/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent": new FakeUserAgent().random,
  };

  // Step 1: Generate wallets
  logger.info(`System | Initiating wallet generation`);
  logger.info(`System | --------------------------------------------`);
  const numWallets = parseInt(await askQuestion("How many wallets do you want to create? (0 to skip)", logger));
  if (numWallets > 0) {
    const wallets = [];
    for (let i = 0; i < numWallets; i++) {
      const wallet = e.Wallet.createRandom();
      wallets.push(wallet.privateKey);
      logger.info(`System | Generated wallet ${i + 1}/${numWallets}: ${chalk.green(maskAddress(wallet.address))}`);
    }
    try {
      fs.appendFileSync("address.txt", wallets.join("\n") + "\n");
      logger.info(`System | Saved ${numWallets} wallets to address.txt`);
    } catch (e) {
      logger.error(`System | Error saving to address.txt: ${chalk.red(e.message)}`);
      return;
    }
    logger.info(`System | --------------------------------------------`);
    await etc.delay(3e3);
  }

  // Step 2: Claim faucets
  let successfulClaims = 0;
  let failedClaims = 0;
  let processedCount = 0;

  if (!fs.existsSync("address.txt")) {
    logger.warn(`System | Warning: address.txt not found. Please generate wallets first.`);
    return;
  }

  const privateKeys = fs.readFileSync("address.txt", "utf8").split("\n").filter(Boolean);
  logger.info(`System | Total wallets to process for faucet claims: ${privateKeys.length}`);
  logger.info(`System | --------------------------------------------`);

  for (const privateKey of privateKeys) {
    if (!privateKey) continue;
    processedCount++;
    let walletName = `Wallet${processedCount}`;
    try {
      const wallet = new e.Wallet(privateKey, provider);
      const address = wallet.address;
      logger.info(`System | ${walletName} | Processing wallet [${processedCount}/${privateKeys.length}]: ${chalk.green(maskAddress(address))}`);

      // Generate login URL
      const message = "pharos";
      const signature = await wallet.signMessage(message);
      const urlLogin = `${BASE_API}/user/login?address=${address}&signature=${signature}&invite_code=${REF_CODE}`;

      // Login
      logger.info(`System | ${walletName} | Initiating login`);
      let token = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const response = await axios.post(urlLogin, null, {
            headers: { ...headers, Authorization: "Bearer null", "Content-Length": "0" },
            timeout: 120000,
          });
          token = response.data.data.jwt;
          logger.info(`System | ${walletName} | Login successful`);
          break;
        } catch (e) {
          if (attempt < 4) {
            await etc.delay(5000);
            continue;
          }
          logger.error(`System | ${walletName} | Login failed: ${chalk.red(e.message)}`);
          failedClaims++;
          continue;
        }
      }
      if (!token) {
        logger.warn(`System | ${walletName} | Skipping faucet claim due to login failure`);
        logger.info(`System | --------------------------------------------`);
        continue;
      }

      // Check faucet status
      logger.info(`System | ${walletName} | Checking faucet status`);
      let faucetStatus = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const response = await axios.get(`${BASE_API}/faucet/status?address=${address}`, {
            headers: { ...headers, Authorization: `Bearer ${token}` },
            timeout: 120000,
          });
          faucetStatus = response.data;
          break;
        } catch (e) {
          if (attempt < 4) {
            await etc.delay(5000);
            continue;
          }
          logger.error(`System | ${walletName} | Failed to get faucet status: ${chalk.red(e.message)}`);
          failedClaims++;
          continue;
        }
      }
      if (!faucetStatus) {
        logger.warn(`System | ${walletName} | Skipping faucet claim due to status check failure`);
        logger.info(`System | --------------------------------------------`);
        continue;
      }

      if (faucetStatus.msg === "ok" && faucetStatus.data?.is_able_to_faucet) {
        logger.info(`System | ${walletName} | Initiating faucet claim`);
        let claim = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            const response = await axios.post(`${BASE_API}/faucet/daily?address=${address}`, null, {
              headers: { ...headers, Authorization: `Bearer ${token}`, "Content-Length": "0" },
              timeout: 120000,
            });
            claim = response.data;
            break;
          } catch (e) {
            if (e.response?.data) {
              claim = e.response.data;
              break;
            }
            if (attempt < 4) {
              await etc.delay(5000);
              continue;
            }
            logger.error(`System | ${walletName} | Faucet claim failed: ${chalk.red(e.message)}`);
            failedClaims++;
            continue;
          }
        }
        if (claim?.msg === "ok") {
          logger.info(`System | ${walletName} | ${etc.timelog()} | Faucet claimed successfully: ${chalk.green("0.2 PHRS")}`);
          successfulClaims++;
        } else {
          logger.error(`System | ${walletName} | Faucet claim failed: ${chalk.red(claim?.data?.message || "Unknown error")}`);
          failedClaims++;
        }
      } else {
        const faucetAvailableWib = new Date(faucetStatus.data?.avaliable_timestamp * 1000).toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
        logger.info(`System | ${walletName} | Faucet not available. Next available: ${faucetAvailableWib}`);
        failedClaims++;
      }
      logger.info(`System | --------------------------------------------`);
    } catch (e) {
      logger.error(`System | ${walletName} | ${etc.timelog()} | Error: ${chalk.red(e.message)}`);
      failedClaims++;
      logger.info(`System | --------------------------------------------`);
    }
    await etc.delay(3e3);
  }

  logger.info(`System | Faucet Claim Summary: Successful: ${chalk.green(successfulClaims)}, Failed: ${chalk.red(failedClaims)}`);
  logger.info(`System | --------------------------------------------`);

  // Step 3: Transfer funds to main wallet
  if (!fs.existsSync("wallet.txt")) {
    logger.warn(`System | Warning: wallet.txt not found. Skipping transfers.`);
    return;
  }

  const destAddress = fs.readFileSync("wallet.txt", "utf8").trim();
  if (!e.isAddress(destAddress)) {
    logger.warn(`System | Warning: Invalid wallet address in wallet.txt. Skipping transfers.`);
    return;
  }

  let successfulTransfers = 0;
  let failedTransfers = 0;
  processedCount = 0;

  logger.info(`System | Initiating transfers to main wallet: ${chalk.green(maskAddress(destAddress))}`);
  logger.info(`System | --------------------------------------------`);

  for (const privateKey of privateKeys) {
    if (!privateKey) continue;
    processedCount++;
    let walletName = `Wallet${processedCount}`;
    try {
      const wallet = new e.Wallet(privateKey, provider);
      const address = wallet.address;
      logger.info(`System | ${walletName} | Processing transfer [${processedCount}/${privateKeys.length}]: ${chalk.green(maskAddress(address))}`);

      const balance = await provider.getBalance(address);
      const balanceEth = e.formatEther(balance);
      logger.info(`System | ${walletName} | Balance: ${balanceEth} PHRS`);

      if (parseFloat(balanceEth) <= 0) {
        logger.info(`System | ${walletName} | No funds to transfer`);
        failedTransfers++;
        logger.info(`System | --------------------------------------------`);
        continue;
      }

      logger.info(`System | ${walletName} | Initiating transfer`);
      const gasPrice = await provider.getFeeData();
      const gasLimit = 21000;
      const gasCost = gasPrice.gasPrice * BigInt(gasLimit);
      const amountToSend = balance - gasCost;

      if (amountToSend <= 0) {
        logger.warn(`System | ${walletName} | Balance too low to cover gas fees`);
        failedTransfers++;
        logger.info(`System | --------------------------------------------`);
        continue;
      }

      const tx = await wallet.sendTransaction({
        to: destAddress,
        value: amountToSend,
        gasLimit: gasLimit,
      });
      logger.info(`System | ${walletName} | Transaction sent: ${chalk.green(pharos.explorer.tx(tx.hash))}`);
      await tx.wait();
      logger.info(`System | ${walletName} | ${etc.timelog()} | Transfer Confirmed: ${chalk.green(pharos.explorer.tx(tx.hash))}`);
      successfulTransfers++;
      logger.info(`System | --------------------------------------------`);
    } catch (e) {
      logger.error(`System | ${walletName} | ${etc.timelog()} | Transfer failed: ${chalk.red(e.message)}`);
      failedTransfers++;
      logger.info(`System | --------------------------------------------`);
    }
    await etc.delay(3e3);
  }

  logger.info(`System | Transfer Summary: Successful: ${chalk.green(successfulTransfers)}, Failed: ${chalk.red(failedTransfers)}`);
  logger.info(`System | --------------------------------------------`);
}

module.exports = {
  performSwapUSDC,
  performSwapUSDT,
  addLpUSDC,
  addLpUSDT,
  accountCheckIn,
  accountLogin,
  accountCheck,
  accountClaimFaucet,
  claimFaucetUSDC,
  randomTransfer,
  socialTask,
  unlimitedFaucet,
};
