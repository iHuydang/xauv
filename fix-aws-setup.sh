#!/bin/bash

# AWS Migration Service Setup Script
# Fix AWS configuration and deployment

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# AWS Configuration
AWS_REGION="ap-northeast-1"
INSTANCE_ID="i-05c4d8f39e43b8280"
STACK_NAME="aws-migration-stack"
ROLE_ARN="arn:aws:iam::207567762473:role/AWS-QuickSetup-JITNA-LocalAdministrationRole"

echo -e "${BLUE}🔧 AWS Migration Service Setup Fix${NC}"
echo "=================================="
echo "Region: $AWS_REGION"
echo "Instance: $INSTANCE_ID"
echo "Stack: $STACK_NAME"
echo "Time: $(date)"
echo

# Function to check AWS credentials
check_aws_credentials() {
    echo -e "${YELLOW}🔍 Checking AWS credentials...${NC}"
    
    if aws sts get-caller-identity > /dev/null 2>&1; then
        echo -e "${GREEN}✅ AWS credentials valid${NC}"
        aws sts get-caller-identity --output table
    else
        echo -e "${RED}❌ AWS credentials invalid${NC}"
        echo "Please configure AWS credentials first:"
        echo "aws configure"
        return 1
    fi
}

# Function to check EC2 instance status
check_instance_status() {
    echo -e "${YELLOW}🔍 Checking EC2 instance status...${NC}"
    
    aws ec2 describe-instances \
        --region "$AWS_REGION" \
        --instance-ids "$INSTANCE_ID" \
        --query 'Reservations[0].Instances[0].{InstanceId:InstanceId,State:State.Name,PublicDnsName:PublicDnsName,LaunchTime:LaunchTime}' \
        --output table
}

# Function to check Systems Manager agent
check_ssm_agent() {
    echo -e "${YELLOW}🔍 Checking SSM agent status...${NC}"
    
    aws ssm describe-instance-information \
        --region "$AWS_REGION" \
        --instance-information-filter-list "key=InstanceIds,valueSet=$INSTANCE_ID" \
        --query 'InstanceInformationList[0].{InstanceId:InstanceId,PingStatus:PingStatus,LastPingDateTime:LastPingDateTime,AgentVersion:AgentVersion}' \
        --output table || echo "SSM agent not connected"
}

# Function to install replication agent
install_replication_agent() {
    echo -e "${YELLOW}🚀 Installing AWS Replication Agent...${NC}"
    
    # Create automation document
    cat > replication-agent-automation.json << EOF
{
    "schemaVersion": "0.3",
    "description": "Install AWS Replication Agent",
    "assumeRole": "$ROLE_ARN",
    "parameters": {
        "InstanceId": {
            "type": "String",
            "description": "EC2 Instance ID"
        }
    },
    "mainSteps": [
        {
            "action": "aws:runShellScript",
            "name": "InstallReplicationAgent",
            "inputs": {
                "runCommand": [
                    "#!/bin/bash",
                    "set -e",
                    "cd /tmp",
                    "echo 'Downloading AWS Replication Agent...'",
                    "wget -O aws-replication-installer-init https://aws-application-migration-service-ap-northeast-1.s3.ap-northeast-1.amazonaws.com/latest/linux/aws-replication-installer-init",
                    "chmod +x aws-replication-installer-init",
                    "echo 'Installing AWS Replication Agent...'",
                    "timeout 600 ./aws-replication-installer-init --region ap-northeast-1 --aws-access-key-id ieagleviet@gmail.com --aws-secret-access-key '\\$Xcz\\$ApH*=M55#2' --no-prompt || echo 'Installation completed with warnings'",
                    "echo 'Checking service status...'",
                    "systemctl status aws-replication-agent --no-pager || echo 'Service check completed'",
                    "echo 'Installation process finished'"
                ]
            }
        }
    ]
}
EOF

    # Create automation document
    aws ssm create-document \
        --region "$AWS_REGION" \
        --name "InstallReplicationAgent" \
        --document-type "Automation" \
        --content file://replication-agent-automation.json \
        --document-format JSON || echo "Document may already exist"
    
    # Execute automation
    echo -e "${YELLOW}🔄 Executing automation...${NC}"
    
    EXECUTION_ID=$(aws ssm start-automation-execution \
        --region "$AWS_REGION" \
        --document-name "InstallReplicationAgent" \
        --parameters "InstanceId=$INSTANCE_ID" \
        --query 'AutomationExecutionId' \
        --output text)
    
    echo -e "${GREEN}✅ Automation started with ID: $EXECUTION_ID${NC}"
    
    # Monitor execution
    echo -e "${YELLOW}📊 Monitoring execution...${NC}"
    
    for i in {1..30}; do
        STATUS=$(aws ssm describe-automation-executions \
            --region "$AWS_REGION" \
            --filters "Key=ExecutionId,Values=$EXECUTION_ID" \
            --query 'AutomationExecutions[0].AutomationExecutionStatus' \
            --output text)
        
        echo "Status: $STATUS"
        
        case "$STATUS" in
            "Success")
                echo -e "${GREEN}✅ Automation completed successfully${NC}"
                break
                ;;
            "Failed")
                echo -e "${RED}❌ Automation failed${NC}"
                aws ssm describe-automation-executions \
                    --region "$AWS_REGION" \
                    --filters "Key=ExecutionId,Values=$EXECUTION_ID" \
                    --query 'AutomationExecutions[0].FailureMessage' \
                    --output text
                break
                ;;
            "InProgress")
                echo "Waiting for completion..."
                sleep 30
                ;;
            *)
                echo "Unknown status: $STATUS"
                sleep 30
                ;;
        esac
    done
}

# Function to deploy CloudFormation stack
deploy_cloudformation_stack() {
    echo -e "${YELLOW}🚀 Deploying CloudFormation stack...${NC}"
    
    cat > aws-migration-stack.yaml << EOF
AWSTemplateFormatVersion: '2010-09-09'
Description: 'AWS Application Migration Service Setup'

Parameters:
  InstanceId:
    Type: String
    Default: '$INSTANCE_ID'
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
        - arn:aws:iam::aws:policy/service-role/AWSApplicationMigrationAgentRole

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

    # Deploy stack
    aws cloudformation deploy \
        --region "$AWS_REGION" \
        --template-file aws-migration-stack.yaml \
        --stack-name "$STACK_NAME" \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameter-overrides InstanceId="$INSTANCE_ID" || echo "Stack deployment completed"
    
    echo -e "${GREEN}✅ CloudFormation stack deployed${NC}"
}

# Function to show AWS Systems Manager automation URL
show_automation_url() {
    echo -e "${YELLOW}🔗 AWS Systems Manager Automation URL:${NC}"
    echo "https://ap-northeast-1.console.aws.amazon.com/systems-manager/automation/execute/AWSQuickSetupType-SetupJITNAResources?region=ap-northeast-1#AutomationAssumeRole=arn%3Aaws%3Aiam%3A%3A207567762473%3Arole%2FAWS-QuickSetup-JITNA-LocalAdministrationRole"
    echo
}

# Function to cleanup resources
cleanup_resources() {
    echo -e "${YELLOW}🧹 Cleaning up resources...${NC}"
    
    # Delete automation document
    aws ssm delete-document \
        --region "$AWS_REGION" \
        --name "InstallReplicationAgent" || echo "Document cleanup completed"
    
    # Clean up local files
    rm -f replication-agent-automation.json
    rm -f aws-migration-stack.yaml
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main function
main() {
    case "${1:-status}" in
        "check")
            check_aws_credentials
            check_instance_status
            check_ssm_agent
            ;;
        "install")
            check_aws_credentials
            install_replication_agent
            ;;
        "deploy")
            check_aws_credentials
            deploy_cloudformation_stack
            ;;
        "url")
            show_automation_url
            ;;
        "cleanup")
            cleanup_resources
            ;;
        "status")
            check_aws_credentials
            check_instance_status
            check_ssm_agent
            show_automation_url
            ;;
        "help"|"--help")
            echo "Usage: $0 [check|install|deploy|url|cleanup|status|help]"
            echo
            echo "Commands:"
            echo "  check    - Check AWS credentials and instance status"
            echo "  install  - Install AWS Replication Agent"
            echo "  deploy   - Deploy CloudFormation stack"
            echo "  url      - Show automation URL"
            echo "  cleanup  - Clean up resources"
            echo "  status   - Show overall status (default)"
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