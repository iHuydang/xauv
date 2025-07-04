#!/bin/bash

# Deploy qua AWS Session Manager (không cần key file)
# Instance: i-05c4d8f39e43b8280

set -e

INSTANCE_ID="i-05c4d8f39e43b8280"
REGION="ap-northeast-1"

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
echo "║         🚀 DEPLOY VIA SESSION MANAGER 🚀                    ║"
echo "║         Instance: i-05c4d8f39e43b8280                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Kiểm tra AWS CLI
if ! command -v aws &> /dev/null; then
    error "AWS CLI chưa được cài đặt"
fi

# Kiểm tra AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    error "AWS credentials chưa được cấu hình. Chạy: aws configure"
fi

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

# Upload package lên S3 bucket tạm thời
BUCKET_NAME="trading-system-temp-$(date +%s)"
log "☁️ Creating temporary S3 bucket: $BUCKET_NAME"

aws s3 mb s3://$BUCKET_NAME --region $REGION

log "⬆️ Uploading package to S3..."
aws s3 cp trading-system.tar.gz s3://$BUCKET_NAME/

# Tạo script setup cho EC2
cat > setup-script.sh << 'SETUP_SCRIPT'
#!/bin/bash

set -e

# Colors
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

log "🔄 Starting setup process..."

# Update system
log "📦 Updating system..."
sudo apt update -y

# Install Node.js 20
log "🟢 Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

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

# Install AWS CLI if not present
if ! command -v aws &> /dev/null; then
    log "☁️ Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
fi

# Create application directory
log "📁 Creating application directory..."
sudo mkdir -p /var/www/trading-system
sudo chown -R ubuntu:ubuntu /var/www/trading-system

log "✅ Basic setup completed!"
SETUP_SCRIPT

# Upload script setup lên S3
aws s3 cp setup-script.sh s3://$BUCKET_NAME/

log "🚀 Running setup via Session Manager..."

# Chạy basic setup trước
aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --comment "Trading System Basic Setup" \
    --parameters 'commands=["curl -s https://s3.'$REGION'.amazonaws.com/'$BUCKET_NAME'/setup-script.sh | bash"]' \
    --region $REGION

log "⏳ Waiting for basic setup to complete..."
sleep 60

# Tạo script deploy chính
cat > deploy-script.sh << 'DEPLOY_SCRIPT'
#!/bin/bash

set -e

BUCKET_NAME="BUCKET_NAME_PLACEHOLDER"
REGION="REGION_PLACEHOLDER"

log() {
    echo -e "\033[0;32m[REMOTE] $1\033[0m"
}

warn() {
    echo -e "\033[1;33m[REMOTE] $1\033[0m"
}

log "📦 Downloading application package..."
cd /var/www/trading-system
aws s3 cp s3://$BUCKET_NAME/trading-system.tar.gz . --region $REGION

log "📦 Extracting application..."
tar -xzf trading-system.tar.gz
rm -f trading-system.tar.gz

log "📦 Installing dependencies..."
npm install

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

log "🏗️ Building application..."
npm run build 2>/dev/null || warn "Build failed, continuing..."

log "🗄️ Setting up database..."
npm run db:push 2>/dev/null || warn "Database migration failed, continuing..."

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
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/trading-system /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

log "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/trading-system.service > /dev/null << 'SERVICEEOF'
[Unit]
Description=Trading System
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/trading-system
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICEEOF

log "🛑 Stopping existing processes..."
sudo pkill -f "node.*5000" || true
sudo pkill -f "npm.*start" || true

log "🚀 Starting service..."
sudo systemctl daemon-reload
sudo systemctl enable trading-system
sudo systemctl start trading-system

sleep 10

if sudo systemctl is-active --quiet trading-system; then
    log "✅ Application started successfully!"
    log "🌐 Access at: http://13.115.244.125"
else
    warn "⚠️ Service may have issues"
    sudo journalctl -u trading-system --no-pager -n 10
fi

log "✅ Deployment completed!"
DEPLOY_SCRIPT

# Thay thế placeholders
sed -i "s/BUCKET_NAME_PLACEHOLDER/$BUCKET_NAME/g" deploy-script.sh
sed -i "s/REGION_PLACEHOLDER/$REGION/g" deploy-script.sh

# Upload deploy script
aws s3 cp deploy-script.sh s3://$BUCKET_NAME/

log "🚀 Running main deployment..."

# Chạy deployment chính
COMMAND_ID=$(aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --comment "Trading System Main Deployment" \
    --parameters 'commands=["curl -s https://s3.'$REGION'.amazonaws.com/'$BUCKET_NAME'/deploy-script.sh | bash"]' \
    --region $REGION \
    --query 'Command.CommandId' \
    --output text)

log "📋 Command ID: $COMMAND_ID"
log "⏳ Waiting for deployment to complete..."

# Chờ command hoàn thành
while true; do
    STATUS=$(aws ssm get-command-invocation \
        --command-id $COMMAND_ID \
        --instance-id $INSTANCE_ID \
        --region $REGION \
        --query 'Status' \
        --output text 2>/dev/null || echo "InProgress")
    
    if [ "$STATUS" = "Success" ]; then
        log "✅ Deployment completed successfully!"
        break
    elif [ "$STATUS" = "Failed" ]; then
        error "❌ Deployment failed!"
        break
    else
        echo -n "."
        sleep 10
    fi
done

# Hiển thị output
log "📄 Deployment output:"
aws ssm get-command-invocation \
    --command-id $COMMAND_ID \
    --instance-id $INSTANCE_ID \
    --region $REGION \
    --query 'StandardOutputContent' \
    --output text

# Clean up S3 bucket
log "🧹 Cleaning up S3 bucket..."
aws s3 rm s3://$BUCKET_NAME --recursive
aws s3 rb s3://$BUCKET_NAME

# Clean up local files
rm -f trading-system.tar.gz setup-script.sh deploy-script.sh

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                 🎉 DEPLOYMENT COMPLETE! 🎉                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}"
echo "🌐 Trading System URL: http://13.115.244.125"
echo "🎯 Federal Reserve API: http://13.115.244.125/api/fed/status"
echo ""
echo "🔧 Management via Session Manager:"
echo "aws ssm start-session --target $INSTANCE_ID --region $REGION"
echo -e "${NC}"

log "🚀 Deployment completed successfully!"