#!/bin/bash

# AWS EC2 Auto Setup Script for Trading System
# Chạy script này trên EC2 Ubuntu instance

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
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
echo "║           🚀 AWS TRADING SYSTEM AUTO SETUP 🚀               ║"
echo "║              Cài đặt tự động trên EC2 Ubuntu                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "Script này không nên chạy với quyền root. Sử dụng user ubuntu."
fi

# Update system
log "🔄 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
log "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
log "✅ Node.js installed: $node_version"
log "✅ NPM installed: $npm_version"

# Install PostgreSQL
log "🐘 Installing PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configure PostgreSQL
log "🔧 Configuring PostgreSQL..."
sudo -u postgres psql << EOF
CREATE USER trading_user WITH PASSWORD 'trading_password123';
CREATE DATABASE trading_system OWNER trading_user;
GRANT ALL PRIVILEGES ON DATABASE trading_system TO trading_user;
\q
EOF

# Install PM2
log "⚙️ Installing PM2..."
sudo npm install -g pm2

# Install Nginx
log "🌐 Installing Nginx..."
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Install additional tools
log "🔧 Installing additional tools..."
sudo apt install -y git curl wget unzip htop

# Install AWS CLI
log "☁️ Installing AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip

# Create application directory
log "📁 Creating application directory..."
sudo mkdir -p /var/www/trading-system
sudo chown -R $USER:$USER /var/www/trading-system

# Configure Nginx
log "🔧 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/trading-system > /dev/null << 'EOF'
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

    # WebSocket support
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
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/trading-system /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Configure firewall
log "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5000
echo "y" | sudo ufw enable

# Create systemd service for the app
log "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/trading-system.service > /dev/null << EOF
[Unit]
Description=Trading System Node.js App
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/var/www/trading-system
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
EOF

# Create environment file template
log "📝 Creating environment template..."
tee /var/www/trading-system/.env.template > /dev/null << 'EOF'
# Database
DATABASE_URL=postgresql://trading_user:trading_password123@localhost:5432/trading_system

# Application
NODE_ENV=production
PORT=5000

# API Keys (cần cập nhật)
GOLDAPI_KEY=your_goldapi_key_here
TRADERMADE_API_KEY=your_tradermade_key_here
POLYGON_API_KEY=your_polygon_key_here
FINNHUB_API_KEY=your_finnhub_key_here

# Trading Accounts (cập nhật thông tin thật)
EXNESS_ACCOUNT_1=405691964
EXNESS_ACCOUNT_2=205251387
EXNESS_PASSWORD_1=your_password_here
EXNESS_PASSWORD_2=your_password_here

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
EOF

# Create deployment script
log "📜 Creating deployment script..."
tee /var/www/trading-system/deploy.sh > /dev/null << 'EOF'
#!/bin/bash

set -e

echo "🚀 Deploying Trading System..."

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Run database migrations if needed
npm run db:push || true

# Restart application
sudo systemctl restart trading-system

# Check status
sleep 5
sudo systemctl status trading-system --no-pager

echo "✅ Deployment completed!"
echo "🌐 Application running at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
EOF

chmod +x /var/www/trading-system/deploy.sh

# Create monitoring script
log "📊 Creating monitoring script..."
tee /var/www/trading-system/monitor.sh > /dev/null << 'EOF'
#!/bin/bash

echo "📊 Trading System Status Report"
echo "==============================="

# System resources
echo "💻 System Resources:"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory Usage: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{printf "%s", $5}')"

echo ""

# Application status
echo "🚀 Application Status:"
if systemctl is-active --quiet trading-system; then
    echo "Status: ✅ Running"
else
    echo "Status: ❌ Stopped"
fi

echo "Uptime: $(systemctl show trading-system --property=ActiveEnterTimestamp --value | xargs -I {} date -d {} +'%Y-%m-%d %H:%M:%S' 2>/dev/null || echo 'Unknown')"

echo ""

# Database status
echo "🐘 Database Status:"
if pg_isready -h localhost -U trading_user -d trading_system > /dev/null 2>&1; then
    echo "PostgreSQL: ✅ Connected"
else
    echo "PostgreSQL: ❌ Not accessible"
fi

echo ""

# Port check
echo "🌐 Network Status:"
if netstat -tlnp | grep -q ":5000"; then
    echo "Port 5000: ✅ Listening"
else
    echo "Port 5000: ❌ Not listening"
fi

if netstat -tlnp | grep -q ":80"; then
    echo "Port 80 (Nginx): ✅ Listening"
else
    echo "Port 80 (Nginx): ❌ Not listening"
fi

echo ""

# Recent logs
echo "📝 Recent Application Logs:"
sudo journalctl -u trading-system --no-pager -n 5
EOF

chmod +x /var/www/trading-system/monitor.sh

# Create backup script
log "💾 Creating backup script..."
tee /var/www/trading-system/backup.sh > /dev/null << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "💾 Creating backup..."

# Database backup
pg_dump -h localhost -U trading_user trading_system > $BACKUP_DIR/db_backup_$DATE.sql

# Code backup
tar -czf $BACKUP_DIR/code_backup_$DATE.tar.gz -C /var/www trading-system

# Keep only last 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_DIR"
ls -la $BACKUP_DIR
EOF

chmod +x /var/www/trading-system/backup.sh

# Setup log rotation
log "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/trading-system > /dev/null << 'EOF'
/var/log/trading-system/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 ubuntu ubuntu
    postrotate
        systemctl reload trading-system || true
    endscript
}
EOF

# Create log directory
sudo mkdir -p /var/log/trading-system
sudo chown -R $USER:$USER /var/log/trading-system

# Install CloudWatch agent (optional)
if command -v aws &> /dev/null; then
    log "☁️ Installing CloudWatch agent..."
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
    sudo dpkg -i amazon-cloudwatch-agent.deb || true
    rm -f amazon-cloudwatch-agent.deb
fi

# Create quick commands
log "⚡ Creating quick command aliases..."
tee -a ~/.bashrc > /dev/null << 'EOF'

# Trading System Quick Commands
alias trading-status='sudo systemctl status trading-system'
alias trading-logs='sudo journalctl -u trading-system -f'
alias trading-restart='sudo systemctl restart trading-system'
alias trading-monitor='/var/www/trading-system/monitor.sh'
alias trading-backup='/var/www/trading-system/backup.sh'
alias trading-deploy='/var/www/trading-system/deploy.sh'
EOF

# Final instructions
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🎉 SETUP COMPLETED! 🎉                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}"
echo "📋 Next Steps:"
echo "1. Upload your trading system code to: /var/www/trading-system"
echo "2. Copy .env.template to .env and update API keys"
echo "3. Run: cd /var/www/trading-system && npm install"
echo "4. Run: sudo systemctl start trading-system"
echo "5. Check status: trading-status"
echo ""
echo "🔧 Useful Commands:"
echo "trading-status    - Check application status"
echo "trading-logs      - View real-time logs"
echo "trading-restart   - Restart application"
echo "trading-monitor   - System health check"
echo "trading-backup    - Create backup"
echo ""
echo "🌐 Your application will be available at:"
echo "http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR_EC2_IP')"
echo -e "${NC}"

log "🎯 Setup completed successfully!"
log "💡 Reload bash: source ~/.bashrc"