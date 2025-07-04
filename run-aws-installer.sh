#!/bin/bash

# AWS Replication Agent Installation Script
# Chạy với thông tin xác thực đã cung cấp

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# AWS credentials
AWS_ACCESS_KEY_ID="ieagleviet@gmail.com"
AWS_SECRET_ACCESS_KEY='$Xcz$ApH*=M55#2'
AWS_REGION="ap-northeast-1"
INSTALLER_FILE="./aws-replication-installer-init"
LOG_FILE="/tmp/aws-replication-install.log"

echo -e "${BLUE}🚀 AWS Replication Agent Installation${NC}"
echo "====================================="
echo "Region: $AWS_REGION"
echo "Access Key: $AWS_ACCESS_KEY_ID"
echo "Log file: $LOG_FILE"
echo

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}❌ Script này cần chạy với quyền root (sudo)${NC}"
        echo "Sử dụng: sudo $0"
        exit 1
    fi
}

# Function to run installer with proper error handling
run_installer() {
    echo -e "${YELLOW}📦 Đang cài đặt AWS Replication Agent...${NC}"
    
    # Create log file
    touch "$LOG_FILE"
    chmod 644 "$LOG_FILE"
    
    # Run installer with timeout and proper logging
    timeout 600 "$INSTALLER_FILE" \
        --region "$AWS_REGION" \
        --aws-access-key-id "$AWS_ACCESS_KEY_ID" \
        --aws-secret-access-key "$AWS_SECRET_ACCESS_KEY" \
        --no-prompt \
        2>&1 | tee "$LOG_FILE"
    
    local exit_code=$?
    
    if [[ $exit_code -eq 0 ]]; then
        echo -e "${GREEN}✅ AWS Replication Agent đã được cài đặt thành công${NC}"
        return 0
    elif [[ $exit_code -eq 124 ]]; then
        echo -e "${RED}❌ Installer timeout sau 10 phút${NC}"
        return 1
    else
        echo -e "${RED}❌ Installer lỗi với exit code: $exit_code${NC}"
        return 1
    fi
}

# Function to check installation status
check_installation() {
    echo -e "${YELLOW}📊 Kiểm tra trạng thái cài đặt...${NC}"
    
    # Check if service is running
    if systemctl is-active --quiet aws-replication-agent; then
        echo -e "${GREEN}✅ AWS Replication Agent service đang chạy${NC}"
        systemctl status aws-replication-agent --no-pager
    else
        echo -e "${YELLOW}⚠️ AWS Replication Agent service chưa chạy${NC}"
        
        # Try to start the service
        if systemctl start aws-replication-agent 2>/dev/null; then
            echo -e "${GREEN}✅ Đã khởi động service thành công${NC}"
        else
            echo -e "${RED}❌ Không thể khởi động service${NC}"
        fi
    fi
    
    # Check log file for errors
    if [[ -f "$LOG_FILE" ]]; then
        echo -e "${YELLOW}📋 Kiểm tra log file...${NC}"
        if grep -q "error\|Error\|ERROR" "$LOG_FILE"; then
            echo -e "${RED}⚠️ Phát hiện lỗi trong log:${NC}"
            grep -i "error" "$LOG_FILE" | tail -5
        else
            echo -e "${GREEN}✅ Không có lỗi trong log${NC}"
        fi
    fi
}

# Function to show installation summary
show_summary() {
    echo -e "${BLUE}📋 Tóm tắt cài đặt${NC}"
    echo "=================="
    echo "Region: $AWS_REGION"
    echo "Access Key: $AWS_ACCESS_KEY_ID"
    echo "Log file: $LOG_FILE"
    echo "Installation time: $(date)"
    echo
    
    # Show last few lines of log
    if [[ -f "$LOG_FILE" ]]; then
        echo -e "${YELLOW}📄 Log cuối cùng:${NC}"
        tail -10 "$LOG_FILE"
    fi
}

# Function to run in background (non-blocking)
run_background() {
    echo -e "${YELLOW}🔄 Chạy installer trong background...${NC}"
    
    nohup "$INSTALLER_FILE" \
        --region "$AWS_REGION" \
        --aws-access-key-id "$AWS_ACCESS_KEY_ID" \
        --aws-secret-access-key "$AWS_SECRET_ACCESS_KEY" \
        --no-prompt \
        > "$LOG_FILE" 2>&1 &
    
    local pid=$!
    echo "PID: $pid"
    echo "Log file: $LOG_FILE"
    echo "Để theo dõi: tail -f $LOG_FILE"
    echo "Để kiểm tra: ps -p $pid"
}

# Main function
main() {
    case "${1:-install}" in
        "install")
            check_root
            run_installer
            check_installation
            show_summary
            ;;
        "background")
            check_root
            run_background
            ;;
        "status")
            check_installation
            ;;
        "summary")
            show_summary
            ;;
        "help"|"--help")
            echo "Usage: sudo $0 [install|background|status|summary|help]"
            echo
            echo "Commands:"
            echo "  install    - Cài đặt AWS Replication Agent (blocking)"
            echo "  background - Chạy installer trong background"
            echo "  status     - Kiểm tra trạng thái cài đặt"
            echo "  summary    - Hiển thị tóm tắt cài đặt"
            echo "  help       - Hiển thị trợ giúp"
            echo
            echo "Note: Script này cần quyền root (sudo)"
            ;;
        *)
            echo -e "${RED}❌ Lệnh không hợp lệ: $1${NC}"
            echo "Sử dụng: sudo $0 help để xem trợ giúp"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"