# Hướng dẫn Deploy Trading System lên EC2

## Thông tin EC2 Instance
- **Instance ID**: i-05c4d8f39e43b8280
- **Public IP**: 13.115.244.125
- **Instance Type**: z1d.3xlarge (12 vCPUs - rất mạnh!)
- **OS**: Amazon Linux 2023
- **Key Pair**: frbvn

## Cách 1: Connect qua AWS Console (Đơn giản nhất)

1. **Vào AWS Console**: https://ap-northeast-1.console.aws.amazon.com/ec2/home
2. **Tìm instance**: i-05c4d8f39e43b8280
3. **Click Connect** → **Session Manager** → **Connect**

## Cách 2: SSH trực tiếp (nếu có key)

```bash
ssh -i frbvn.pem ec2-user@13.115.244.125
```

**Lưu ý**: Instance này dùng Amazon Linux 2023, user là `ec2-user` (không phải `ubuntu`)

## Commands để chạy sau khi connect:

```bash
# 1. Update system
sudo dnf update -y

# 2. Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# 3. Install PostgreSQL 15
sudo dnf install -y postgresql15 postgresql15-server
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 4. Configure PostgreSQL
sudo -u postgres psql << 'EOF'
CREATE USER trading_user WITH PASSWORD 'trading_password123';
CREATE DATABASE trading_system OWNER trading_user;
GRANT ALL PRIVILEGES ON DATABASE trading_system TO trading_user;
ALTER USER trading_user CREATEDB;
\q
EOF

# 5. Install Nginx
sudo dnf install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 6. Install Git (để clone code)
sudo dnf install -y git

# 7. Create app directory
sudo mkdir -p /var/www/trading-system
sudo chown -R ec2-user:ec2-user /var/www/trading-system

# 8. Create upload receiver script
cd /var/www/trading-system
cat > upload-receiver.js << 'EOF'
const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-filename');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/upload') {
    const fileName = 'trading-system.tar.gz';
    const writeStream = fs.createWriteStream(fileName);
    
    req.pipe(writeStream);
    
    req.on('end', () => {
      console.log('File upload completed');
      
      // Auto extract
      exec('tar -xzf trading-system.tar.gz && rm trading-system.tar.gz', (error) => {
        if (error) {
          console.error('Extract error:', error);
          res.writeHead(500);
          res.end('Extract failed');
        } else {
          console.log('Files extracted successfully');
          res.writeHead(200);
          res.end('Upload and extract successful!');
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('Upload error:', err);
      res.writeHead(500);
      res.end('Upload failed');
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body>
          <h2>Trading System Upload Server</h2>
          <p>Server ready to receive files on port 8080</p>
          <p>Instance: i-05c4d8f39e43b8280</p>
          <p>Time: ${new Date().toISOString()}</p>
        </body>
      </html>
    `);
  }
});

server.listen(8080, '0.0.0.0', () => {
  console.log('Upload server running on http://13.115.244.125:8080');
  console.log('Ready to receive files...');
});
EOF

# 9. Start upload server
node upload-receiver.js &
echo "Upload server started on port 8080"

# 10. Configure firewall
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

echo "✅ Server ready for deployment!"
echo "📤 Upload your code with:"
echo "curl -X POST --data-binary @trading-system.tar.gz http://13.115.244.125:8080/upload"
```

## Sau khi upload code thành công:

```bash
# Stop upload server
pkill -f upload-receiver.js

# Continue with deployment
cd /var/www/trading-system

# Install dependencies
npm install

# Create .env file
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
npm run build

# Database setup
npm run db:push

# Configure Nginx
sudo tee /etc/nginx/conf.d/trading-system.conf > /dev/null << 'EOF'
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
    }
}
EOF

# Test Nginx config and reload
sudo nginx -t
sudo systemctl reload nginx

# Create systemd service
sudo tee /etc/systemd/system/trading-system.service > /dev/null << 'EOF'
[Unit]
Description=Trading System Node.js Application
After=network.target postgresql.service

[Service]
Type=simple
User=ec2-user
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
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable trading-system
sudo systemctl start trading-system

# Check status
sudo systemctl status trading-system

echo "🎉 Deployment completed!"
echo "🌐 Trading System: http://13.115.244.125"
echo "🎯 Federal Reserve API: http://13.115.244.125/api/fed/status"
```

## Để upload code từ Replit:

```bash
# Trong shell của Replit, tạo package:
tar -czf trading-system.tar.gz --exclude=node_modules --exclude=.git --exclude=.replit .

# Upload lên EC2:
curl -X POST --data-binary @trading-system.tar.gz http://13.115.244.125:8080/upload
```

Instance z1d.3xlarge có 12 vCPUs rất mạnh, trading system sẽ chạy rất mượt!