
#!/bin/bash

# Workflow AWS Integration
# Tích hợp workflow với AWS Systems Manager để tránh bị tắt

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION="ap-northeast-1"
INSTANCE_ID="i-05c4d8f39e43b8280"
DEPLOYMENT_PORT="5000"

echo -e "${BLUE}🔄 Workflow AWS Integration${NC}"
echo "============================"

# Function to start workflow with AWS monitoring
start_workflow_with_monitoring() {
    echo -e "${YELLOW}🚀 Starting workflow with AWS monitoring...${NC}"
    
    # Create monitoring script
    cat > workflow-monitor.sh << 'EOF'
#!/bin/bash

# Workflow Monitor
# Giám sát và khởi động lại workflow khi cần thiết

DEPLOYMENT_PORT="5000"
WORKFLOW_PID=""
MONITOR_LOG="/tmp/workflow-monitor.log"

# Function to start workflow
start_workflow() {
    echo "$(date): Starting workflow" >> "$MONITOR_LOG"
    
    # Kill existing processes
    lsof -ti:$DEPLOYMENT_PORT | xargs kill -9 2>/dev/null || true
    
    # Start npm dev
    nohup npm run dev > /tmp/workflow-output.log 2>&1 &
    WORKFLOW_PID=$!
    echo $WORKFLOW_PID > /tmp/workflow.pid
    
    echo "$(date): Workflow started with PID $WORKFLOW_PID" >> "$MONITOR_LOG"
}

# Function to monitor workflow
monitor_workflow() {
    while true; do
        if [ -f "/tmp/workflow.pid" ]; then
            PID=$(cat /tmp/workflow.pid)
            
            if ! ps -p $PID > /dev/null 2>&1; then
                echo "$(date): Workflow died, restarting..." >> "$MONITOR_LOG"
                start_workflow
            else
                echo "$(date): Workflow running (PID: $PID)" >> "$MONITOR_LOG"
            fi
        else
            echo "$(date): No workflow PID found, starting..." >> "$MONITOR_LOG"
            start_workflow
        fi
        
        sleep 30
    done
}

# Start monitoring
start_workflow
monitor_workflow
EOF

    chmod +x workflow-monitor.sh
    
    # Start workflow monitor in background
    nohup ./workflow-monitor.sh > /tmp/workflow-monitor-output.log 2>&1 &
    echo $! > /tmp/workflow-monitor.pid
    
    echo -e "${GREEN}✅ Workflow monitoring started${NC}"
    echo "Monitor PID: $(cat /tmp/workflow-monitor.pid)"
    echo "Monitor Log: /tmp/workflow-monitor.log"
    echo "Workflow Log: /tmp/workflow-output.log"
}

# Function to send to AWS Systems Manager
send_to_aws_systems_manager() {
    echo -e "${YELLOW}📤 Sending workflow to AWS Systems Manager...${NC}"
    
    # Create command for Systems Manager
    aws ssm send-command \
        --region "$AWS_REGION" \
        --instance-ids "$INSTANCE_ID" \
        --document-name "AWS-RunShellScript" \
        --parameters 'commands=["#!/bin/bash","set -e","echo \"🚀 AWS Systems Manager Workflow Execution\"","export PORT=5000","export HOST=0.0.0.0","cd /home/ec2-user || cd /root || cd /tmp","echo \"Starting persistent npm dev...\"","nohup npm run dev > /tmp/aws-workflow.log 2>&1 &","echo $! > /tmp/aws-workflow.pid","echo \"✅ Workflow started via AWS Systems Manager\"","echo \"PID: $(cat /tmp/aws-workflow.pid)\"","echo \"Log: /tmp/aws-workflow.log\"","echo \"Port: 5000\""]' \
        --timeout-seconds 3600 \
        --query 'Command.CommandId' \
        --output text > /tmp/aws-command-id.txt
    
    local command_id=$(cat /tmp/aws-command-id.txt)
    echo "AWS Command ID: $command_id"
    echo -e "${GREEN}✅ Workflow sent to AWS Systems Manager${NC}"
    
    # Monitor AWS command
    monitor_aws_command "$command_id"
}

# Function to monitor AWS command
monitor_aws_command() {
    local command_id="$1"
    
    echo -e "${YELLOW}📊 Monitoring AWS command...${NC}"
    
    for i in {1..10}; do
        STATUS=$(aws ssm list-command-invocations \
            --region "$AWS_REGION" \
            --command-id "$command_id" \
            --details \
            --query 'CommandInvocations[0].Status' \
            --output text 2>/dev/null || echo "Unknown")
        
        echo "Status: $STATUS (check $i/10)"
        
        case "$STATUS" in
            "Success")
                echo -e "${GREEN}✅ AWS command completed successfully${NC}"
                get_aws_command_output "$command_id"
                break
                ;;
            "Failed"|"Cancelled"|"TimedOut")
                echo -e "${RED}❌ AWS command failed: $STATUS${NC}"
                get_aws_command_output "$command_id"
                break
                ;;
            "InProgress")
                echo "AWS command in progress..."
                ;;
            *)
                echo "Waiting for AWS command..."
                ;;
        esac
        
        sleep 30
    done
}

# Function to get AWS command output
get_aws_command_output() {
    local command_id="$1"
    
    echo -e "${YELLOW}📋 AWS Command Output:${NC}"
    
    aws ssm get-command-invocation \
        --region "$AWS_REGION" \
        --command-id "$command_id" \
        --instance-id "$INSTANCE_ID" \
        --query '{Status:Status,Output:StandardOutputContent,Error:StandardErrorContent}' \
        --output table
}

# Function to create hybrid workflow
create_hybrid_workflow() {
    echo -e "${YELLOW}🔄 Creating hybrid workflow (Local + AWS)...${NC}"
    
    # Start local monitoring
    start_workflow_with_monitoring
    
    # Wait a bit
    sleep 10
    
    # Send to AWS as backup
    send_to_aws_systems_manager
    
    echo -e "${GREEN}✅ Hybrid workflow created${NC}"
    echo "Local workflow monitoring: Active"
    echo "AWS Systems Manager backup: Active"
}

# Function to check status
check_status() {
    echo -e "${BLUE}📊 Workflow Status${NC}"
    echo "=================="
    
    # Check local workflow
    echo -e "${YELLOW}Local Workflow:${NC}"
    if [ -f "/tmp/workflow.pid" ]; then
        PID=$(cat /tmp/workflow.pid)
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Running (PID: $PID)${NC}"
        else
            echo -e "${RED}❌ Not running${NC}"
        fi
    else
        echo -e "${RED}❌ No PID file${NC}"
    fi
    
    # Check monitor
    echo -e "${YELLOW}Workflow Monitor:${NC}"
    if [ -f "/tmp/workflow-monitor.pid" ]; then
        MONITOR_PID=$(cat /tmp/workflow-monitor.pid)
        if ps -p $MONITOR_PID > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Running (PID: $MONITOR_PID)${NC}"
        else
            echo -e "${RED}❌ Not running${NC}"
        fi
    else
        echo -e "${RED}❌ No monitor PID file${NC}"
    fi
    
    # Check port
    echo -e "${YELLOW}Port $DEPLOYMENT_PORT:${NC}"
    if lsof -i :$DEPLOYMENT_PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✅ In use${NC}"
        lsof -i :$DEPLOYMENT_PORT
    else
        echo -e "${RED}❌ Free${NC}"
    fi
}

# Function to stop all
stop_all() {
    echo -e "${YELLOW}⏹️ Stopping all workflows...${NC}"
    
    # Stop local workflow
    if [ -f "/tmp/workflow.pid" ]; then
        PID=$(cat /tmp/workflow.pid)
        kill -9 $PID 2>/dev/null || true
        rm -f /tmp/workflow.pid
    fi
    
    # Stop monitor
    if [ -f "/tmp/workflow-monitor.pid" ]; then
        MONITOR_PID=$(cat /tmp/workflow-monitor.pid)
        kill -9 $MONITOR_PID 2>/dev/null || true
        rm -f /tmp/workflow-monitor.pid
    fi
    
    # Kill port processes
    lsof -ti:$DEPLOYMENT_PORT | xargs kill -9 2>/dev/null || true
    
    echo -e "${GREEN}✅ All workflows stopped${NC}"
}

# Main execution
case "${1:-hybrid}" in
    "local")
        start_workflow_with_monitoring
        ;;
    "aws")
        send_to_aws_systems_manager
        ;;
    "hybrid")
        create_hybrid_workflow
        ;;
    "status")
        check_status
        ;;
    "stop")
        stop_all
        ;;
    "help"|"--help")
        echo "Usage: $0 [local|aws|hybrid|status|stop|help]"
        echo
        echo "Commands:"
        echo "  local    - Start local workflow monitoring"
        echo "  aws      - Send workflow to AWS Systems Manager"
        echo "  hybrid   - Create hybrid workflow (local + AWS)"
        echo "  status   - Check workflow status"
        echo "  stop     - Stop all workflows"
        echo "  help     - Show this help"
        ;;
    *)
        echo -e "${RED}❌ Invalid command: $1${NC}"
        echo "Use: $0 help for available commands"
        exit 1
        ;;
esac
