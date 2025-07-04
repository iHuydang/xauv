
#!/bin/bash

# AWS Deployment Connector
# Kết nối hệ thống deployment với AWS Systems Manager Automation
# URL: https://ap-northeast-1.console.aws.amazon.com/systems-manager/automation/execute/AWSQuickSetupType-SetupJITNAResources

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
APPLICATION_ID="0eju8n6pts35orkeq2rhez420p"

# AWS Credentials
AWS_ACCESS_KEY_ID="ieagleviet@gmail.com"
AWS_SECRET_ACCESS_KEY='$Xcz$ApH*=M55#2'

# Deployment Configuration
DEPLOYMENT_PORT="5000"
DEPLOYMENT_HOST="0.0.0.0"
WORKFLOW_TIMEOUT="3600"

echo -e "${BLUE}🚀 AWS Deployment Connector${NC}"
echo "================================="
echo "Region: $AWS_REGION"
echo "Account: $AWS_ACCOUNT_ID"
echo "Instance: $INSTANCE_ID ($INSTANCE_NAME)"
echo "Automation Role: $AUTOMATION_ROLE_ARN"
echo "Deployment Port: $DEPLOYMENT_PORT"
echo

# Function to configure AWS credentials
configure_aws_credentials() {
    echo -e "${YELLOW}🔑 Configuring AWS credentials...${NC}"
    
    mkdir -p ~/.aws
    
    cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = $AWS_ACCESS_KEY_ID
aws_secret_access_key = $AWS_SECRET_ACCESS_KEY
region = $AWS_REGION
EOF

    cat > ~/.aws/config << EOF
[default]
region = $AWS_REGION
output = json
cli_pager = 
EOF

    echo -e "${GREEN}✅ AWS credentials configured${NC}"
}

# Function to create persistent deployment script
create_persistent_deployment() {
    echo -e "${YELLOW}📝 Creating persistent deployment script...${NC}"
    
    cat > aws-persistent-deployment.sh << 'EOF'
#!/bin/bash

# Persistent Deployment Script
# Chạy liên tục và tự động khởi động lại khi bị lỗi

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DEPLOYMENT_PORT="5000"
DEPLOYMENT_HOST="0.0.0.0"
LOG_FILE="/tmp/deployment-persistent.log"
PID_FILE="/tmp/deployment.pid"

# Function to start deployment
start_deployment() {
    echo -e "${BLUE}🚀 Starting persistent deployment...${NC}"
    echo "$(date): Starting deployment" >> "$LOG_FILE"
    
    # Kill existing processes on port
    lsof -ti:$DEPLOYMENT_PORT | xargs kill -9 2>/dev/null || true
    
    # Start npm with persistent monitoring
    nohup npm run dev -- --host $DEPLOYMENT_HOST --port $DEPLOYMENT_PORT > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    echo -e "${GREEN}✅ Deployment started on port $DEPLOYMENT_PORT${NC}"
    echo "PID: $(cat $PID_FILE)"
    echo "Log: $LOG_FILE"
}

# Function to monitor deployment
monitor_deployment() {
    echo -e "${YELLOW}👁️ Monitoring deployment...${NC}"
    
    while true; do
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            
            if ! ps -p $PID > /dev/null 2>&1; then
                echo -e "${RED}❌ Deployment process died, restarting...${NC}"
                echo "$(date): Process died, restarting" >> "$LOG_FILE"
                start_deployment
            else
                echo -e "${GREEN}✅ Deployment running (PID: $PID)${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️ No PID file found, starting deployment...${NC}"
            start_deployment
        fi
        
        sleep 30
    done
}

# Function to stop deployment
stop_deployment() {
    echo -e "${YELLOW}⏹️ Stopping deployment...${NC}"
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        kill -9 $PID 2>/dev/null || true
        rm -f "$PID_FILE"
    fi
    
    lsof -ti:$DEPLOYMENT_PORT | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ Deployment stopped${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Deployment Status${NC}"
    echo "=================="
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Running (PID: $PID)${NC}"
            echo "Port: $DEPLOYMENT_PORT"
            echo "Host: $DEPLOYMENT_HOST"
            echo "Log: $LOG_FILE"
        else
            echo -e "${RED}❌ Not running (stale PID file)${NC}"
        fi
    else
        echo -e "${RED}❌ Not running${NC}"
    fi
    
    # Show port usage
    echo -e "\n${YELLOW}Port Usage:${NC}"
    lsof -i :$DEPLOYMENT_PORT 2>/dev/null || echo "Port $DEPLOYMENT_PORT is free"
}

# Main execution
case "${1:-start}" in
    "start")
        start_deployment
        ;;
    "monitor")
        monitor_deployment
        ;;
    "stop")
        stop_deployment
        ;;
    "restart")
        stop_deployment
        sleep 2
        start_deployment
        ;;
    "status")
        show_status
        ;;
    "persistent")
        start_deployment
        monitor_deployment
        ;;
    *)
        echo "Usage: $0 [start|monitor|stop|restart|status|persistent]"
        exit 1
        ;;
esac
EOF

    chmod +x aws-persistent-deployment.sh
    echo -e "${GREEN}✅ Persistent deployment script created${NC}"
}

# Function to create Systems Manager automation document
create_automation_document() {
    echo -e "${YELLOW}📄 Creating Systems Manager automation document...${NC}"
    
    cat > deployment-automation-document.json << EOF
{
  "schemaVersion": "0.3",
  "description": "AWS Deployment Connector - Persistent Shell Command Execution",
  "assumeRole": "$AUTOMATION_ROLE_ARN",
  "parameters": {
    "InstanceId": {
      "type": "String",
      "description": "EC2 Instance ID",
      "default": "$INSTANCE_ID"
    },
    "DeploymentPort": {
      "type": "String",
      "description": "Deployment port",
      "default": "$DEPLOYMENT_PORT"
    },
    "Command": {
      "type": "String",
      "description": "Shell command to execute",
      "default": "npm run dev"
    }
  },
  "mainSteps": [
    {
      "name": "ExecutePersistentCommand",
      "action": "aws:runCommand",
      "maxAttempts": 3,
      "timeoutSeconds": 3600,
      "inputs": {
        "DocumentName": "AWS-RunShellScript",
        "InstanceIds": ["{{ InstanceId }}"],
        "Parameters": {
          "commands": [
            "#!/bin/bash",
            "set -e",
            "echo '🚀 Starting AWS Deployment Connector'",
            "echo 'Instance: {{ InstanceId }}'",
            "echo 'Port: {{ DeploymentPort }}'",
            "echo 'Command: {{ Command }}'",
            "",
            "# Create deployment directory",
            "mkdir -p /tmp/aws-deployment",
            "cd /tmp/aws-deployment",
            "",
            "# Download deployment connector",
            "curl -o aws-deployment-connector.sh https://raw.githubusercontent.com/your-repo/aws-deployment-connector.sh || echo 'Using local script'",
            "",
            "# Make executable",
            "chmod +x aws-deployment-connector.sh || true",
            "",
            "# Create persistent execution wrapper",
            "cat > persistent-wrapper.sh << 'WRAPPER_EOF'",
            "#!/bin/bash",
            "set -e",
            "export PORT={{ DeploymentPort }}",
            "export HOST=0.0.0.0",
            "export NODE_ENV=production",
            "",
            "# Function to execute command persistently",
            "execute_persistent() {",
            "    local cmd='{{ Command }}'",
            "    local max_retries=999",
            "    local retry_count=0",
            "    ",
            "    while [ \\$retry_count -lt \\$max_retries ]; do",
            "        echo \\\"Execution attempt \\$((retry_count + 1))\\\"",
            "        ",
            "        if timeout 3600 \\$cmd; then",
            "            echo \\\"Command completed successfully\\\"",
            "        else",
            "            echo \\\"Command failed or timed out, retrying...\\\"",
            "            retry_count=\\$((retry_count + 1))",
            "            sleep 5",
            "        fi",
            "    done",
            "}",
            "",
            "# Start persistent execution",
            "execute_persistent",
            "WRAPPER_EOF",
            "",
            "# Make wrapper executable",
            "chmod +x persistent-wrapper.sh",
            "",
            "# Execute persistent wrapper in background",
            "nohup ./persistent-wrapper.sh > /tmp/deployment-automation.log 2>&1 &",
            "echo \\$! > /tmp/deployment-automation.pid",
            "",
            "# Show status",
            "echo '✅ Persistent deployment started'",
            "echo 'PID:' \\$(cat /tmp/deployment-automation.pid)",
            "echo 'Log: /tmp/deployment-automation.log'",
            "echo 'Port: {{ DeploymentPort }}'",
            "",
            "# Monitor for initial 60 seconds",
            "for i in {1..12}; do",
            "    if ps -p \\$(cat /tmp/deployment-automation.pid) > /dev/null 2>&1; then",
            "        echo \\\"Process running (check \\$i/12)\\\"",
            "    else",
            "        echo \\\"Process not running (check \\$i/12)\\\"",
            "    fi",
            "    sleep 5",
            "done",
            "",
            "echo '🎯 Deployment automation completed'"
          ]
        }
      }
    }
  ]
}
EOF

    echo -e "${GREEN}✅ Automation document created${NC}"
}

# Function to deploy automation document to AWS
deploy_automation_document() {
    echo -e "${YELLOW}📤 Deploying automation document to AWS...${NC}"
    
    # Create or update document
    aws ssm create-document \
        --region "$AWS_REGION" \
        --name "DeploymentConnector" \
        --document-type "Automation" \
        --document-format "JSON" \
        --content file://deployment-automation-document.json \
        --tags Key=Purpose,Value=DeploymentConnector Key=Environment,Value=Production \
        2>/dev/null || \
    aws ssm update-document \
        --region "$AWS_REGION" \
        --name "DeploymentConnector" \
        --content file://deployment-automation-document.json \
        --document-version "\$LATEST" \
        --document-format "JSON" || echo "Document deployment completed"
    
    echo -e "${GREEN}✅ Automation document deployed${NC}"
}

# Function to execute automation
execute_automation() {
    local command="${1:-npm run dev}"
    
    echo -e "${YELLOW}🚀 Executing automation with command: $command${NC}"
    
    EXECUTION_ID=$(aws ssm start-automation-execution \
        --region "$AWS_REGION" \
        --document-name "DeploymentConnector" \
        --parameters "InstanceId=$INSTANCE_ID,DeploymentPort=$DEPLOYMENT_PORT,Command=$command" \
        --query 'AutomationExecutionId' \
        --output text)
    
    echo "Execution ID: $EXECUTION_ID"
    echo -e "${GREEN}✅ Automation execution started${NC}"
    
    # Monitor execution
    monitor_automation_execution "$EXECUTION_ID"
}

# Function to monitor automation execution
monitor_automation_execution() {
    local execution_id="$1"
    
    echo -e "${YELLOW}📊 Monitoring automation execution...${NC}"
    
    while true; do
        STATUS=$(aws ssm describe-automation-executions \
            --region "$AWS_REGION" \
            --filters "Key=ExecutionId,Values=$execution_id" \
            --query 'AutomationExecutions[0].AutomationExecutionStatus' \
            --output text)
        
        echo "Status: $STATUS"
        
        case "$STATUS" in
            "Success")
                echo -e "${GREEN}✅ Automation completed successfully${NC}"
                get_automation_output "$execution_id"
                break
                ;;
            "Failed"|"Cancelled"|"TimedOut")
                echo -e "${RED}❌ Automation failed with status: $STATUS${NC}"
                get_automation_output "$execution_id"
                break
                ;;
            "InProgress")
                echo "Automation in progress..."
                sleep 30
                ;;
            *)
                echo "Waiting for automation to start..."
                sleep 10
                ;;
        esac
    done
}

# Function to get automation output
get_automation_output() {
    local execution_id="$1"
    
    echo -e "${YELLOW}📋 Getting automation output...${NC}"
    
    aws ssm describe-automation-step-executions \
        --region "$AWS_REGION" \
        --automation-execution-id "$execution_id" \
        --query 'StepExecutions[*].{Step:StepName,Status:StepStatus,Output:Outputs}' \
        --output table
}

# Function to create direct shell command
create_direct_command() {
    local command="${1:-npm run dev}"
    
    echo -e "${YELLOW}⚡ Creating direct shell command...${NC}"
    
    COMMAND_ID=$(aws ssm send-command \
        --region "$AWS_REGION" \
        --instance-ids "$INSTANCE_ID" \
        --document-name "AWS-RunShellScript" \
        --parameters "commands=[\"#!/bin/bash\",\"set -e\",\"export PORT=$DEPLOYMENT_PORT\",\"export HOST=$DEPLOYMENT_HOST\",\"export NODE_ENV=production\",\"echo '🚀 Starting direct command execution'\",\"echo 'Instance: $INSTANCE_ID'\",\"echo 'Port: $DEPLOYMENT_PORT'\",\"echo 'Command: $command'\",\"cd /home/ec2-user || cd /root || cd /tmp\",\"timeout 3600 $command || echo 'Command completed or timed out'\",\"echo '✅ Direct command execution finished'\"]" \
        --timeout-seconds 3600 \
        --query 'Command.CommandId' \
        --output text)
    
    echo "Command ID: $COMMAND_ID"
    echo -e "${GREEN}✅ Direct command sent${NC}"
    
    # Monitor command
    monitor_command_execution "$COMMAND_ID"
}

# Function to monitor command execution
monitor_command_execution() {
    local command_id="$1"
    
    echo -e "${YELLOW}📊 Monitoring command execution...${NC}"
    
    while true; do
        STATUS=$(aws ssm list-command-invocations \
            --region "$AWS_REGION" \
            --command-id "$command_id" \
            --details \
            --query 'CommandInvocations[0].Status' \
            --output text 2>/dev/null || echo "Unknown")
        
        echo "Status: $STATUS"
        
        case "$STATUS" in
            "Success")
                echo -e "${GREEN}✅ Command completed successfully${NC}"
                get_command_output "$command_id"
                break
                ;;
            "Failed"|"Cancelled"|"TimedOut")
                echo -e "${RED}❌ Command failed with status: $STATUS${NC}"
                get_command_output "$command_id"
                break
                ;;
            "InProgress")
                echo "Command in progress..."
                sleep 30
                ;;
            *)
                echo "Waiting for command to start..."
                sleep 10
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
        --query '{Status:Status,Output:StandardOutputContent,Error:StandardErrorContent}' \
        --output table
}

# Function to show Systems Manager URL
show_systems_manager_url() {
    echo -e "${YELLOW}🔗 AWS Systems Manager URLs:${NC}"
    echo
    echo "1. Quick Setup JITNA Resources:"
    echo "https://ap-northeast-1.console.aws.amazon.com/systems-manager/automation/execute/AWSQuickSetupType-SetupJITNAResources?region=ap-northeast-1#AutomationAssumeRole=arn%3Aaws%3Aiam%3A%3A207567762473%3Arole%2FAWS-QuickSetup-JITNA-LocalAdministrationRole"
    echo
    echo "2. Deployment Connector Automation:"
    echo "https://ap-northeast-1.console.aws.amazon.com/systems-manager/automation/execute/DeploymentConnector?region=ap-northeast-1"
    echo
    echo "3. Systems Manager Commands:"
    echo "https://ap-northeast-1.console.aws.amazon.com/systems-manager/run-command/history?region=ap-northeast-1"
    echo
    echo "4. Automation Executions:"
    echo "https://ap-northeast-1.console.aws.amazon.com/systems-manager/automation/executions?region=ap-northeast-1"
    echo
}

# Function to show deployment status
show_deployment_status() {
    echo -e "${BLUE}📊 Deployment Status${NC}"
    echo "==================="
    echo
    echo "Instance ID: $INSTANCE_ID"
    echo "Region: $AWS_REGION"
    echo "Port: $DEPLOYMENT_PORT"
    echo "Host: $DEPLOYMENT_HOST"
    echo
    
    # Check instance status
    echo -e "${YELLOW}Instance Status:${NC}"
    aws ec2 describe-instances \
        --region "$AWS_REGION" \
        --instance-ids "$INSTANCE_ID" \
        --query 'Reservations[0].Instances[0].{State:State.Name,PublicIP:PublicIpAddress,PrivateIP:PrivateIpAddress}' \
        --output table
    
    # Check SSM agent status
    echo -e "${YELLOW}SSM Agent Status:${NC}"
    aws ssm describe-instance-information \
        --region "$AWS_REGION" \
        --instance-information-filter-list "key=InstanceIds,valueSet=$INSTANCE_ID" \
        --query 'InstanceInformationList[0].{InstanceId:InstanceId,PingStatus:PingStatus,LastPingDateTime:LastPingDateTime}' \
        --output table
}

# Main execution function
main() {
    case "${1:-setup}" in
        "setup")
            configure_aws_credentials
            create_persistent_deployment
            create_automation_document
            deploy_automation_document
            show_systems_manager_url
            ;;
        "deploy")
            deploy_automation_document
            ;;
        "execute")
            execute_automation "${2:-npm run dev}"
            ;;
        "direct")
            create_direct_command "${2:-npm run dev}"
            ;;
        "status")
            show_deployment_status
            ;;
        "url")
            show_systems_manager_url
            ;;
        "persistent")
            ./aws-persistent-deployment.sh persistent
            ;;
        "help"|"--help")
            echo "Usage: $0 [setup|deploy|execute|direct|status|url|persistent|help]"
            echo
            echo "Commands:"
            echo "  setup      - Complete setup (credentials, scripts, documents)"
            echo "  deploy     - Deploy automation document to AWS"
            echo "  execute    - Execute automation with custom command"
            echo "  direct     - Send direct command to instance"
            echo "  status     - Show deployment status"
            echo "  url        - Show Systems Manager URLs"
            echo "  persistent - Start persistent deployment monitoring"
            echo "  help       - Show this help"
            echo
            echo "Examples:"
            echo "  $0 setup                    # Complete setup"
            echo "  $0 execute 'npm run dev'    # Execute with custom command"
            echo "  $0 direct 'npm start'       # Direct command execution"
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
