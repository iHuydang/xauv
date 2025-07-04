#!/bin/bash

# AWS Systems Manager Automation Script
# Tự động hóa cài đặt AWS Application Migration Service

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# AWS Configuration
AWS_REGION="ap-northeast-1"
AWS_ACCOUNT_ID="207567762473"
AUTOMATION_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/AWS-QuickSetup-JITNA-LocalAdministrationRole"
INSTANCE_ID="i-05c4d8f39e43b8280"
INSTANCE_NAME="frb"

# AWS Credentials
AWS_ACCESS_KEY_ID="ieagleviet@gmail.com"
AWS_SECRET_ACCESS_KEY='$Xcz$ApH*=M55#2'

echo -e "${BLUE}🤖 AWS Systems Manager Automation${NC}"
echo "=================================="
echo "Region: $AWS_REGION"
echo "Account ID: $AWS_ACCOUNT_ID"
echo "Automation Role: $AUTOMATION_ROLE_ARN"
echo "Target Instance: $INSTANCE_ID ($INSTANCE_NAME)"
echo

# Function to create automation document
create_automation_document() {
    echo -e "${YELLOW}📝 Creating automation document...${NC}"
    
    cat > replication-agent-automation.json << EOF
{
  "schemaVersion": "0.3",
  "description": "Install AWS Application Migration Service Replication Agent",
  "assumeRole": "${AUTOMATION_ROLE_ARN}",
  "parameters": {
    "InstanceId": {
      "type": "String",
      "description": "EC2 Instance ID",
      "default": "${INSTANCE_ID}"
    },
    "Region": {
      "type": "String",
      "description": "AWS Region",
      "default": "${AWS_REGION}"
    },
    "AccessKeyId": {
      "type": "String",
      "description": "AWS Access Key ID",
      "default": "${AWS_ACCESS_KEY_ID}"
    },
    "SecretAccessKey": {
      "type": "String",
      "description": "AWS Secret Access Key",
      "default": "${AWS_SECRET_ACCESS_KEY}"
    }
  },
  "mainSteps": [
    {
      "name": "InstallReplicationAgent",
      "action": "aws:runCommand",
      "inputs": {
        "DocumentName": "AWS-RunShellScript",
        "InstanceIds": ["{{ InstanceId }}"],
        "Parameters": {
          "commands": [
            "#!/bin/bash",
            "set -e",
            "echo 'Starting AWS Replication Agent installation...'",
            "",
            "# Download installer",
            "wget -O /tmp/aws-replication-installer-init https://aws-application-migration-service-{{ Region }}.s3.{{ Region }}.amazonaws.com/latest/linux/aws-replication-installer-init",
            "",
            "# Make executable",
            "chmod +x /tmp/aws-replication-installer-init",
            "",
            "# Install agent with timeout protection",
            "timeout 600 /tmp/aws-replication-installer-init --region {{ Region }} --aws-access-key-id {{ AccessKeyId }} --aws-secret-access-key {{ SecretAccessKey }} --no-prompt",
            "",
            "# Verify installation",
            "systemctl status aws-replication-agent",
            "",
            "echo 'AWS Replication Agent installation completed successfully'"
          ]
        }
      }
    }
  ]
}
EOF

    echo -e "${GREEN}✅ Automation document created: replication-agent-automation.json${NC}"
}

# Function to create automation document in AWS
create_aws_automation_document() {
    echo -e "${YELLOW}📤 Creating automation document in AWS...${NC}"
    
    aws ssm create-document \
        --region "$AWS_REGION" \
        --name "InstallReplicationAgent" \
        --document-type "Automation" \
        --document-format "JSON" \
        --content file://replication-agent-automation.json \
        --tags Key=Purpose,Value=ReplicationAgent Key=Environment,Value=Production \
        2>/dev/null || echo "Document may already exist"
    
    echo -e "${GREEN}✅ Automation document created in AWS Systems Manager${NC}"
}

# Function to execute automation
execute_automation() {
    echo -e "${YELLOW}🚀 Executing automation...${NC}"
    
    EXECUTION_ID=$(aws ssm start-automation-execution \
        --region "$AWS_REGION" \
        --document-name "InstallReplicationAgent" \
        --parameters "InstanceId=${INSTANCE_ID},Region=${AWS_REGION},AccessKeyId=${AWS_ACCESS_KEY_ID},SecretAccessKey=${AWS_SECRET_ACCESS_KEY}" \
        --query 'AutomationExecutionId' \
        --output text)
    
    echo "Execution ID: $EXECUTION_ID"
    echo -e "${GREEN}✅ Automation execution started${NC}"
    
    # Monitor execution
    monitor_execution "$EXECUTION_ID"
}

# Function to monitor automation execution
monitor_execution() {
    local execution_id="$1"
    
    echo -e "${YELLOW}📊 Monitoring automation execution...${NC}"
    
    while true; do
        STATUS=$(aws ssm describe-automation-executions \
            --region "$AWS_REGION" \
            --filters "Key=ExecutionId,Values=${execution_id}" \
            --query 'AutomationExecutions[0].AutomationExecutionStatus' \
            --output text)
        
        echo "Status: $STATUS"
        
        case "$STATUS" in
            "Success")
                echo -e "${GREEN}✅ Automation completed successfully${NC}"
                break
                ;;
            "Failed"|"Cancelled"|"TimedOut")
                echo -e "${RED}❌ Automation failed with status: $STATUS${NC}"
                get_execution_output "$execution_id"
                exit 1
                ;;
            "InProgress")
                echo "Automation in progress..."
                sleep 30
                ;;
            *)
                echo "Status: $STATUS"
                sleep 30
                ;;
        esac
    done
}

# Function to get execution output
get_execution_output() {
    local execution_id="$1"
    
    echo -e "${YELLOW}📋 Getting execution output...${NC}"
    
    aws ssm describe-automation-step-executions \
        --region "$AWS_REGION" \
        --automation-execution-id "$execution_id" \
        --query 'StepExecutions[*].{Step:StepName,Status:StepStatus,Output:Outputs}' \
        --output table
}

# Function to create Systems Manager command directly
create_direct_command() {
    echo -e "${YELLOW}⚡ Creating direct Systems Manager command...${NC}"
    
    COMMAND_ID=$(aws ssm send-command \
        --region "$AWS_REGION" \
        --instance-ids "$INSTANCE_ID" \
        --document-name "AWS-RunShellScript" \
        --parameters 'commands=["#!/bin/bash","set -e","echo \"Starting AWS Replication Agent installation...\"","wget -O /tmp/aws-replication-installer-init https://aws-application-migration-service-'$AWS_REGION'.s3.'$AWS_REGION'.amazonaws.com/latest/linux/aws-replication-installer-init","chmod +x /tmp/aws-replication-installer-init","timeout 600 /tmp/aws-replication-installer-init --region '$AWS_REGION' --aws-access-key-id '$AWS_ACCESS_KEY_ID' --aws-secret-access-key '$AWS_SECRET_ACCESS_KEY' --no-prompt","systemctl status aws-replication-agent","echo \"Installation completed successfully\""]' \
        --query 'Command.CommandId' \
        --output text)
    
    echo "Command ID: $COMMAND_ID"
    echo -e "${GREEN}✅ Direct command sent to instance${NC}"
    
    # Monitor command
    monitor_command "$COMMAND_ID"
}

# Function to monitor command execution
monitor_command() {
    local command_id="$1"
    
    echo -e "${YELLOW}📊 Monitoring command execution...${NC}"
    
    while true; do
        STATUS=$(aws ssm describe-instance-information \
            --region "$AWS_REGION" \
            --instance-information-filter-list "key=InstanceIds,valueSet=$INSTANCE_ID" \
            --query 'InstanceInformationList[0].PingStatus' \
            --output text 2>/dev/null || echo "Unknown")
        
        COMMAND_STATUS=$(aws ssm list-command-invocations \
            --region "$AWS_REGION" \
            --command-id "$command_id" \
            --details \
            --query 'CommandInvocations[0].Status' \
            --output text 2>/dev/null || echo "Unknown")
        
        echo "Instance Status: $STATUS | Command Status: $COMMAND_STATUS"
        
        case "$COMMAND_STATUS" in
            "Success")
                echo -e "${GREEN}✅ Command completed successfully${NC}"
                get_command_output "$command_id"
                break
                ;;
            "Failed"|"Cancelled"|"TimedOut")
                echo -e "${RED}❌ Command failed with status: $COMMAND_STATUS${NC}"
                get_command_output "$command_id"
                exit 1
                ;;
            "InProgress")
                echo "Command in progress..."
                sleep 30
                ;;
            *)
                echo "Waiting for command to start..."
                sleep 30
                ;;
        esac
    done
}

# Function to get command output
get_command_output() {
    local command_id="$1"
    
    echo -e "${YELLOW}📋 Getting command output...${NC}"
    
    aws ssm get-command-invocation \
        --region "$AWS_REGION" \
        --command-id "$command_id" \
        --instance-id "$INSTANCE_ID" \
        --query '{Status:Status,StatusDetails:StatusDetails,StandardOutputContent:StandardOutputContent,StandardErrorContent:StandardErrorContent}' \
        --output table
}

# Function to show available commands
show_commands() {
    echo -e "${YELLOW}📋 Available commands:${NC}"
    echo
    echo "1. automation    - Create and execute full automation"
    echo "2. document      - Create automation document only"
    echo "3. direct        - Send direct command to instance"
    echo "4. monitor       - Monitor existing execution"
    echo "5. status        - Check instance status"
    echo "6. cleanup       - Clean up automation resources"
    echo "7. help          - Show this help"
    echo
}

# Function to check instance status
check_instance_status() {
    echo -e "${YELLOW}🔍 Checking instance status...${NC}"
    
    # EC2 instance status
    echo "EC2 Instance Status:"
    aws ec2 describe-instances \
        --region "$AWS_REGION" \
        --instance-ids "$INSTANCE_ID" \
        --query 'Reservations[0].Instances[0].{InstanceId:InstanceId,State:State.Name,LaunchTime:LaunchTime,PublicDnsName:PublicDnsName}' \
        --output table
    
    echo
    
    # SSM agent status
    echo "SSM Agent Status:"
    aws ssm describe-instance-information \
        --region "$AWS_REGION" \
        --instance-information-filter-list "key=InstanceIds,valueSet=$INSTANCE_ID" \
        --query 'InstanceInformationList[0].{InstanceId:InstanceId,PingStatus:PingStatus,LastPingDateTime:LastPingDateTime,AgentVersion:AgentVersion}' \
        --output table
}

# Function to cleanup resources
cleanup_resources() {
    echo -e "${YELLOW}🧹 Cleaning up automation resources...${NC}"
    
    # Delete automation document
    aws ssm delete-document \
        --region "$AWS_REGION" \
        --name "InstallReplicationAgent" \
        2>/dev/null || echo "Document may not exist"
    
    # Clean up local files
    rm -f replication-agent-automation.json
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main function
main() {
    case "${1:-help}" in
        "automation")
            create_automation_document
            create_aws_automation_document
            execute_automation
            ;;
        "document")
            create_automation_document
            create_aws_automation_document
            ;;
        "direct")
            create_direct_command
            ;;
        "monitor")
            if [[ -z "$2" ]]; then
                echo "Usage: $0 monitor <execution-id>"
                exit 1
            fi
            monitor_execution "$2"
            ;;
        "status")
            check_instance_status
            ;;
        "cleanup")
            cleanup_resources
            ;;
        "help"|"--help")
            show_commands
            ;;
        *)
            echo -e "${RED}❌ Invalid command: $1${NC}"
            show_commands
            exit 1
            ;;
    esac
}

# Run main function
main "$@"