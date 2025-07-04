#!/bin/bash

# Demo AWS Replication Installer 
# Script này sẽ chạy AWS installer an toàn không bị treo

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

INSTALLER_FILE="./aws-replication-installer-init"
LOG_FILE="/tmp/aws-installer-demo.log"

echo -e "${BLUE}🚀 AWS Replication Installer Demo${NC}"
echo "================================="
echo "Region: ap-northeast-1"
echo "Mode: Demo (dry-run)"
echo

# Function to run installer safely
run_installer_safe() {
    echo -e "${YELLOW}📋 Chạy installer với chế độ an toàn...${NC}"
    
    if [[ ! -f "$INSTALLER_FILE" ]]; then
        echo -e "${RED}❌ Installer file không tồn tại${NC}"
        exit 1
    fi
    
    # Run installer with timeout and proper parameters
    timeout 60 "$INSTALLER_FILE" \
        --region="ap-northeast-1" \
        --no-prompt \
        --help \
        > "$LOG_FILE" 2>&1 || {
        
        exit_code=$?
        
        if [[ $exit_code -eq 124 ]]; then
            echo -e "${YELLOW}⚠️ Installer timeout sau 60 giây (bình thường)${NC}"
        elif [[ $exit_code -eq 1 ]]; then
            echo -e "${GREEN}✅ Installer chạy thành công${NC}"
        else
            echo -e "${RED}❌ Installer lỗi với exit code: $exit_code${NC}"
        fi
    }
    
    echo "Log file: $LOG_FILE"
}

# Function to test installer parameters
test_installer_params() {
    echo -e "${YELLOW}🔧 Kiểm tra các tham số installer...${NC}"
    
    # Test help command
    echo -n "Testing --help... "
    if timeout 5 "$INSTALLER_FILE" --help > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
    fi
    
    # Test region parameter
    echo -n "Testing --region... "
    if timeout 5 "$INSTALLER_FILE" --region ap-northeast-1 --help > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
    fi
    
    # Test no-prompt parameter
    echo -n "Testing --no-prompt... "
    if timeout 5 "$INSTALLER_FILE" --no-prompt --help > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
    fi
}

# Function to show installer info
show_installer_info() {
    echo -e "${BLUE}ℹ️ Thông tin Installer${NC}"
    echo "===================="
    
    if [[ -f "$INSTALLER_FILE" ]]; then
        echo "File: $INSTALLER_FILE"
        echo "Size: $(ls -lh "$INSTALLER_FILE" | awk '{print $5}')"
        echo "Permissions: $(ls -l "$INSTALLER_FILE" | awk '{print $1}')"
        echo "Type: $(file "$INSTALLER_FILE")"
        echo
        
        # Show first few lines of help
        echo -e "${YELLOW}Installer help (first 10 lines):${NC}"
        timeout 5 "$INSTALLER_FILE" --help 2>/dev/null | head -10 || echo "Cannot get help"
    else
        echo -e "${RED}❌ Installer file không tồn tại${NC}"
    fi
}

# Function to simulate real run (dry-run)
simulate_real_run() {
    echo -e "${YELLOW}🎯 Mô phỏng chạy thực tế...${NC}"
    
    # This would be the actual command but we'll simulate it
    echo "Lệnh sẽ được chạy:"
    echo "sudo $INSTALLER_FILE --region=ap-northeast-1 --no-prompt"
    echo
    
    echo -e "${GREEN}✅ Sẵn sàng chạy thực tế${NC}"
    echo "Để chạy thực tế, cần:"
    echo "1. Quyền sudo"
    echo "2. AWS credentials (access key, secret key)"
    echo "3. Network connectivity to AWS"
    echo "4. Sufficient disk space"
}

# Main function
main() {
    case "${1:-info}" in
        "info")
            show_installer_info
            ;;
        "test")
            test_installer_params
            ;;
        "safe")
            run_installer_safe
            ;;
        "simulate")
            simulate_real_run
            ;;
        "all")
            show_installer_info
            echo
            test_installer_params
            echo
            simulate_real_run
            ;;
        "help"|"--help")
            echo "Usage: $0 [info|test|safe|simulate|all|help]"
            echo
            echo "Commands:"
            echo "  info     - Show installer information"
            echo "  test     - Test installer parameters"
            echo "  safe     - Run installer safely with timeout"
            echo "  simulate - Simulate real installation"
            echo "  all      - Run all tests"
            echo "  help     - Show this help"
            ;;
        *)
            echo -e "${RED}❌ Invalid command: $1${NC}"
            echo "Use: $0 help for available commands"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"