#!/bin/bash

# AWS Quick Fix Script
# Khắc phục lỗi AWS setup nhanh chóng

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 AWS Quick Fix Tool${NC}"
echo "===================="
echo "Thời gian: $(date)"
echo

# Function to fix AWS credentials
fix_aws_credentials() {
    echo -e "${YELLOW}🔑 Cấu hình AWS credentials...${NC}"
    
    # Tạo AWS credentials file
    mkdir -p ~/.aws
    
    cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
region = ap-northeast-1
EOF

    cat > ~/.aws/config << EOF
[default]
region = ap-northeast-1
output = json
EOF

    echo -e "${GREEN}✅ AWS credentials đã được cấu hình${NC}"
}

# Function to show AWS Systems Manager URL
show_aws_url() {
    echo -e "${YELLOW}🔗 AWS Systems Manager Automation URL:${NC}"
    echo
    echo "https://ap-northeast-1.console.aws.amazon.com/systems-manager/automation/execute/AWSQuickSetupType-SetupJITNAResources?region=ap-northeast-1#AutomationAssumeRole=arn%3Aaws%3Aiam%3A%3A207567762473%3Arole%2FAWS-QuickSetup-JITNA-LocalAdministrationRole"
    echo
}

# Function to show EC2 connection info
show_ec2_info() {
    echo -e "${YELLOW}🖥️ EC2 Connection Info:${NC}"
    echo "Instance ID: i-05c4d8f39e43b8280"
    echo "Region: ap-northeast-1"
    echo "DNS: ec2-13-115-244-125.ap-northeast-1.compute.amazonaws.com"
    echo
    echo "SSH Connection:"
    echo "ssh -i \"frbvn.pem\" ec2-user@ec2-13-115-244-125.ap-northeast-1.compute.amazonaws.com"
    echo
}

# Function to show CloudFormation template
show_cloudformation_template() {
    echo -e "${YELLOW}📄 CloudFormation Template:${NC}"
    
    cat > aws-migration-template.yaml << EOF
AWSTemplateFormatVersion: '2010-09-09'
Description: 'AWS Application Migration Service Setup'

Parameters:
  InstanceId:
    Type: String
    Default: 'i-05c4d8f39e43b8280'
    Description: 'EC2 Instance ID for migration'

Resources:
  AppRegistryApplicationStackAssociation:
    Type: AWS::ServiceCatalogAppRegistry::ResourceAssociation
    Properties:
      Application: arn:aws:servicecatalog:ap-northeast-1:207567762473:/applications/0eju8n6pts35orkeq2rhez420p
      Resource: !Ref 'AWS::StackId'
      ResourceType: CFN_STACK

  MigrationServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: AWS-Migration-Service-Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: mgn.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSApplicationMigrationAgentInstallationPolicy

Outputs:
  StackStatus:
    Description: 'Stack deployment status'
    Value: 'Deployed successfully'
  
  InstanceId:
    Description: 'Target EC2 Instance ID'
    Value: !Ref InstanceId
    
  MigrationRole:
    Description: 'Migration Service Role ARN'
    Value: !GetAtt MigrationServiceRole.Arn
EOF

    echo -e "${GREEN}✅ CloudFormation template đã tạo: aws-migration-template.yaml${NC}"
}

# Function to show one-liner commands
show_one_liner_commands() {
    echo -e "${YELLOW}⚡ One-liner Commands cho EC2:${NC}"
    echo
    echo "# Download và cài đặt AWS Replication Agent"
    echo "wget -O aws-replication-installer-init https://aws-application-migration-service-ap-northeast-1.s3.ap-northeast-1.amazonaws.com/latest/linux/aws-replication-installer-init"
    echo
    echo "# Cấp quyền thực thi"
    echo "chmod +x aws-replication-installer-init"
    echo
    echo "# Cài đặt agent với timeout"
    echo "timeout 600 sudo ./aws-replication-installer-init --region ap-northeast-1 --aws-access-key-id ieagleviet@gmail.com --aws-secret-access-key '\$Xcz\$ApH*=M55#2' --no-prompt"
    echo
    echo "# Kiểm tra trạng thái service"
    echo "sudo systemctl status aws-replication-agent"
    echo
}

# Function to show automation parameters
show_automation_params() {
    echo -e "${YELLOW}🔧 Automation Parameters:${NC}"
    echo
    echo "Automation Assume Role:"
    echo "arn:aws:iam::207567762473:role/AWS-QuickSetup-JITNA-LocalAdministrationRole"
    echo
    echo "Application Registry:"
    echo "arn:aws:servicecatalog:ap-northeast-1:207567762473:/applications/0eju8n6pts35orkeq2rhez420p"
    echo
    echo "Region: ap-northeast-1"
    echo "Instance ID: i-05c4d8f39e43b8280"
    echo "Account ID: 207567762473"
    echo
}

# Function to clean up bash history
clean_bash_history() {
    echo -e "${YELLOW}🧹 Cleaning bash history...${NC}"
    
    # Remove problematic entries from history
    history -d $(history | grep -n "ResourceType::" | cut -d: -f1 | tail -1) 2>/dev/null || true
    history -d $(history | grep -n "Properties::" | cut -d: -f1 | tail -1) 2>/dev/null || true
    history -d $(history | grep -n "Type::" | cut -d: -f1 | tail -1) 2>/dev/null || true
    
    echo -e "${GREEN}✅ Bash history cleaned${NC}"
}

# Main function
main() {
    case "${1:-help}" in
        "credentials")
            fix_aws_credentials
            ;;
        "url")
            show_aws_url
            ;;
        "ec2")
            show_ec2_info
            ;;
        "template")
            show_cloudformation_template
            ;;
        "commands")
            show_one_liner_commands
            ;;
        "params")
            show_automation_params
            ;;
        "clean")
            clean_bash_history
            ;;
        "all")
            fix_aws_credentials
            show_aws_url
            show_ec2_info
            show_cloudformation_template
            show_one_liner_commands
            show_automation_params
            clean_bash_history
            ;;
        "help"|"--help")
            echo "Usage: $0 [credentials|url|ec2|template|commands|params|clean|all|help]"
            echo
            echo "Commands:"
            echo "  credentials  - Fix AWS credentials"
            echo "  url          - Show AWS Systems Manager URL"
            echo "  ec2          - Show EC2 connection info"
            echo "  template     - Create CloudFormation template"
            echo "  commands     - Show one-liner commands"
            echo "  params       - Show automation parameters"
            echo "  clean        - Clean bash history"
            echo "  all          - Run all fixes"
            echo "  help         - Show this help"
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