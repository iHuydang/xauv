#!/bin/bash

# Manual deployment steps for EC2 instance
# Instance: i-05c4d8f39e43b8280 (13.115.244.125)

echo "=== TRADING SYSTEM DEPLOYMENT GUIDE ==="
echo ""
echo "Step 1: Connect to your EC2 instance"
echo "Method 1 - Via AWS Console:"
echo "  1. Go to https://ap-northeast-1.console.aws.amazon.com/ec2/home"
echo "  2. Find instance i-05c4d8f39e43b8280"
echo "  3. Click 'Connect' -> 'Session Manager' -> 'Connect'"
echo ""
echo "Method 2 - Via SSH (if you have the key):"
echo "  ssh -i frbvn.pem ubuntu@13.115.244.125"
echo ""
echo "=============================================="
echo ""
echo "Once connected, run these commands step by step:"
echo ""

cat << 'DEPLOYMENT_COMMANDS'
# 1. Update system
sudo apt update -y

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Verify Node.js installation
node --version
npm --version

# 4. Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 5. Configure PostgreSQL
sudo -u postgres psql << 'EOF'
CREATE USER trading_user WITH PASSWORD 'trading_password123';
CREATE DATABASE trading_system OWNER trading_user;
GRANT ALL PRIVILEGES ON DATABASE trading_system TO trading_user;
\q
EOF

# 6. Test database connection
pg_isready -h localhost -U trading_user -d trading_system

# 7. Install Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# 8. Create application directory
sudo mkdir -p /var/www/trading-system
sudo chown -R ubuntu:ubuntu /var/www/trading-system

# 9. Upload your code (multiple options below)

# Option A: If you have git access
# git clone YOUR_REPOSITORY_URL /var/www/trading-system

# Option B: Create a simple upload method
# We'll create a simple web server to receive files

# 10. Create a temporary file receiver
cd /var/www/trading-system
cat > upload-receiver.js << 'UPLOADEOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/upload') {
    const fileName = req.headers['x-filename'] || 'upload.tar.gz';
    const filePath = path.join(__dirname, fileName);
    const writeStream = fs.createWriteStream(filePath);
    
    req.pipe(writeStream);
    
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('File uploaded successfully');
      console.log(`File uploaded: ${fileName}`);
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
          <h2>Trading System File Upload</h2>
          <p>Server ready to receive files.</p>
          <p>POST to /upload with your tar.gz file</p>
        </body>
      </html>
    `);
  }
});

server.listen(8080, '0.0.0.0', () => {
  console.log('Upload server running on port 8080');
  console.log('Send your file with: curl -X POST -H "x-filename: trading-system.tar.gz" --data-binary @your-file.tar.gz http://13.115.244.125:8080/upload');
});
UPLOADEOF

# 11. Start upload receiver temporarily
node upload-receiver.js &
UPLOAD_PID=$!

echo "Upload server started. From your local machine, run:"
echo "tar -czf trading-system.tar.gz --exclude=node_modules --exclude=.git ."
echo "curl -X POST -H 'x-filename: trading-system.tar.gz' --data-binary @trading-system.tar.gz http://13.115.244.125:8080/upload"
echo ""
echo "Press ENTER when upload is complete..."
read

# 12. Stop upload server
kill $UPLOAD_PID

# 13. Extract the uploaded files
if [ -f trading-system.tar.gz ]; then
    tar -xzf trading-system.tar.gz
    rm trading-system.tar.gz
    echo "Files extracted successfully"
else
    echo "No upload file found. Please manually copy your files to /var/www/trading-system"
    echo "You can use scp, rsync, or manual file creation"
fi

# 14. Install dependencies
npm install

# 15. Create environment file
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

# 16. Build application
npm run build

# 17. Database setup
npm run db:push

# 18. Configure Nginx
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

    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF

# 19. Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/trading-system /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 20. Create systemd service
sudo tee /etc/systemd/system/trading-system.service > /dev/null << 'EOF'
[Unit]
Description=Trading System Node.js Application
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
EOF

# 21. Stop any existing processes on port 5000
sudo pkill -f "node.*5000" || true
sudo pkill -f "npm.*start" || true

# 22. Start and enable the service
sudo systemctl daemon-reload
sudo systemctl enable trading-system
sudo systemctl start trading-system

# 23. Check service status
sudo systemctl status trading-system

# 24. Check if application is responding
sleep 10
curl http://localhost:5000 || echo "Application not responding yet"

# 25. Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw allow 8080
echo "y" | sudo ufw enable

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "Trading System should be available at:"
echo "http://13.115.244.125"
echo ""
echo "To check logs:"
echo "sudo journalctl -u trading-system -f"
echo ""
echo "To restart service:"
echo "sudo systemctl restart trading-system"
echo ""
echo "To check service status:"
echo "sudo systemctl status trading-system"

DEPLOYMENT_COMMANDS

echo ""
echo "=============================================="
echo "COPY THE COMMANDS ABOVE AND RUN THEM ON YOUR EC2 INSTANCE"
echo "=============================================="