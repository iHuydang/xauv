#!/bin/bash

# AWS CloudShell Setup Guide
# Hướng dẫn thiết lập và sử dụng AWS CloudShell để chạy AWS Replication Agent

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌐 AWS CloudShell Setup Guide${NC}"
echo "================================="
echo "Region: ap-northeast-1 (Asia Pacific - Tokyo)"
echo "Purpose: Chạy AWS Replication Agent Installation"
echo

# Function to show CloudShell access methods
show_cloudshell_access() {
    echo -e "${YELLOW}📍 Cách truy cập AWS CloudShell:${NC}"
    echo
    echo "1. VIA AWS CONSOLE:"
    echo "   - Đăng nhập: https://ap-northeast-1.console.aws.amazon.com"
    echo "   - Tìm CloudShell icon ở thanh navigation bar (terminal icon)"
    echo "   - Click vào CloudShell icon để mở terminal"
    echo
    echo "2. VIA DIRECT LINK:"
    echo "   - URL: https://ap-northeast-1.console.aws.amazon.com/cloudshell/home?region=ap-northeast-1"
    echo
    echo "3. VIA AWS CLI (nếu đã cài):"
    echo "   - aws cloudshell create-environment --region ap-northeast-1"
    echo
}

# Function to show CloudShell commands
show_cloudshell_commands() {
    echo -e "${YELLOW}⚡ Lệnh chạy trong AWS CloudShell:${NC}"
    echo
    echo "# Bước 1: Tải AWS Replication Installer"
    echo "wget -O aws-replication-installer-init https://aws-application-migration-service-ap-northeast-1.s3.ap-northeast-1.amazonaws.com/latest/linux/aws-replication-installer-init"
    echo
    echo "# Bước 2: Cấp quyền thực thi"
    echo "chmod +x aws-replication-installer-init"
    echo
    echo "# Bước 3: Chạy installer (với credentials của bạn)"
    echo "sudo ./aws-replication-installer-init \\"
    echo "  --region ap-northeast-1 \\"
    echo "  --aws-access-key-id ieagleviet@gmail.com \\"
    echo "  --aws-secret-access-key '\$Xcz\$ApH*=M55#2' \\"
    echo "  --no-prompt"
    echo
    echo "# Bước 4: Kiểm tra trạng thái"
    echo "sudo systemctl status aws-replication-agent"
    echo
}

# Function to show EC2 alternative
show_ec2_alternative() {
    echo -e "${YELLOW}🖥️ Alternative: Sử dụng EC2 Instance${NC}"
    echo
    echo "Nếu CloudShell không khả dụng, bạn có thể:"
    echo
    echo "1. LAUNCH EC2 INSTANCE:"
    echo "   - AMI: Amazon Linux 2 (free tier eligible)"
    echo "   - Instance Type: t2.micro (free tier)"
    echo "   - Region: ap-northeast-1"
    echo
    echo "2. CONNECT VIA SSH:"
    echo "   - Sử dụng EC2 Instance Connect"
    echo "   - Hoặc SSH với key pair"
    echo
    echo "3. RUN SAME COMMANDS như trong CloudShell"
    echo
}

# Function to troubleshoot common issues
show_troubleshooting() {
    echo -e "${YELLOW}🔧 Troubleshooting Common Issues:${NC}"
    echo
    echo "❌ ISSUE: CloudShell không tìm thấy"
    echo "✅ SOLUTION:"
    echo "   - Đảm bảo đăng nhập đúng AWS account"
    echo "   - Kiểm tra region: ap-northeast-1"
    echo "   - CloudShell có thể bị ẩn trong 'More services'"
    echo
    echo "❌ ISSUE: Permission denied khi chạy installer"
    echo "✅ SOLUTION:"
    echo "   - Sử dụng 'sudo' trước lệnh"
    echo "   - Kiểm tra file permissions: ls -la aws-replication-installer-init"
    echo
    echo "❌ ISSUE: Invalid credentials"
    echo "✅ SOLUTION:"
    echo "   - Kiểm tra Access Key ID và Secret Key"
    echo "   - Đảm bảo IAM user có quyền AWSApplicationMigrationAgentInstallationPolicy"
    echo
    echo "❌ ISSUE: Network connectivity"
    echo "✅ SOLUTION:"
    echo "   - Test: ping aws-application-migration-service-ap-northeast-1.amazonaws.com"
    echo "   - Kiểm tra security groups và firewall"
    echo
}

# Function to show pre-installation checklist
show_checklist() {
    echo -e "${BLUE}📋 Pre-Installation Checklist${NC}"
    echo "=========================="
    echo
    echo "□ AWS Account Access:"
    echo "  - Đăng nhập được AWS Console"
    echo "  - Access Key: ieagleviet@gmail.com"
    echo "  - Secret Key: \$Xcz\$ApH*=M55#2"
    echo
    echo "□ IAM Permissions:"
    echo "  - AWSApplicationMigrationAgentInstallationPolicy attached"
    echo "  - MGN service permissions"
    echo
    echo "□ Network Requirements:"
    echo "  - Internet connectivity"
    echo "  - Access to AWS endpoints"
    echo
    echo "□ System Requirements:"
    echo "  - Linux environment (CloudShell/EC2)"
    echo "  - Sudo access"
    echo "  - Minimum 1GB free space"
    echo
}

# Function to generate step-by-step guide
generate_step_guide() {
    echo -e "${GREEN}🚀 STEP-BY-STEP INSTALLATION GUIDE${NC}"
    echo "=================================="
    echo
    echo "STEP 1: Access AWS CloudShell"
    echo "------------------------------"
    echo "1. Go to: https://ap-northeast-1.console.aws.amazon.com"
    echo "2. Login with your AWS credentials"
    echo "3. Look for CloudShell icon (terminal) in top navigation"
    echo "4. Click to open CloudShell terminal"
    echo
    echo "STEP 2: Download Installer"
    echo "--------------------------"
    echo "Copy and paste this command:"
    echo "wget -O aws-replication-installer-init https://aws-application-migration-service-ap-northeast-1.s3.ap-northeast-1.amazonaws.com/latest/linux/aws-replication-installer-init"
    echo
    echo "STEP 3: Make Executable"
    echo "-----------------------"
    echo "chmod +x aws-replication-installer-init"
    echo
    echo "STEP 4: Install Agent"
    echo "--------------------"
    echo "sudo ./aws-replication-installer-init --region ap-northeast-1 --aws-access-key-id ieagleviet@gmail.com --aws-secret-access-key '\$Xcz\$ApH*=M55#2' --no-prompt"
    echo
    echo "STEP 5: Verify Installation"
    echo "---------------------------"
    echo "sudo systemctl status aws-replication-agent"
    echo
}

# Main function
main() {
    case "${1:-guide}" in
        "guide")
            generate_step_guide
            ;;
        "access")
            show_cloudshell_access
            ;;
        "commands")
            show_cloudshell_commands
            ;;
        "ec2")
            show_ec2_alternative
            ;;
        "troubleshoot")
            show_troubleshooting
            ;;
        "checklist")
            show_checklist
            ;;
        "all")
            show_checklist
            echo
            show_cloudshell_access
            echo
            show_cloudshell_commands
            echo
            show_troubleshooting
            ;;
        "help"|"--help")
            echo "Usage: $0 [guide|access|commands|ec2|troubleshoot|checklist|all|help]"
            echo
            echo "Commands:"
            echo "  guide       - Hướng dẫn từng bước chi tiết (default)"
            echo "  access      - Cách truy cập AWS CloudShell"
            echo "  commands    - Lệnh chạy trong CloudShell"
            echo "  ec2         - Alternative sử dụng EC2"
            echo "  troubleshoot- Xử lý sự cố thường gặp"
            echo "  checklist   - Checklist trước khi cài đặt"
            echo "  all         - Hiển thị tất cả thông tin"
            echo "  help        - Hiển thị trợ giúp"
            ;;
        *)
            echo -e "${RED}❌ Lệnh không hợp lệ: $1${NC}"
            echo "Sử dụng: $0 help để xem trợ giúp"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"