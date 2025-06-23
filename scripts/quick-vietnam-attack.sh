
#!/bin/bash

# Quick Vietnam Gold Attack Script
# Script tấn công nhanh vàng Việt Nam

API_BASE="http://localhost:5000"

# Màu sắc
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}🚨 TẤN CÔNG NHANH VÀNG VIỆT NAM${NC}"

# 1. Tấn công SJC cường độ cao
echo -e "${YELLOW}⚔️ Tấn công SJC...${NC}"
curl -X POST "$API_BASE/api/attack/sjc-pressure" \
    -H "Content-Type: application/json" \
    -d '{
        "intensity": "HIGH",
        "duration": 300,
        "vector": "HF_SPREAD_PRESSURE"
    }' | jq '.'

sleep 2

# 2. Quét thanh khoản
echo -e "${YELLOW}🔍 Quét thanh khoản...${NC}"
curl -X GET "$API_BASE/api/liquidity/scan" | jq '.summary'

sleep 2

# 3. Tấn công vàng thế giới
echo -e "${YELLOW}🌍 Tấn công vàng thế giới...${NC}"
curl -X POST "$API_BASE/api/world-gold/attack" \
    -H "Content-Type: application/json" \
    -d '{
        "vector": "SPOT_PRESSURE",
        "intensity": "HIGH"
    }' | jq '.'

sleep 2

# 4. Kiểm tra kết quả
echo -e "${GREEN}📊 Kết quả tấn công:${NC}"
curl -X GET "$API_BASE/api/attack/status" | jq '.'

echo -e "${GREEN}✅ Tấn công nhanh hoàn thành!${NC}"
