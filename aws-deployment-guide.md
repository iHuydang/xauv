# Hướng dẫn Deploy Trading System lên AWS

## Tổng quan

Chuyển trading system từ Replit sang AWS sẽ mang lại:
- **Hiệu suất ổn định**: Không bị restart tự động như Replit
- **Tài nguyên đầy đủ**: CPU, RAM, bandwidth không giới hạn
- **Kết nối mạng tốt**: Latency thấp cho trading
- **Bảo mật cao**: VPC, Security Groups, IAM
- **Scale được**: Tăng giảm tài nguyên theo nhu cầu

## Phương pháp 1: AWS EC2 (Đơn giản nhất)

### Bước 1: Tạo EC2 Instance

```bash
# 1. Đăng nhập AWS Console
# 2. Chọn EC2 Service
# 3. Launch Instance với cấu hình:
```

**Cấu hình đề xuất:**
- **AMI**: Ubuntu 22.04 LTS
- **Instance Type**: t3.medium (2 vCPU, 4GB RAM) hoặc t3.large (2 vCPU, 8GB RAM)
- **Storage**: 20GB gp3 SSD
- **Security Group**: Mở ports 22 (SSH), 80, 443, 5000

### Bước 2: Cài đặt môi trường

```bash
# SSH vào server
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Cài đặt Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài đặt PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Cài đặt PM2 (Process Manager)
sudo npm install -g pm2

# Cài đặt Nginx (Reverse Proxy)
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Bước 3: Deploy code

```bash
# Clone code từ Replit hoặc upload
git clone https://github.com/your-repo/trading-system.git
cd trading-system

# Cài đặt dependencies
npm install

# Setup PostgreSQL database
sudo -u postgres createuser --interactive
sudo -u postgres createdb trading_system

# Tạo environment variables
cat > .env << EOF
DATABASE_URL=postgresql://username:password@localhost:5432/trading_system
NODE_ENV=production
PORT=5000
EOF

# Build production
npm run build

# Start với PM2
pm2 start npm --name "trading-app" -- start
pm2 save
pm2 startup
```

### Bước 4: Cấu hình Nginx

```bash
sudo nano /etc/nginx/sites-available/trading-system
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

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
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/trading-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Phương pháp 2: AWS ECS với Docker (Chuyên nghiệp)

### Bước 1: Tạo Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### Bước 2: Setup ECS Cluster

1. **Tạo ECS Cluster**:
   - Fargate serverless
   - VPC với public/private subnets
   - Application Load Balancer

2. **Push Docker image lên ECR**:
```bash
# Build và push
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker build -t trading-system .
docker tag trading-system:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/trading-system:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/trading-system:latest
```

### Bước 3: RDS Database

```bash
# Tạo RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier trading-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password your-password \
  --allocated-storage 20
```

## Phương pháp 3: AWS Lambda + API Gateway (Serverless)

### Serverless Framework Setup

```yaml
# serverless.yml
service: trading-system

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1

functions:
  app:
    handler: lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true

plugins:
  - serverless-http
```

## Chi phí ước tính

### EC2 Method:
- **t3.medium**: ~$30/tháng
- **RDS db.t3.micro**: ~$15/tháng
- **Data transfer**: ~$5/tháng
- **Total**: ~$50/tháng

### ECS Method:
- **Fargate**: ~$40/tháng
- **RDS**: ~$15/tháng
- **ALB**: ~$15/tháng
- **Total**: ~$70/tháng

### Lambda Method:
- **Lambda invocations**: ~$5/tháng
- **API Gateway**: ~$10/tháng
- **RDS**: ~$15/tháng
- **Total**: ~$30/tháng

## Script tự động deploy

```bash
#!/bin/bash
# deploy-to-aws.sh

# Variables
EC2_IP="your-ec2-ip"
KEY_FILE="your-key.pem"
APP_DIR="/home/ubuntu/trading-system"

echo "🚀 Deploying Trading System to AWS..."

# Upload code to EC2
rsync -avz -e "ssh -i $KEY_FILE" \
  --exclude node_modules \
  --exclude .git \
  ./ ubuntu@$EC2_IP:$APP_DIR/

# Execute deployment on server
ssh -i $KEY_FILE ubuntu@$EC2_IP << 'EOF'
cd /home/ubuntu/trading-system

# Install dependencies
npm install

# Build application
npm run build

# Restart PM2 process
pm2 restart trading-app || pm2 start npm --name "trading-app" -- start

# Save PM2 configuration
pm2 save

echo "✅ Deployment completed!"
EOF

echo "🎉 Trading System deployed successfully!"
echo "🌐 Access your app at: http://$EC2_IP:5000"
```

## Monitoring và Logging

### CloudWatch Setup

```bash
# Cài đặt CloudWatch agent
sudo wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Cấu hình logging
sudo nano /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
```

## Bảo mật

### Security Groups
```bash
# HTTP/HTTPS traffic
Port 80, 443: 0.0.0.0/0

# SSH access (restrict to your IP)
Port 22: your-ip/32

# Application port
Port 5000: VPC only
```

### SSL Certificate
```bash
# Install Certbot
sudo snap install --classic certbot

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Backup Strategy

```bash
#!/bin/bash
# backup-system.sh

# Database backup
pg_dump -h your-rds-endpoint -U admin trading_system > backup_$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/

# Code backup
tar -czf code_backup_$(date +%Y%m%d).tar.gz /home/ubuntu/trading-system
aws s3 cp code_backup_$(date +%Y%m%d).tar.gz s3://your-backup-bucket/
```

## Khuyến nghị

1. **Bắt đầu với EC2**: Đơn giản, dễ debug
2. **Sau đó chuyển ECS**: Khi cần scale
3. **Monitoring**: Sử dụng CloudWatch + Grafana
4. **Backup**: Tự động backup database và code
5. **Security**: Luôn cập nhật và patch system

## Commands để bắt đầu ngay

```bash
# 1. Tạo EC2 instance trên AWS Console
# 2. Chạy script setup:

curl -sSL https://raw.githubusercontent.com/your-repo/trading-system/main/scripts/aws-setup.sh | bash

# 3. Deploy application:
./deploy-to-aws.sh
```

Bạn muốn bắt đầu với phương pháp nào? Tôi có thể tạo script tự động cho bạn.