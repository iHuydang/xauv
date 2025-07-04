#!/bin/bash

# EC2 AWS Replication Agent Installation Script
# Cho instance i-05c4d8f39e43b8280 (frb)

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# EC2 Instance Details
INSTANCE_ID="i-05c4d8f39e43b8280"
INSTANCE_NAME="frb"
PUBLIC_DNS="ec2-13-115-244-125.ap-northeast-1.compute.amazonaws.com"
KEY_FILE="frbvn.pem"
EC2_USER="ec2-user"

# AWS Credentials
AWS_ACCESS_KEY_ID="ieagleviet@gmail.com"
AWS_SECRET_ACCESS_KEY='$Xcz$ApH*=M55#2'
AWS_REGION="ap-northeast-1"

echo -e "${BLUE}🚀 EC2 AWS Replication Agent Installation${NC}"
echo "=========================================="
echo "Instance ID: $INSTANCE_ID ($INSTANCE_NAME)"
echo "Public DNS: $PUBLIC_DNS"
echo "Key File: $KEY_FILE"
echo "Region: $AWS_REGION"
echo

# Function to show SSH connection info
show_ssh_connection() {
    echo -e "${YELLOW}🔗 SSH Connection Commands:${NC}"
    echo
    echo "1. Set proper key permissions:"
    echo "   chmod 400 \"$KEY_FILE\""
    echo
    echo "2. Connect to instance:"
    echo "   ssh -i \"$KEY_FILE\" $EC2_USER@$PUBLIC_DNS"
    echo
    echo "3. Alternative connection (if key file in current directory):"
    echo "   ssh -i ./$KEY_FILE $EC2_USER@$PUBLIC_DNS"
    echo
}

# Function to generate remote installation script
generate_remote_script() {
    echo -e "${YELLOW}📝 Creating remote installation script...${NC}"
    
    cat > install-on-ec2.sh << 'EOF'
#!/bin/bash

# AWS Replication Agent Installation Script for EC2
# To be run ON the EC2 instance

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# AWS Configuration
AWS_ACCESS_KEY_ID="ieagleviet@gmail.com"
AWS_SECRET_ACCESS_KEY='$Xcz$ApH*=M55#2'
AWS_REGION="ap-northeast-1"
INSTALLER_URL="https://aws-application-migration-service-ap-northeast-1.s3.ap-northeast-1.amazonaws.com/latest/linux/aws-replication-installer-init"
INSTALLER_FILE="aws-replication-installer-init"

echo -e "${BLUE}🎯 AWS Replication Agent Installation on EC2${NC}"
echo "=============================================="
echo "Instance: $(hostname)"
echo "Region: $AWS_REGION"
echo "Time: $(date)"
echo

# Function to check system requirements
check_system() {
    echo -e "${YELLOW}🔍 Checking system requirements...${NC}"
    
    # OS Check
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        echo "OS: $PRETTY_NAME"
    fi
    
    # Architecture
    echo "Architecture: $(uname -m)"
    
    # Memory
    echo "Memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
    
    # Disk space
    echo "Disk space: $(df -h / | tail -1 | awk '{print $4}') available"
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        echo -e "${GREEN}✅ Running as root${NC}"
    else
        echo -e "${YELLOW}⚠️ Not running as root, will use sudo${NC}"
    fi
    
    echo
}

# Function to download installer
download_installer() {
    echo -e "${YELLOW}📥 Downloading AWS Replication Installer...${NC}"
    
    # Remove existing installer if present
    if [[ -f "$INSTALLER_FILE" ]]; then
        rm -f "$INSTALLER_FILE"
        echo "Removed existing installer"
    fi
    
    # Download installer
    if wget -O "$INSTALLER_FILE" "$INSTALLER_URL"; then
        echo -e "${GREEN}✅ Download successful${NC}"
        
        # Make executable
        chmod +x "$INSTALLER_FILE"
        echo "Made installer executable"
        
        # Show file info
        ls -lh "$INSTALLER_FILE"
    else
        echo -e "${RED}❌ Download failed${NC}"
        exit 1
    fi
    
    echo
}

# Function to install agent
install_agent() {
    echo -e "${YELLOW}🚀 Installing AWS Replication Agent...${NC}"
    
    # Prepare log file
    LOG_FILE="/tmp/aws-replication-install-$(date +%Y%m%d-%H%M%S).log"
    
    # Run installer
    echo "Running installer... (log: $LOG_FILE)"
    
    if sudo timeout 600 ./"$INSTALLER_FILE" \
        --region "$AWS_REGION" \
        --aws-access-key-id "$AWS_ACCESS_KEY_ID" \
        --aws-secret-access-key "$AWS_SECRET_ACCESS_KEY" \
        --no-prompt \
        2>&1 | tee "$LOG_FILE"; then
        
        echo -e "${GREEN}✅ Installation completed successfully${NC}"
    else
        local exit_code=$?
        echo -e "${RED}❌ Installation failed with exit code: $exit_code${NC}"
        echo "Check log file: $LOG_FILE"
        return 1
    fi
    
    echo
}

# Function to verify installation
verify_installation() {
    echo -e "${YELLOW}🔍 Verifying installation...${NC}"
    
    # Check service status
    if sudo systemctl is-active --quiet aws-replication-agent; then
        echo -e "${GREEN}✅ AWS Replication Agent service is running${NC}"
        sudo systemctl status aws-replication-agent --no-pager
    else
        echo -e "${YELLOW}⚠️ Service not running, attempting to start...${NC}"
        
        if sudo systemctl start aws-replication-agent; then
            echo -e "${GREEN}✅ Service started successfully${NC}"
        else
            echo -e "${RED}❌ Failed to start service${NC}"
        fi
    fi
    
    echo
    
    # Check logs
    echo -e "${YELLOW}📋 Recent logs:${NC}"
    sudo journalctl -u aws-replication-agent --no-pager -n 10 || echo "No logs available"
    
    echo
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Installation Summary${NC}"
    echo "======================"
    echo "Instance: $(hostname)"
    echo "Date: $(date)"
    echo "AWS Region: $AWS_REGION"
    echo "Installer: $INSTALLER_FILE"
    
    if [[ -f "$INSTALLER_FILE" ]]; then
        echo "Installer size: $(ls -lh "$INSTALLER_FILE" | awk '{print $5}')"
    fi
    
    echo
    echo "Service status:"
    sudo systemctl status aws-replication-agent --no-pager || echo "Service not found"
    
    echo
}

# Main execution
main() {
    case "${1:-install}" in
        "install")
            check_system
            download_installer
            install_agent
            verify_installation
            show_status
            ;;
        "download")
            download_installer
            ;;
        "verify")
            verify_installation
            ;;
        "status")
            show_status
            ;;
        "help"|"--help")
            echo "Usage: $0 [install|download|verify|status|help]"
            echo
            echo "Commands:"
            echo "  install  - Full installation process (default)"
            echo "  download - Download installer only"
            echo "  verify   - Verify existing installation"
            echo "  status   - Show installation status"
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
EOF

    chmod +x install-on-ec2.sh
    echo -e "${GREEN}✅ Remote installation script created: install-on-ec2.sh${NC}"
}

# Function to show transfer commands
show_transfer_commands() {
    echo -e "${YELLOW}📤 Transfer script to EC2:${NC}"
    echo
    echo "scp -i \"$KEY_FILE\" install-on-ec2.sh $EC2_USER@$PUBLIC_DNS:~/"
    echo
    echo -e "${YELLOW}🎯 Run on EC2 after transfer:${NC}"
    echo "ssh -i \"$KEY_FILE\" $EC2_USER@$PUBLIC_DNS"
    echo "chmod +x install-on-ec2.sh"
    echo "./install-on-ec2.sh install"
    echo
}

# Function to show one-liner commands
show_one_liner() {
    echo -e "${YELLOW}⚡ One-liner commands for EC2:${NC}"
    echo
    echo "Copy and paste these commands into EC2 terminal:"
    echo
    echo "# Download installer"
    echo "wget -O aws-replication-installer-init https://aws-application-migration-service-ap-northeast-1.s3.ap-northeast-1.amazonaws.com/latest/linux/aws-replication-installer-init"
    echo
    echo "# Make executable"
    echo "chmod +x aws-replication-installer-init"
    echo
    echo "# Install agent"
    echo "sudo ./aws-replication-installer-init --region ap-northeast-1 --aws-access-key-id ieagleviet@gmail.com --aws-secret-access-key '\$Xcz\$ApH*=M55#2' --no-prompt"
    echo
    echo "# Check status"
    echo "sudo systemctl status aws-replication-agent"
    echo
}

# Main function
main() {
    case "${1:-guide}" in
        "ssh")
            show_ssh_connection
            ;;
        "script")
            generate_remote_script
            show_transfer_commands
            ;;
        "oneliner")
            show_one_liner
            ;;
        "guide")
            show_ssh_connection
            echo
            generate_remote_script
            echo
            show_transfer_commands
            echo
            show_one_liner
            ;;
        "help"|"--help")
            echo "Usage: $0 [ssh|script|oneliner|guide|help]"
            echo
            echo "Commands:"
            echo "  ssh      - Show SSH connection commands"
            echo "  script   - Generate remote installation script"
            echo "  oneliner - Show one-liner commands for EC2"
            echo "  guide    - Complete installation guide (default)"
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