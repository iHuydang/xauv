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
