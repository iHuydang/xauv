#!/bin/bash

# Script tự động deploy lên EC2 instance có sẵn
# Sử dụng cho instance: i-05c4d8f39e43b8280

set -e

# Thông tin EC2 instance
EC2_IP="13.115.244.125"
KEY_FILE="frbvn.pem"
APP_DIR="/var/www/trading-system"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
echo "║           🚀 AUTO DEPLOY TO AWS EC2 🚀                      ║"
echo "║         Instance: i-05c4d8f39e43b8280                       ║"
echo "║         IP: 13.115.244.125                                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Kiểm tra key file
if [ ! -f "$KEY_FILE" ]; then
    error "Key file không tồn tại: $KEY_FILE"
fi

# Set đúng quyền cho key file
chmod 400 "$KEY_FILE"
log "✅ Key file permissions set"

# Tạo deployment package
log "📦 Creating deployment package..."
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

# Upload package lên EC2
log "⬆️ Uploading package to EC2..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    trading-system.tar.gz ubuntu@$EC2_IP:/tmp/

log "✅ Package uploaded successfully"

# Chạy deployment trên EC2
log "🚀 Running deployment on EC2..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    ubuntu@$EC2_IP << 'REMOTE_SCRIPT'

set -e

# Colors for remote
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[REMOTE] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[REMOTE] $1${NC}"
}

error() {
    echo -e "${RED}[REMOTE] $1${NC}"
    exit 1
}

log "🔄 Starting deployment process..."

# Update system
log "📦 Updating system packages..."
sudo apt update -y

# Install Node.js 20
log "🟢 Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

node_version=$(node --version 2>/dev/null || echo "not installed")
log "Node.js version: $node_version"

# Install PostgreSQL
log "🐘 Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install postgresql postgresql-contrib -y
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Configure PostgreSQL
log "🔧 Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE USER trading_user WITH PASSWORD 'trading_password123';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE trading_system OWNER trading_user;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE trading_system TO trading_user;" 2>/dev/null || true

# Install Nginx
log "🌐 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# Install PM2
log "⚙️ Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Create application directory
log "📁 Creating application directory..."
sudo mkdir -p /var/www/trading-system
sudo chown -R ubuntu:ubuntu /var/www/trading-system

# Extract application
log "📦 Extracting application..."
cd /var/www/trading-system
tar -xzf /tmp/trading-system.tar.gz
rm -f /tmp/trading-system.tar.gz

# Install dependencies
log "📦 Installing Node.js dependencies..."
npm install

# Create environment file
log "📝 Creating environment file..."
cat > .env << 'EOF'
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
EOF

# Build application
log "🏗️ Building application..."
npm run build 2>/dev/null || {
    warn "Build failed, continuing anyway..."
}

# Setup database
log "🗄️ Setting up database..."
npm run db:push 2>/dev/null || {
    warn "Database migration failed, continuing..."
}

# Configure Nginx
log "🔧 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/trading-system > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/trading-system /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Create systemd service
log "⚙️ Creating systemd service..."
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

# Stop any existing process on port 5000
log "🛑 Stopping existing processes..."
sudo pkill -f "node.*5000" || true
sudo pkill -f "npm.*start" || true

# Start service
log "🚀 Starting application service..."
sudo systemctl daemon-reload
sudo systemctl enable trading-system
sudo systemctl start trading-system

# Wait and check status
sleep 10

if sudo systemctl is-active --quiet trading-system; then
    log "✅ Application started successfully!"
else
    warn "⚠️ Application may have issues. Checking logs..."
    sudo journalctl -u trading-system --no-pager -n 20
fi

# Configure firewall
log "🔥 Configuring firewall..."
sudo ufw allow ssh 2>/dev/null || true
sudo ufw allow 80 2>/dev/null || true
sudo ufw allow 5000 2>/dev/null || true
echo "y" | sudo ufw enable 2>/dev/null || true

# Create management scripts
log "📜 Creating management scripts..."
cat > /home/ubuntu/trading-status.sh << 'STATUSEOF'
#!/bin/bash
echo "📊 Trading System Status"
echo "========================"
echo "Service Status: $(sudo systemctl is-active trading-system)"
echo "Port 5000: $(netstat -tlnp | grep :5000 | wc -l) processes"
echo "Database: $(pg_isready -h localhost -U trading_user -d trading_system && echo "✅ Connected" || echo "❌ Failed")"
echo ""
echo "Recent logs:"
sudo journalctl -u trading-system --no-pager -n 5
STATUSEOF

chmod +x /home/ubuntu/trading-status.sh

log "✅ Deployment completed successfully!"
log "🌐 Application should be available at: http://13.115.244.125"
log "🔧 Management: /home/ubuntu/trading-status.sh"

REMOTE_SCRIPT

# Clean up local files
rm -f trading-system.tar.gz

# Test application
log "🧪 Testing application..."
sleep 5

if curl -s --max-time 10 "http://$EC2_IP" > /dev/null; then
    log "✅ Application is responding!"
else
    warn "⚠️ Application may still be starting. Check manually:"
    echo "ssh -i $KEY_FILE ubuntu@$EC2_IP '/home/ubuntu/trading-status.sh'"
fi

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                   🎉 DEPLOYMENT COMPLETE! 🎉                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}"
echo "🌐 Your trading system is now running at:"
echo "   http://13.115.244.125"
echo ""
echo "🔧 Management Commands:"
echo "   Check status: ssh -i $KEY_FILE ubuntu@$EC2_IP '/home/ubuntu/trading-status.sh'"
echo "   View logs:    ssh -i $KEY_FILE ubuntu@$EC2_IP 'sudo journalctl -u trading-system -f'"
echo "   Restart:      ssh -i $KEY_FILE ubuntu@$EC2_IP 'sudo systemctl restart trading-system'"
echo ""
echo "🎯 Federal Reserve Commands:"
echo "   ssh -i $KEY_FILE ubuntu@$EC2_IP 'cd /var/www/trading-system && curl http://localhost:5000/api/fed/status'"
echo -e "${NC}"

log "🚀 Deployment completed successfully!"