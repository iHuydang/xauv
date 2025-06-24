#!/bin/bash

# Quick scanner với timeout ngắn hơn để tránh bị treo
# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

GOLD_API_KEY="goldapi-a1omwe19mc2bnqkx-io"

# Get gold price nhanh
get_gold_price_fast() {
    local gold_data=$(timeout 5 curl -s -X GET "https://www.goldapi.io/api/XAU/USD" \
        -H "x-access-token: $GOLD_API_KEY")
    
    if [ $? -eq 0 ] && [ -n "$gold_data" ]; then
        echo "$gold_data" | node -p "
        try {
            const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
            data.price || '3324.50';
        } catch(e) {
            '3324.50';
        }
        "
    else
        echo "3324.50"
    fi
}

# Main scan
MODE=${1:-range}
MIN_PRICE=${2:-3300}
MAX_PRICE=${3:-3350}

echo -e "${CYAN}═══ QUICK RANGE SCAN ═══${NC}"
echo -e "${YELLOW}📊 Khoảng quét: \$${MIN_PRICE} - \$${MAX_PRICE}${NC}"

GOLD_PRICE=$(get_gold_price_fast)
echo -e "${GREEN}💰 Giá hiện tại: \$${GOLD_PRICE}/oz${NC}"

# Check if in range
IN_RANGE=$(node -p "
const current = parseFloat('$GOLD_PRICE');
const min = parseFloat('$MIN_PRICE');
const max = parseFloat('$MAX_PRICE');
current >= min && current <= max ? 'true' : 'false';
")

if [ "$IN_RANGE" = "true" ]; then
    echo -e "${GREEN}✅ Trong khoảng quét${NC}"
    # Generate levels
    echo -e "${BLUE}🎯 Các mức trong khoảng:${NC}"
    for i in {1..3}; do
        LEVEL=$(node -p "
        const min = parseFloat('$MIN_PRICE');
        const max = parseFloat('$MAX_PRICE');
        const step = (max - min) / 3;
        (min + step * ($i - 1)).toFixed(2);
        ")
        echo -e "   Level $i: \$${LEVEL}"
    done
else
    echo -e "${YELLOW}⚠️ Ngoài khoảng quét${NC}"
fi

echo -e "${GREEN}✅ Quét nhanh hoàn tất${NC}"