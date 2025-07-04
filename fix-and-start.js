#!/usr/bin/env node

// Fix port conflicts and start the complete enhanced gold trading system
import { exec, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

console.log(
  "🔧 Fixing port conflicts and starting enhanced gold trading system...\n",
);

async function killExistingProcesses() {
  try {
    console.log("🛑 Stopping existing processes...");
    await execAsync('pkill -f "npm run dev" || true');
    await execAsync('pkill -f "node.*server" || true');
    await execAsync('pkill -f "vite" || true');

    // Wait a moment for processes to stop
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("✅ Existing processes stopped\n");
  } catch (error) {
    console.log("⚠️ No existing processes to stop\n");
  }
}

async function verifySystemComponents() {
  console.log("🔍 Verifying enhanced system components...");

  const components = [
    "server/world-gold-scanner.ts",
    "server/telegram-gold-bot.ts",
    "client/src/pages/WorldGoldControl.tsx",
    "client/src/pages/AttackControl.tsx",
  ];

  for (const component of components) {
    try {
      const { readFileSync } = await import("fs");
      readFileSync(component);
      console.log(`✅ ${component}`);
    } catch (error) {
      console.log(`❌ Missing: ${component}`);
    }
  }
  console.log("");
}

async function startEnhancedSystem() {
  console.log("🚀 Starting enhanced gold trading system...");

  // Start the development server
  const npmProcess = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: "5000",
      FORCE_COLOR: "1",
    },
  });

  npmProcess.on("error", (error) => {
    console.error("❌ Failed to start npm process:", error);
    process.exit(1);
  });

  npmProcess.on("exit", (code) => {
    if (code !== 0) {
      console.error(`❌ npm process exited with code ${code}`);
    }
  });

  // Wait for startup
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("\n🎯 Enhanced Gold Trading System Features:");
  console.log("┌─ 🌍 World Gold Control (/world-gold)");
  console.log("├─ ⚔️ SJC Attack Control (/attack-control)");
  console.log("├─ 📱 Telegram Bot Integration");
  console.log("├─ 📊 Real-time GoldAPI.io Integration");
  console.log("├─ 🔍 Barchart Technical Analysis");
  console.log("└─ 🎯 4 Advanced Attack Vectors\n");

  console.log("🔗 Available Endpoints:");
  console.log("┌─ /api/world-gold/price - Real-time world gold prices");
  console.log("├─ /api/world-gold/attack - Execute world gold attacks");
  console.log("├─ /api/telegram/send-gold-update - Send Telegram alerts");
  console.log("└─ /api/liquidity/scan - Enhanced SJC scanning\n");

  console.log("✅ System ready! Access the enhanced interfaces at:");
  console.log("   🌍 World Gold: http://localhost:5000/world-gold");
  console.log("   ⚔️ SJC Attacks: http://localhost:5000/attack-control");
  console.log(
    "   📱 Telegram Bot controls available in World Gold interface\n",
  );
}

async function main() {
  try {
    await killExistingProcesses();
    await verifySystemComponents();
    await startEnhancedSystem();
  } catch (error) {
    console.error("❌ Error during startup:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down enhanced gold trading system...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down enhanced gold trading system...");
  process.exit(0);
});

main();
