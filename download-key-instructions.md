# Hướng dẫn tải Key File từ AWS

## Cách 1: Tải từ AWS Console

1. **Truy cập AWS EC2 Console**:
   - Vào https://ap-northeast-1.console.aws.amazon.com/ec2/home?region=ap-northeast-1#KeyPairs:
   
2. **Tìm key pair `frbvn`**:
   - Nếu đã có key `frbvn`, có thể bạn đã tải về rồi
   - Nếu chưa có, tạo mới

3. **Tạo key mới nếu cần**:
   - Click "Create key pair"
   - Name: `frbvn` 
   - Type: RSA
   - Format: .pem
   - Click "Create key pair" -> file sẽ tự động download

## Cách 2: Tạo key mới và attach vào instance

Nếu bạn không có file key gốc, có thể tạo key mới:

1. **Tạo key pair mới**:
   ```bash
   # Tạo key mới
   ssh-keygen -t rsa -b 2048 -f ./new-trading-key
   ```

2. **Upload public key lên EC2**:
   - Copy nội dung file `new-trading-key.pub`
   - Vào EC2 Console -> Key Pairs -> Import key pair
   - Paste public key content

3. **Sửa script để dùng key mới**:
   - Đổi `frbvn.pem` thành `new-trading-key` trong script

## Cách 3: Sử dụng Session Manager (không cần key)

AWS cung cấp Session Manager để SSH không cần key file.