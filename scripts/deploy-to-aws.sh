#!/bin/bash

# Deploy Trading System to AWS EC2
# Usage: ./deploy-to-aws.sh <EC2_IP> <KEY_FILE>

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parameters
EC2_IP="$1"
KEY_FILE="$2"
APP_DIR="/var/www/trading-system"
LOCAL_DIR="$(pwd)"

# Functions
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🚀 DEPLOY TO AWS EC2 🚀                           ║"
echo "║              Trading System Deployment                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Validate parameters
if [ -z "$EC2_IP" ] || [ -z "$KEY_FILE" ]; then
    error "Usage: $0 <EC2_IP> <KEY_FILE>"
fi

if [ ! -f "$KEY_FILE" ]; then
    error "Key file not found: $KEY_FILE"
fi

# Set correct permissions for key file
chmod 400 "$KEY_FILE"

log "🎯 Deploying to: $EC2_IP"
log "🔑 Using key: $KEY_FILE"

# Test SSH connection
log "🔍 Testing SSH connection..."
if ! ssh -i "$KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@$EC2_IP "echo 'SSH connection successful'" > /dev/null 2>&1; then
    error "Cannot connect to EC2 instance. Check IP and key file."
fi

# Create deployment package
log "📦 Creating deployment package..."
rm -f trading-system.tar.gz

tar -czf trading-system.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=.replit \
    --exclude=replit.nix \
    --exclude="*.log" \
    --exclude="dist" \
    --exclude=".env" \
    --exclude="trading-system.tar.gz" \
    .

log "✅ Package created: $(du -h trading-system.tar.gz | cut -f1)"

# Upload package to EC2
log "⬆️ Uploading package to EC2..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no trading-system.tar.gz ubuntu@$EC2_IP:/tmp/

# Deploy on EC2
log "🚀 Deploying on EC2..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ubuntu@$EC2_IP << 'EOF'
set -e

# Colors for remote execution
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[REMOTE] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[REMOTE] $1${NC}"
}

APP_DIR="/var/www/trading-system"

log "📁 Preparing application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

log "📦 Extracting package..."
cd $APP_DIR
tar -xzf /tmp/trading-system.tar.gz
rm -f /tmp/trading-system.tar.gz

log "📝 Setting up environment..."
if [ ! -f .env ]; then
    if [ -f .env.template ]; then
        cp .env.template .env
        warn "Created .env from template. Please update API keys!"
    else
        cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://trading_user:trading_password123@localhost:5432/trading_system
NODE_ENV=production
PORT=5000
GOLDAPI_KEY=your_goldapi_key_here
TRADERMADE_API_KEY=your_tradermade_key_here
POLYGON_API_KEY=your_polygon_key_here
FINNHUB_API_KEY=your_finnhub_key_here
EXNESS_ACCOUNT_1=405691964
EXNESS_ACCOUNT_2=205251387
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
ENVEOF
        warn "Created default .env file. Please update with real values!"
    fi
fi

log "📦 Installing dependencies..."
npm install

log "🏗️ Building application..."
npm run build 2>/dev/null || {
    warn "Build failed, continuing anyway..."
}

log "🗄️ Setting up database..."
# Create database if not exists
sudo -u postgres psql -c "CREATE DATABASE trading_system;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER trading_user WITH PASSWORD 'trading_password123';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE trading_system TO trading_user;" 2>/dev/null || true

# Run database migrations
npm run db:push 2>/dev/null || {
    warn "Database migrations failed, continuing..."
}

log "⚙️ Starting application with systemd..."
# Stop existing service
sudo systemctl stop trading-system 2>/dev/null || true

# Create/update systemd service
sudo tee /etc/systemd/system/trading-system.service > /dev/null << 'SERVICEEOF'
[Unit]
Description=Trading System Node.js App
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/trading-system
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Reload and start service
sudo systemctl daemon-reload
sudo systemctl enable trading-system
sudo systemctl start trading-system

# Wait a moment and check status
sleep 5

if sudo systemctl is-active --quiet trading-system; then
    log "✅ Application started successfully!"
else
    warn "⚠️ Application may have issues. Check logs:"
    sudo journalctl -u trading-system --no-pager -n 10
fi

log "🌐 Application should be available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR_EC2_IP')"

EOF

# Clean up local package
rm -f trading-system.tar.gz

# Test deployment
log "🧪 Testing deployment..."
sleep 10

if curl -s --max-time 10 "http://$EC2_IP" > /dev/null; then
    log "✅ Deployment successful! Application is responding."
    echo -e "${GREEN}🌐 Your trading system is now running at: http://$EC2_IP${NC}"
else
    warn "⚠️ Application may still be starting up. Check status with:"
    echo "ssh -i $KEY_FILE ubuntu@$EC2_IP 'sudo systemctl status trading-system'"
fi

# Show quick commands
echo -e "${YELLOW}"
echo "📋 Quick Commands:"
echo "SSH to server:     ssh -i $KEY_FILE ubuntu@$EC2_IP"
echo "Check logs:        ssh -i $KEY_FILE ubuntu@$EC2_IP 'sudo journalctl -u trading-system -f'"
echo "Restart app:       ssh -i $KEY_FILE ubuntu@$EC2_IP 'sudo systemctl restart trading-system'"
echo "Check status:      ssh -i $KEY_FILE ubuntu@$EC2_IP 'sudo systemctl status trading-system'"
echo -e "${NC}"

log "🎉 Deployment completed!"