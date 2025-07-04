#!/bin/bash

# AWS Application Migration Service CloudFormation Deployment Script
# Includes Service Catalog App Registry integration

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
STACK_NAME="aws-migration-service-stack"
TEMPLATE_FILE="aws-migration-cloudformation.yaml"
REGION="ap-northeast-1"
ACCOUNT_ID="207567762473"

# Parameters
INSTANCE_ID="i-05c4d8f39e43b8280"
INSTANCE_NAME="frb"
APPLICATION_ID="0eju8n6pts35orkeq2rhez420p"
AWS_ACCESS_KEY_ID="ieagleviet@gmail.com"
AWS_SECRET_ACCESS_KEY='$Xcz$ApH*=M55#2'

echo -e "${BLUE}🚀 AWS Application Migration Service CloudFormation Deployment${NC}"
echo "================================================================="
echo "Stack Name: $STACK_NAME"
echo "Template: $TEMPLATE_FILE"
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo "Instance: $INSTANCE_ID ($INSTANCE_NAME)"
echo "App Registry ID: $APPLICATION_ID"
echo

# Function to validate template
validate_template() {
    echo -e "${YELLOW}📋 Validating CloudFormation template...${NC}"
    
    if ! aws cloudformation validate-template \
        --region "$REGION" \
        --template-body "file://$TEMPLATE_FILE" > /dev/null 2>&1; then
        echo -e "${RED}❌ Template validation failed${NC}"
        aws cloudformation validate-template \
            --region "$REGION" \
            --template-body "file://$TEMPLATE_FILE"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Template validation successful${NC}"
}

# Function to check if stack exists
stack_exists() {
    aws cloudformation describe-stacks \
        --region "$REGION" \
        --stack-name "$STACK_NAME" > /dev/null 2>&1
}

# Function to deploy stack
deploy_stack() {
    echo -e "${YELLOW}🏗️ Deploying CloudFormation stack...${NC}"
    
    local action="create-stack"
    if stack_exists; then
        action="update-stack"
        echo "Stack exists, performing update..."
    else
        echo "Creating new stack..."
    fi
    
    # Deploy stack with parameters
    aws cloudformation "$action" \
        --region "$REGION" \
        --stack-name "$STACK_NAME" \
        --template-body "file://$TEMPLATE_FILE" \
        --parameters \
            ParameterKey=InstanceId,ParameterValue="$INSTANCE_ID" \
            ParameterKey=InstanceName,ParameterValue="$INSTANCE_NAME" \
            ParameterKey=AWSAccessKeyId,ParameterValue="$AWS_ACCESS_KEY_ID" \
            ParameterKey=AWSSecretAccessKey,ParameterValue="$AWS_SECRET_ACCESS_KEY" \
            ParameterKey=ApplicationId,ParameterValue="$APPLICATION_ID" \
        --capabilities CAPABILITY_NAMED_IAM \
        --tags \
            Key=Environment,Value=Production \
            Key=Purpose,Value=ApplicationMigrationService \
            Key=Owner,Value=ieagleviet@gmail.com \
            Key=Project,Value=AWSMigration
    
    echo -e "${GREEN}✅ Stack deployment initiated${NC}"
}

# Function to wait for stack completion
wait_for_stack() {
    echo -e "${YELLOW}⏳ Waiting for stack operation to complete...${NC}"
    
    local start_time=$(date +%s)
    local timeout=1800  # 30 minutes
    
    while true; do
        local status=$(aws cloudformation describe-stacks \
            --region "$REGION" \
            --stack-name "$STACK_NAME" \
            --query 'Stacks[0].StackStatus' \
            --output text 2>/dev/null || echo "NOT_FOUND")
        
        echo "Status: $status"
        
        case "$status" in
            "CREATE_COMPLETE"|"UPDATE_COMPLETE")
                echo -e "${GREEN}✅ Stack operation completed successfully${NC}"
                return 0
                ;;
            "CREATE_FAILED"|"UPDATE_FAILED"|"ROLLBACK_COMPLETE"|"UPDATE_ROLLBACK_COMPLETE")
                echo -e "${RED}❌ Stack operation failed with status: $status${NC}"
                get_stack_events
                return 1
                ;;
            "CREATE_IN_PROGRESS"|"UPDATE_IN_PROGRESS"|"UPDATE_ROLLBACK_IN_PROGRESS")
                echo "Operation in progress..."
                ;;
            "NOT_FOUND")
                echo -e "${RED}❌ Stack not found${NC}"
                return 1
                ;;
            *)
                echo "Status: $status"
                ;;
        esac
        
        # Check timeout
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        if [ $elapsed -gt $timeout ]; then
            echo -e "${RED}❌ Operation timed out after $timeout seconds${NC}"
            return 1
        fi
        
        sleep 30
    done
}

# Function to get stack events
get_stack_events() {
    echo -e "${YELLOW}📋 Recent stack events:${NC}"
    
    aws cloudformation describe-stack-events \
        --region "$REGION" \
        --stack-name "$STACK_NAME" \
        --query 'StackEvents[0:10].{Time:Timestamp,Status:ResourceStatus,Reason:ResourceStatusReason,Resource:LogicalResourceId}' \
        --output table
}

# Function to get stack outputs
get_stack_outputs() {
    echo -e "${YELLOW}📤 Stack outputs:${NC}"
    
    aws cloudformation describe-stacks \
        --region "$REGION" \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs' \
        --output table
}

# Function to test replication agent installation
test_agent_installation() {
    echo -e "${YELLOW}🧪 Testing replication agent installation...${NC}"
    
    local document_name="${STACK_NAME}-InstallReplicationAgent"
    
    echo "Sending installation command to instance $INSTANCE_ID..."
    
    local command_id=$(aws ssm send-command \
        --region "$REGION" \
        --instance-ids "$INSTANCE_ID" \
        --document-name "$document_name" \
        --parameters \
            region="$REGION" \
            accessKeyId="$AWS_ACCESS_KEY_ID" \
            secretAccessKey="$AWS_SECRET_ACCESS_KEY" \
        --query 'Command.CommandId' \
        --output text)
    
    echo "Command ID: $command_id"
    echo "Monitoring command execution..."
    
    # Monitor command execution
    local timeout=600  # 10 minutes
    local start_time=$(date +%s)
    
    while true; do
        local status=$(aws ssm list-command-invocations \
            --region "$REGION" \
            --command-id "$command_id" \
            --details \
            --query 'CommandInvocations[0].Status' \
            --output text 2>/dev/null || echo "Unknown")
        
        echo "Command Status: $status"
        
        case "$status" in
            "Success")
                echo -e "${GREEN}✅ Agent installation completed successfully${NC}"
                get_command_output "$command_id"
                return 0
                ;;
            "Failed"|"Cancelled"|"TimedOut")
                echo -e "${RED}❌ Agent installation failed with status: $status${NC}"
                get_command_output "$command_id"
                return 1
                ;;
            "InProgress")
                echo "Installation in progress..."
                ;;
            *)
                echo "Waiting for command to start..."
                ;;
        esac
        
        # Check timeout
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        if [ $elapsed -gt $timeout ]; then
            echo -e "${RED}❌ Command timed out after $timeout seconds${NC}"
            return 1
        fi
        
        sleep 30
    done
}

# Function to get command output
get_command_output() {
    local command_id="$1"
    
    echo -e "${YELLOW}📋 Command output:${NC}"
    
    aws ssm get-command-invocation \
        --region "$REGION" \
        --command-id "$command_id" \
        --instance-id "$INSTANCE_ID" \
        --query '{Status:Status,Output:StandardOutputContent,Error:StandardErrorContent}' \
        --output table
}

# Function to verify Service Catalog App Registry association
verify_app_registry() {
    echo -e "${YELLOW}🔍 Verifying Service Catalog App Registry association...${NC}"
    
    local stack_arn="arn:aws:cloudformation:${REGION}:${ACCOUNT_ID}:stack/${STACK_NAME}/"
    
    aws servicecatalog-appregistry list-associated-resources \
        --application "$APPLICATION_ID" \
        --query 'Resources[?ResourceArn==`'"$stack_arn"'`]' \
        --output table
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ App Registry association verified${NC}"
    else
        echo -e "${YELLOW}⚠️ App Registry association not found${NC}"
    fi
}

# Function to show deployment summary
show_deployment_summary() {
    echo -e "${BLUE}📊 Deployment Summary${NC}"
    echo "===================="
    echo
    echo "Stack Name: $STACK_NAME"
    echo "Region: $REGION"
    echo "Status: $(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text)"
    echo "Creation Time: $(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query 'Stacks[0].CreationTime' --output text)"
    echo
    echo "Resources Created:"
    echo "- IAM Role for Application Migration Service"
    echo "- SSM Document for replication agent installation"
    echo "- CloudWatch Log Group and Alarms"
    echo "- Lambda function for automated remediation"
    echo "- EC2 Launch Template for migration targets"
    echo "- Security Group for migrated instances"
    echo "- Service Catalog App Registry association"
    echo
    echo "Next Steps:"
    echo "1. Verify replication agent installation"
    echo "2. Configure replication settings in AWS Console"
    echo "3. Launch test instances"
    echo "4. Perform migration cutover"
    echo
}

# Function to cleanup stack
cleanup_stack() {
    echo -e "${YELLOW}🧹 Cleaning up CloudFormation stack...${NC}"
    
    read -p "Are you sure you want to delete the stack? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        aws cloudformation delete-stack \
            --region "$REGION" \
            --stack-name "$STACK_NAME"
        
        echo "Stack deletion initiated. Monitoring progress..."
        
        while true; do
            local status=$(aws cloudformation describe-stacks \
                --region "$REGION" \
                --stack-name "$STACK_NAME" \
                --query 'Stacks[0].StackStatus' \
                --output text 2>/dev/null || echo "DELETE_COMPLETE")
            
            if [ "$status" = "DELETE_COMPLETE" ]; then
                echo -e "${GREEN}✅ Stack deleted successfully${NC}"
                break
            elif [ "$status" = "DELETE_FAILED" ]; then
                echo -e "${RED}❌ Stack deletion failed${NC}"
                break
            else
                echo "Status: $status"
                sleep 30
            fi
        done
    else
        echo "Stack deletion cancelled"
    fi
}

# Main function
main() {
    case "${1:-deploy}" in
        "deploy")
            validate_template
            deploy_stack
            wait_for_stack
            get_stack_outputs
            verify_app_registry
            show_deployment_summary
            ;;
        "test")
            test_agent_installation
            ;;
        "outputs")
            get_stack_outputs
            ;;
        "events")
            get_stack_events
            ;;
        "status")
            aws cloudformation describe-stacks \
                --region "$REGION" \
                --stack-name "$STACK_NAME" \
                --query 'Stacks[0].{Name:StackName,Status:StackStatus,CreationTime:CreationTime}' \
                --output table
            ;;
        "verify")
            verify_app_registry
            ;;
        "cleanup")
            cleanup_stack
            ;;
        "help"|"--help")
            echo "Usage: $0 [deploy|test|outputs|events|status|verify|cleanup|help]"
            echo
            echo "Commands:"
            echo "  deploy   - Deploy the CloudFormation stack (default)"
            echo "  test     - Test replication agent installation"
            echo "  outputs  - Show stack outputs"
            echo "  events   - Show recent stack events"
            echo "  status   - Show stack status"
            echo "  verify   - Verify App Registry association"
            echo "  cleanup  - Delete the stack"
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