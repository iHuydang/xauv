#!/bin/bash

# Quick Vietnam Gold Scan - Các lệnh quét nhanh vàng Việt Nam
# Sử dụng: ./quick-gold-scan.sh [command]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE="http://localhost:5000"

echo -e "${BLUE}🇻🇳 VIETNAM GOLD QUICK SCANNER${NC}"
echo "================================"

case "${1:-scan}" in
    "scan"|"s")
        echo -e "${GREEN}🚀 Quét áp lực vàng với USD/VND...${NC}"
        python3 scripts/vietnam-gold-pressure-scanner.py full
        ;;
    
    "quick"|"q")
        echo -e "${YELLOW}⚡ Quét nhanh tỷ giá...${NC}"
        python3 scripts/vietnam-gold-pressure-scanner.py quick
        ;;
    
    "attack"|"a")
        echo -e "${RED}💥 Tấn công áp lực SJC...${NC}"
        curl -X POST "$API_BASE/api/vietnam-gold/pressure-attack" \
            -H "Content-Type: application/json" \
            -d '{"targets":["SJC","DOJI"],"intensity":"high","duration":300}'
        ;;
    
    "prices"|"p")
        echo -e "${BLUE}💰 Lấy giá vàng hiện tại...${NC}"
        curl -s "$API_BASE/api/vietnam-gold/prices" | jq '.data.prices[] | {source, buy, sell, spread}'
        ;;
    
    "vuln"|"v")
        echo -e "${PURPLE}🔍 Phân tích vulnerability...${NC}"
        curl -s "$API_BASE/api/vietnam-gold/vulnerability-analysis" | jq '.data.analysis[]'
        ;;
    
    *)
        echo "Sử dụng:"
        echo "  ./quick-gold-scan.sh scan    - Quét áp lực toàn diện"
        echo "  ./quick-gold-scan.sh quick   - Quét nhanh tỷ giá"
        echo "  ./quick-gold-scan.sh attack  - Tấn công áp lực SJC"
        echo "  ./quick-gold-scan.sh prices  - Lấy giá vàng"
        echo "  ./quick-gold-scan.sh vuln    - Phân tích vulnerability"
        ;;
esac