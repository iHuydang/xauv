# 🌐 AWS CloudShell - Nơi chạy lệnh shell

## 📍 Chỗ tìm CloudShell trên AWS Console

### Option 1: Truy cập trực tiếp qua link
```
https://ap-northeast-1.console.aws.amazon.com/cloudshell/home?region=ap-northeast-1
```

### Option 2: Qua AWS Console
1. **Đăng nhập AWS Console:**
   ```
   https://ap-northeast-1.console.aws.amazon.com
   ```

2. **Tìm CloudShell icon:**
   - Nhìn vào thanh navigation bar phía trên
   - Tìm icon hình terminal `>_` (thường ở bên phải)
   - Hoặc tìm text "CloudShell"

3. **Nếu không thấy CloudShell:**
   - Click "Services" ở góc trái
   - Gõ "CloudShell" vào ô search
   - Click vào "AWS CloudShell"

## 🔍 CloudShell ở đâu trên interface

```
AWS Console Layout:
┌─────────────────────────────────────────────────────────────┐
│ [AWS] [Services ▼] [Resource Groups ▼] [🔔] [Support ▼] [>_] │ ← CloudShell icon here
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           Main Console Content                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Alternative: EC2 Instance Connect

Nếu CloudShell không có, bạn có thể:

1. **Launch EC2 Instance:**
   - Chọn "Services" → "EC2"
   - Click "Launch Instance"
   - Chọn "Amazon Linux 2" (free tier)
   - Instance type: t2.micro
   - Launch với default settings

2. **Connect via browser:**
   - Chọn instance vừa tạo
   - Click "Connect"
   - Chọn "EC2 Instance Connect"
   - Click "Connect" → Terminal sẽ mở trong browser

## 📋 Lệnh cần chạy trong terminal

Khi đã có terminal (CloudShell hoặc EC2), copy paste từng lệnh:

```bash
# Bước 1: Tải installer
wget -O aws-replication-installer-init https://aws-application-migration-service-ap-northeast-1.s3.ap-northeast-1.amazonaws.com/latest/linux/aws-replication-installer-init

# Bước 2: Cấp quyền
chmod +x aws-replication-installer-init

# Bước 3: Chạy installer
sudo ./aws-replication-installer-init --region ap-northeast-1 --aws-access-key-id ieagleviet@gmail.com --aws-secret-access-key '$Xcz$ApH*=M55#2' --no-prompt

# Bước 4: Kiểm tra
sudo systemctl status aws-replication-agent
```

## ⚠️ Troubleshooting

**Nếu không tìm thấy CloudShell:**
- CloudShell có thể không available trong tất cả regions
- Thử đổi region về us-east-1 hoặc us-west-2
- Sử dụng EC2 Instance Connect thay thế

**Nếu lệnh sudo không work:**
- CloudShell user đã có sudo permissions
- EC2 user cần dùng: `sudo su -` để switch to root

**Nếu installer báo lỗi credentials:**
- Double-check Access Key và Secret Key
- Đảm bảo IAM user có đủ permissions