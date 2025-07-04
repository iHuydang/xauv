const { execSync } = require("child_process");
const { spawn } = require("child_process");

console.log("🔧 Fixing port conflict and starting system...");

// First, try to find and kill any process on port 5000
try {
  // Use fuser to find and kill process on port 5000
  execSync("fuser -k 5000/tcp 2>/dev/null || true", { stdio: "inherit" });
  console.log("✅ Port 5000 cleared");
} catch (e) {
  console.log("⚠️ Could not clear port 5000, continuing...");
}

// Wait a moment for port to be fully released
setTimeout(() => {
  console.log("🚀 Starting application...");

  // Start the application
  const npmStart = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    shell: true,
  });

  npmStart.on("error", (error) => {
    console.error("❌ Error starting application:", error);
  });

  npmStart.on("exit", (code) => {
    if (code !== 0) {
      console.error(`❌ Application exited with code ${code}`);
    }
  });
}, 2000);
