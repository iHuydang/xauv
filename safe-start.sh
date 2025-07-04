
#!/bin/bash

echo "🔧 Safe Federal Reserve System Startup"
echo "====================================="

# Kill any existing processes
echo "🔄 Clearing existing processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

echo "⏱️ Waiting for ports to clear..."
sleep 3

# Make scripts executable
chmod +x scripts/federal-reserve-commands.sh
chmod +x scripts/*.sh

echo "✅ Starting Federal Reserve System..."
npm run dev

