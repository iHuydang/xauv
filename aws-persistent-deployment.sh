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
