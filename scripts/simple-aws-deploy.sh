#!/bin/bash

# Deploy đơn giản không cần key file
# Sử dụng AWS CLI và S3 để transfer files

set -e

INSTANCE_ID="i-05c4d8f39e43b8280"
REGION="ap-northeast-1"
BUCKET_NAME="trading-temp-$(date +%s)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

echo "🚀 Deploy Trading System to AWS EC2"
echo "Instance: $INSTANCE_ID"
echo "Region: $REGION"
echo ""

# Kiểm tra AWS CLI
if ! command -v aws &> /dev/null; then
    error "AWS CLI not found. Install with: curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip' && unzip awscliv2.zip && sudo ./aws/install"
fi

# Kiểm tra credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    error "AWS credentials not configured. Run: aws configure"
fi

log "Creating deployment package..."
tar -czf trading-system.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=.replit \
    --exclude="*.log" \
    --exclude="dist" \
    .

log "Creating temporary S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $REGION

log "Uploading package to S3..."
aws s3 cp trading-system.tar.gz s3://$BUCKET_NAME/

# Tạo deployment script
cat > deploy-commands.sh << 'EOF'
#!/bin/bash
set -e

BUCKET=BUCKET_PLACEHOLDER
REGION=REGION_PLACEHOLDER

echo "=== Trading System Deployment Started ==="

# Update system
sudo apt update -y

# Install Node.js 20
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    sudo apt install postgresql postgresql-contrib -y
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Configure PostgreSQL
sudo -u postgres psql -c "CREATE USER trading_user WITH PASSWORD 'trading_password123';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE trading_system OWNER trading_user;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE trading_system TO trading_user;" 2>/dev/null || true

# Install Nginx
if ! command -v nginx &> /dev/null; then
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# Install AWS CLI if needed
if ! command -v aws &> /dev/null; then
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
fi

# Create app directory
sudo mkdir -p /var/www/trading-system
sudo chown -R ubuntu:ubuntu /var/www/trading-system

# Download and extract app
cd /var/www/trading-system
aws s3 cp s3://$BUCKET/trading-system.tar.gz . --region $REGION
tar -xzf trading-system.tar.gz
rm trading-system.tar.gz

# Install dependencies
npm install

# Create .env
cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://trading_user:trading_password123@localhost:5432/trading_system
NODE_ENV=production
PORT=5000
GOLDAPI_KEY=your_goldapi_key_here
TRADERMADE_API_KEY=your_tradermade_key_here
ENVEOF

# Build app
npm run build 2>/dev/null || echo "Build failed, continuing..."

# Database setup
npm run db:push 2>/dev/null || echo "DB migration failed, continuing..."

# Configure Nginx
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
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/trading-system /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Create systemd service
sudo tee /etc/systemd/system/trading-system.service > /dev/null << 'SERVICEEOF'
[Unit]
Description=Trading System
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/trading-system
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Stop existing processes
sudo pkill -f "node.*5000" || true

# Start service
sudo systemctl daemon-reload
sudo systemctl enable trading-system
sudo systemctl start trading-system

# Check status
sleep 5
if sudo systemctl is-active --quiet trading-system; then
    echo "✅ Trading System started successfully!"
    echo "🌐 Access at: http://13.115.244.125"
else
    echo "❌ Service failed to start"
    sudo journalctl -u trading-system --no-pager -n 10
fi

echo "=== Deployment Complete ==="
EOF

# Replace placeholders
sed -i "s/BUCKET_PLACEHOLDER/$BUCKET_NAME/g" deploy-commands.sh
sed -i "s/REGION_PLACEHOLDER/$REGION/g" deploy-commands.sh

log "Uploading deployment script..."
aws s3 cp deploy-commands.sh s3://$BUCKET_NAME/

log "Running deployment via SSM..."
COMMAND_ID=$(aws ssm send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --comment "Trading System Deployment" \
    --parameters "commands=[\"curl -s https://s3.$REGION.amazonaws.com/$BUCKET_NAME/deploy-commands.sh | bash\"]" \
    --region $REGION \
    --query 'Command.CommandId' \
    --output text)

log "Command ID: $COMMAND_ID"
log "Waiting for deployment..."

# Wait for completion
for i in {1..30}; do
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
    else
        echo -n "."
        sleep 10
    fi
done

# Show output
log "Deployment output:"
aws ssm get-command-invocation \
    --command-id $COMMAND_ID \
    --instance-id $INSTANCE_ID \
    --region $REGION \
    --query 'StandardOutputContent' \
    --output text

# Cleanup
log "Cleaning up..."
aws s3 rm s3://$BUCKET_NAME --recursive
aws s3 rb s3://$BUCKET_NAME
rm -f trading-system.tar.gz deploy-commands.sh

echo ""
echo "🎉 Deployment Complete!"
echo "🌐 Trading System: http://13.115.244.125"
echo "🎯 Federal Reserve API: http://13.115.244.125/api/fed/status"