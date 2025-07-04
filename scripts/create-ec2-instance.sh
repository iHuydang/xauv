#!/bin/bash

# Tạo EC2 Instance tự động cho Trading System
# Usage: ./create-ec2-instance.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
INSTANCE_NAME="trading-system-$(date +%Y%m%d-%H%M%S)"
INSTANCE_TYPE="t3.medium"
AMI_ID="ami-0c7217cdde317cfec"  # Ubuntu 22.04 LTS trong us-east-1
KEY_NAME="trading-system-key"
SECURITY_GROUP_NAME="trading-system-sg"
REGION="us-east-1"

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
echo "║           🏗️ TẠO EC2 INSTANCE TỰ ĐỘNG 🏗️                   ║"
echo "║              AWS Trading System Setup                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    error "AWS CLI chưa được cài đặt. Vui lòng cài đặt AWS CLI trước."
fi

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    error "AWS credentials chưa được cấu hình. Chạy: aws configure"
fi

log "🔑 AWS Account: $(aws sts get-caller-identity --query Account --output text)"
log "🌍 Region: $REGION"

# Create Key Pair if not exists
log "🔐 Tạo Key Pair..."
if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region "$REGION" > /dev/null 2>&1; then
    aws ec2 create-key-pair \
        --key-name "$KEY_NAME" \
        --query 'KeyMaterial' \
        --output text \
        --region "$REGION" > "${KEY_NAME}.pem"
    
    chmod 400 "${KEY_NAME}.pem"
    log "✅ Key Pair đã tạo: ${KEY_NAME}.pem"
else
    warn "Key Pair đã tồn tại: $KEY_NAME"
fi

# Create Security Group if not exists
log "🛡️ Tạo Security Group..."
if ! aws ec2 describe-security-groups --group-names "$SECURITY_GROUP_NAME" --region "$REGION" > /dev/null 2>&1; then
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name "$SECURITY_GROUP_NAME" \
        --description "Security group for Trading System" \
        --query 'GroupId' \
        --output text \
        --region "$REGION")
    
    # Add rules
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp \
        --port 22 \
        --cidr 0.0.0.0/0 \
        --region "$REGION"
    
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0 \
        --region "$REGION"
    
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0 \
        --region "$REGION"
    
    aws ec2 authorize-security-group-ingress \
        --group-id "$SECURITY_GROUP_ID" \
        --protocol tcp \
        --port 5000 \
        --cidr 0.0.0.0/0 \
        --region "$REGION"
    
    log "✅ Security Group đã tạo: $SECURITY_GROUP_ID"
else
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
        --group-names "$SECURITY_GROUP_NAME" \
        --query 'SecurityGroups[0].GroupId' \
        --output text \
        --region "$REGION")
    warn "Security Group đã tồn tại: $SECURITY_GROUP_ID"
fi

# Create User Data script
log "📝 Tạo User Data script..."
cat > user-data.sh << 'EOF'
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "=== Trading System Auto Setup Started ==="

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PostgreSQL
apt install postgresql postgresql-contrib -y
systemctl start postgresql
systemctl enable postgresql

# Configure PostgreSQL
sudo -u postgres psql << PSQLEOF
CREATE USER trading_user WITH PASSWORD 'trading_password123';
CREATE DATABASE trading_system OWNER trading_user;
GRANT ALL PRIVILEGES ON DATABASE trading_system TO trading_user;
\q
PSQLEOF

# Install PM2
npm install -g pm2

# Install Nginx
apt install nginx -y
systemctl start nginx
systemctl enable nginx

# Install additional tools
apt install -y git curl wget unzip htop

# Configure firewall
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 5000
echo "y" | ufw enable

# Create application directory
mkdir -p /var/www/trading-system
chown -R ubuntu:ubuntu /var/www/trading-system

# Configure Nginx
cat > /etc/nginx/sites-available/trading-system << 'NGINXEOF'
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
}
NGINXEOF

ln -sf /etc/nginx/sites-available/trading-system /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "=== Trading System Auto Setup Completed ==="
EOF

# Launch Instance
log "🚀 Khởi tạo EC2 Instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --count 1 \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SECURITY_GROUP_ID" \
    --user-data file://user-data.sh \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --query 'Instances[0].InstanceId' \
    --output text \
    --region "$REGION")

log "✅ Instance đã tạo: $INSTANCE_ID"

# Wait for instance to be running
log "⏳ Đợi instance khởi động..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"

# Get instance details
INSTANCE_INFO=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0]' \
    --region "$REGION")

PUBLIC_IP=$(echo "$INSTANCE_INFO" | jq -r '.PublicIpAddress')
PRIVATE_IP=$(echo "$INSTANCE_INFO" | jq -r '.PrivateIpAddress')

# Clean up temporary files
rm -f user-data.sh

# Success message
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  🎉 HOÀN THÀNH! 🎉                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}"
echo "📋 Thông tin EC2 Instance:"
echo "Instance ID: $INSTANCE_ID"
echo "Instance Name: $INSTANCE_NAME"
echo "Instance Type: $INSTANCE_TYPE"
echo "Public IP: $PUBLIC_IP"
echo "Private IP: $PRIVATE_IP"
echo "Key File: ${KEY_NAME}.pem"
echo "Security Group: $SECURITY_GROUP_NAME ($SECURITY_GROUP_ID)"
echo ""
echo "🔧 Các bước tiếp theo:"
echo "1. Đợi 3-5 phút cho instance setup hoàn tất"
echo "2. Test SSH connection:"
echo "   ssh -i ${KEY_NAME}.pem ubuntu@$PUBLIC_IP"
echo ""
echo "3. Deploy trading system:"
echo "   ./scripts/deploy-to-aws.sh $PUBLIC_IP ${KEY_NAME}.pem"
echo ""
echo "4. Kiểm tra ứng dụng:"
echo "   http://$PUBLIC_IP"
echo ""
echo "💰 Chi phí ước tính: ~\$30/tháng"
echo -e "${NC}"

# Save instance info
cat > instance-info.txt << EOF
Instance ID: $INSTANCE_ID
Instance Name: $INSTANCE_NAME
Public IP: $PUBLIC_IP
Private IP: $PRIVATE_IP
Key File: ${KEY_NAME}.pem
Security Group: $SECURITY_GROUP_NAME
Created: $(date)

SSH Command:
ssh -i ${KEY_NAME}.pem ubuntu@$PUBLIC_IP

Deploy Command:
./scripts/deploy-to-aws.sh $PUBLIC_IP ${KEY_NAME}.pem

Web URL:
http://$PUBLIC_IP
EOF

log "📝 Thông tin đã lưu vào: instance-info.txt"
log "🎯 Instance sẽ sẵn sàng trong 3-5 phút!"