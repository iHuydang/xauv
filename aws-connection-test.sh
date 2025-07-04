#!/bin/bash

# AWS Connection Test Script
# Kiểm tra kết nối tới AWS trước khi chạy replication installer

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 AWS Connection Test${NC}"
echo "======================"

# Function to test AWS endpoints
test_aws_endpoints() {
    local region="ap-northeast-1"
    local endpoints=(
        "https://aws.amazon.com"
        "https://ap-northeast-1.console.aws.amazon.com"
        "https://mgn.ap-northeast-1.amazonaws.com"
        "https://aws-application-migration-service-ap-northeast-1.s3.ap-northeast-1.amazonaws.com"
    )
    
    echo -e "${YELLOW}📡 Testing AWS endpoints...${NC}"
    
    for endpoint in "${endpoints[@]}"; do
        echo -n "Testing $endpoint... "
        
        if curl -s --connect-timeout 10 --max-time 15 -I "$endpoint" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ OK${NC}"
        else
            echo -e "${RED}❌ FAILED${NC}"
        fi
    done
}

# Function to test DNS resolution
test_dns() {
    echo -e "${YELLOW}🌐 Testing DNS resolution...${NC}"
    
    local hosts=(
        "aws.amazon.com"
        "ap-northeast-1.console.aws.amazon.com"
        "mgn.ap-northeast-1.amazonaws.com"
    )
    
    for host in "${hosts[@]}"; do
        echo -n "Resolving $host... "
        
        if nslookup "$host" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ OK${NC}"
        else
            echo -e "${RED}❌ FAILED${NC}"
        fi
    done
}

# Function to test installer download
test_installer_download() {
    echo -e "${YELLOW}📥 Testing installer download...${NC}"
    
    local installer_url="https://aws-application-migration-service-ap-northeast-1.s3.ap-northeast-1.amazonaws.com/latest/linux/aws-replication-installer-init"
    
    echo -n "Testing download availability... "
    
    if curl -s --connect-timeout 10 --max-time 15 -I "$installer_url" | grep -q "200 OK"; then
        echo -e "${GREEN}✅ Available${NC}"
        
        # Get file size
        local file_size=$(curl -s --connect-timeout 10 --max-time 15 -I "$installer_url" | grep -i "content-length" | awk '{print $2}' | tr -d '\r')
        if [[ -n "$file_size" ]]; then
            echo "File size: $file_size bytes"
        fi
    else
        echo -e "${RED}❌ Not available${NC}"
    fi
}

# Function to check system requirements
check_system_requirements() {
    echo -e "${YELLOW}💻 Checking system requirements...${NC}"
    
    # Check OS
    echo -n "Operating System... "
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo -e "${GREEN}✅ Linux${NC}"
    else
        echo -e "${RED}❌ Not Linux${NC}"
    fi
    
    # Check architecture
    echo -n "Architecture... "
    local arch=$(uname -m)
    if [[ "$arch" == "x86_64" ]]; then
        echo -e "${GREEN}✅ x86_64${NC}"
    else
        echo -e "${YELLOW}⚠️ $arch (may not be supported)${NC}"
    fi
    
    # Check required tools
    local tools=("wget" "curl" "systemctl" "nslookup")
    for tool in "${tools[@]}"; do
        echo -n "Tool: $tool... "
        if command -v "$tool" &> /dev/null; then
            echo -e "${GREEN}✅ Available${NC}"
        else
            echo -e "${RED}❌ Missing${NC}"
        fi
    done
    
    # Check disk space
    echo -n "Disk space... "
    local available_space=$(df / | tail -1 | awk '{print $4}')
    if [[ $available_space -gt 1048576 ]]; then  # 1GB in KB
        echo -e "${GREEN}✅ $(($available_space / 1024 / 1024))GB available${NC}"
    else
        echo -e "${RED}❌ Less than 1GB available${NC}"
    fi
    
    # Check root privileges
    echo -n "Root privileges... "
    if [[ $EUID -eq 0 ]]; then
        echo -e "${GREEN}✅ Running as root${NC}"
    else
        echo -e "${YELLOW}⚠️ Not running as root${NC}"
    fi
}

# Function to generate connection report
generate_report() {
    echo -e "${BLUE}📊 Connection Report${NC}"
    echo "===================="
    echo "Date: $(date)"
    echo "Host: $(hostname)"
    echo "IP: $(hostname -I | awk '{print $1}')"
    echo "Region: ap-northeast-1"
    echo
    
    # Test internet connectivity
    echo -n "Internet connectivity... "
    if ping -c 1 8.8.8.8 &> /dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ No internet${NC}"
    fi
    
    # Test AWS general connectivity
    echo -n "AWS connectivity... "
    if curl -s --connect-timeout 5 "https://aws.amazon.com" > /dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ Cannot reach AWS${NC}"
    fi
}

# Main execution
main() {
    case "${1:-all}" in
        "endpoints")
            test_aws_endpoints
            ;;
        "dns")
            test_dns
            ;;
        "download")
            test_installer_download
            ;;
        "system")
            check_system_requirements
            ;;
        "report")
            generate_report
            ;;
        "all")
            generate_report
            echo
            check_system_requirements
            echo
            test_dns
            echo
            test_aws_endpoints
            echo
            test_installer_download
            ;;
        "help"|"--help")
            echo "Usage: $0 [endpoints|dns|download|system|report|all|help]"
            echo
            echo "Commands:"
            echo "  endpoints  - Test AWS endpoint connectivity"
            echo "  dns        - Test DNS resolution"
            echo "  download   - Test installer download"
            echo "  system     - Check system requirements"
            echo "  report     - Generate connection report"
            echo "  all        - Run all tests (default)"
            echo "  help       - Show this help"
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