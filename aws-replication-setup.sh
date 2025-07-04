#!/bin/bash

# AWS Replication Installer Setup Script
# Kết nối tới AWS Application Migration Service (ap-northeast-1)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# AWS Configuration
AWS_REGION="ap-northeast-1"
AWS_INSTALLER_URL="https://aws-application-migration-service-ap-northeast-1.s3.ap-northeast-1.amazonaws.com/latest/linux/aws-replication-installer-init"
INSTALLER_FILE="./aws-replication-installer-init"

echo -e "${BLUE}🌐 AWS Application Migration Service Setup${NC}"
echo "=========================================="
echo "Region: $AWS_REGION"
echo "Installer URL: $AWS_INSTALLER_URL"
echo

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Kiểm tra điều kiện cần thiết...${NC}"
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}❌ Script này cần chạy với quyền root (sudo)${NC}"
        exit 1
    fi
    
    # Check internet connectivity
    if ! ping -c 1 aws.amazon.com &> /dev/null; then
        echo -e "${RED}❌ Không thể kết nối tới AWS${NC}"
        exit 1
    fi
    
    # Check required tools
    local required_tools=("wget" "curl" "systemctl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo -e "${RED}❌ Cần cài đặt: $tool${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ Tất cả điều kiện đã sẵn sàng${NC}"
}

# Function to download AWS replication installer
download_installer() {
    echo -e "${YELLOW}📥 Tải AWS Replication Installer...${NC}"
    
    # Remove existing installer if present
    if [[ -f "$INSTALLER_FILE" ]]; then
        rm -f "$INSTALLER_FILE"
        echo "Đã xóa installer cũ"
    fi
    
    # Download with proper headers and retry logic
    local max_retries=3
    local retry_count=0
    
    while [[ $retry_count -lt $max_retries ]]; do
        if wget -O "$INSTALLER_FILE" \
            --timeout=30 \
            --tries=3 \
            --retry-connrefused \
            --user-agent="Mozilla/5.0 (Linux; x86_64) AppleWebKit/537.36" \
            --header="Accept: application/octet-stream" \
            "$AWS_INSTALLER_URL"; then
            
            echo -e "${GREEN}✅ Đã tải thành công installer${NC}"
            break
        else
            retry_count=$((retry_count + 1))
            echo -e "${YELLOW}⚠️ Thử lại lần $retry_count/$max_retries...${NC}"
            sleep 5
        fi
    done
    
    if [[ $retry_count -eq $max_retries ]]; then
        echo -e "${RED}❌ Không thể tải installer sau $max_retries lần thử${NC}"
        exit 1
    fi
    
    # Make executable
    chmod +x "$INSTALLER_FILE"
    echo -e "${GREEN}✅ Installer đã sẵn sàng chạy${NC}"
}

# Function to run installer in background (non-hanging)
run_installer_background() {
    echo -e "${YELLOW}🚀 Chạy AWS Replication Installer...${NC}"
    
    # Create log file
    local log_file="/tmp/aws-replication-installer.log"
    
    # Run installer in background with proper logging
    nohup "$INSTALLER_FILE" \
        --region="$AWS_REGION" \
        --no-prompt \
        --log-level=info \
        > "$log_file" 2>&1 &
    
    local installer_pid=$!
    
    echo -e "${GREEN}✅ Installer đang chạy trong background${NC}"
    echo "PID: $installer_pid"
    echo "Log file: $log_file"
    
    # Monitor for initial few seconds
    sleep 5
    
    if ps -p $installer_pid > /dev/null; then
        echo -e "${GREEN}✅ Installer đang chạy bình thường${NC}"
        echo "Để theo dõi tiến trình: tail -f $log_file"
        echo "Để kiểm tra trạng thái: ps -p $installer_pid"
    else
        echo -e "${RED}❌ Installer đã dừng bất thường${NC}"
        echo "Kiểm tra log: cat $log_file"
        exit 1
    fi
}

# Function to run installer with timeout (prevent hanging)
run_installer_timeout() {
    echo -e "${YELLOW}🚀 Chạy AWS Replication Installer với timeout...${NC}"
    
    local timeout_seconds=300  # 5 minutes
    local log_file="/tmp/aws-replication-installer.log"
    
    # Run with timeout to prevent hanging
    timeout "$timeout_seconds" "$INSTALLER_FILE" \
        --region="$AWS_REGION" \
        --no-prompt \
        --log-level=info \
        > "$log_file" 2>&1 &
    
    local installer_pid=$!
    
    echo "PID: $installer_pid"
    echo "Timeout: $timeout_seconds seconds"
    echo "Log file: $log_file"
    
    # Wait for completion or timeout
    wait $installer_pid
    local exit_code=$?
    
    if [[ $exit_code -eq 124 ]]; then
        echo -e "${RED}❌ Installer timeout sau $timeout_seconds giây${NC}"
        exit 1
    elif [[ $exit_code -eq 0 ]]; then
        echo -e "${GREEN}✅ Installer hoàn thành thành công${NC}"
    else
        echo -e "${RED}❌ Installer lỗi với exit code: $exit_code${NC}"
        exit 1
    fi
}

# Function to check installer status
check_installer_status() {
    echo -e "${YELLOW}📊 Kiểm tra trạng thái AWS Replication Service...${NC}"
    
    # Check if AWS replication agent is running
    if systemctl is-active --quiet aws-replication-agent; then
        echo -e "${GREEN}✅ AWS Replication Agent đang chạy${NC}"
        systemctl status aws-replication-agent --no-pager
    else
        echo -e "${RED}❌ AWS Replication Agent chưa chạy${NC}"
    fi
    
    # Check network connectivity to AWS
    if curl -s --connect-timeout 5 "https://mgn.$AWS_REGION.amazonaws.com" > /dev/null; then
        echo -e "${GREEN}✅ Kết nối tới AWS MGN service bình thường${NC}"
    else
        echo -e "${RED}❌ Không thể kết nối tới AWS MGN service${NC}"
    fi
}

# Function to stop installer if hanging
stop_installer() {
    echo -e "${YELLOW}⏹️ Dừng AWS Replication Installer...${NC}"
    
    # Find and kill installer processes
    pkill -f "aws-replication-installer" || true
    
    # Stop AWS replication agent if running
    systemctl stop aws-replication-agent || true
    
    echo -e "${GREEN}✅ Đã dừng tất cả processes liên quan${NC}"
}

# Main function
main() {
    case "${1:-install}" in
        "install")
            check_prerequisites
            download_installer
            run_installer_background
            ;;
        "install-timeout")
            check_prerequisites
            download_installer
            run_installer_timeout
            ;;
        "status")
            check_installer_status
            ;;
        "stop")
            stop_installer
            ;;
        "help"|"--help")
            echo "Sử dụng: $0 [install|install-timeout|status|stop|help]"
            echo
            echo "Commands:"
            echo "  install         - Cài đặt và chạy installer trong background"
            echo "  install-timeout - Cài đặt với timeout để tránh treo"
            echo "  status          - Kiểm tra trạng thái service"
            echo "  stop            - Dừng installer và service"
            echo "  help            - Hiển thị trợ giúp"
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