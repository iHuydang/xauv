
#!/bin/bash

# =============================================================================
# HƯỚNG DẪN SỬ DỤNG CÁC LỆNH SHELL ĐĂNG TIN TỨC THỊ TRƯỜNG
# =============================================================================

# Màu sắc cho terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Server URL
API_URL="http://localhost:5000/api/market-news"

# =============================================================================
# 1. LỆNH ĐĂNG TIN TỨC CƠ BẢN
# =============================================================================

post_basic_news() {
    local title="$1"
    local content="$2"
    
    echo -e "${GREEN}📰 Đăng tin tức cơ bản...${NC}"
    
    curl -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"$title\",
            \"content\": \"$content\",
            \"category\": \"general\",
            \"impact\": \"medium\",
            \"source\": \"Shell Command\",
            \"symbols\": []
        }" | jq '.'
}

# =============================================================================
# 2. LỆNH ĐĂNG TIN TỨC FOREX
# =============================================================================

post_forex_news() {
    local title="$1"
    local content="$2"
    local impact="${3:-medium}"
    local symbols="${4:-EURUSD,GBPUSD,USDJPY}"
    
    echo -e "${BLUE}💱 Đăng tin tức Forex...${NC}"
    
    curl -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"$title\",
            \"content\": \"$content\",
            \"category\": \"forex\",
            \"impact\": \"$impact\",
            \"source\": \"Forex News\",
            \"symbols\": [$(echo "$symbols" | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')]]
        }" | jq '.'
}

# =============================================================================
# 3. LỆNH ĐĂNG TIN TỨC VÀNG
# =============================================================================

post_gold_news() {
    local title="$1"
    local content="$2"
    local impact="${3:-high}"
    
    echo -e "${YELLOW}🥇 Đăng tin tức vàng...${NC}"
    
    curl -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"$title\",
            \"content\": \"$content\",
            \"category\": \"commodities\",
            \"impact\": \"$impact\",
            \"source\": \"Gold Market\",
            \"symbols\": [\"XAUUSD\", \"XAGUSD\", \"SJC\"]
        }" | jq '.'
}

# =============================================================================
# 4. LỆNH ĐĂNG TIN TỨC CRYPTO
# =============================================================================

post_crypto_news() {
    local title="$1"
    local content="$2"
    local impact="${3:-medium}"
    local symbols="${4:-BTCUSD,ETHUSD,ADAUSD}"
    
    echo -e "${PURPLE}₿ Đăng tin tức Crypto...${NC}"
    
    curl -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"$title\",
            \"content\": \"$content\",
            \"category\": \"crypto\",
            \"impact\": \"$impact\",
            \"source\": \"Crypto News\",
            \"symbols\": [$(echo "$symbols" | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')]]
        }" | jq '.'
}

# =============================================================================
# 5. LỆNH ĐĂNG TIN TỨC KINH TẾ
# =============================================================================

post_economic_news() {
    local title="$1"
    local content="$2"
    local impact="${3:-high}"
    local symbols="${4:-EURUSD,GBPUSD,USDJPY,XAUUSD,US500}"
    
    echo -e "${CYAN}📊 Đăng tin tức kinh tế...${NC}"
    
    curl -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"$title\",
            \"content\": \"$content\",
            \"category\": \"economics\",
            \"impact\": \"$impact\",
            \"source\": \"Economic Calendar\",
            \"symbols\": [$(echo "$symbols" | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')]]
        }" | jq '.'
}

# =============================================================================
# 6. LỆNH ĐĂNG TIN TỨC KHẨN CẤP
# =============================================================================

post_breaking_news() {
    local title="$1"
    local content="$2"
    local symbols="${3:-EURUSD,GBPUSD,USDJPY,XAUUSD}"
    
    echo -e "${RED}🚨 ĐĂNG TIN TỨC KHẨN CẤP...${NC}"
    
    curl -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"🚨 BREAKING: $title\",
            \"content\": \"$content\",
            \"category\": \"breaking\",
            \"impact\": \"very_high\",
            \"source\": \"Breaking News\",
            \"symbols\": [$(echo "$symbols" | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')]]
        }" | jq '.'
}

# =============================================================================
# 7. LỆNH XEM TIN TỨC
# =============================================================================

get_news() {
    echo -e "${GREEN}📋 Lấy danh sách tin tức...${NC}"
    curl -X GET "$API_URL" | jq '.'
}

# =============================================================================
# 8. LỆNH TEST WEBSOCKET
# =============================================================================

test_websocket() {
    echo -e "${BLUE}🔗 Test WebSocket connection...${NC}"
    node -e "
        const WebSocket = require('ws');
        const ws = new WebSocket('ws://localhost:5000');
        
        ws.on('open', () => {
            console.log('✅ WebSocket connected');
            ws.send(JSON.stringify({type: 'ping'}));
        });
        
        ws.on('message', (data) => {
            console.log('📨 Received:', JSON.parse(data));
            ws.close();
        });
        
        ws.on('error', (error) => {
            console.log('❌ Error:', error.message);
        });
    "
}

# =============================================================================
# 9. LỆNH TẠO TIN TỨC MẪU
# =============================================================================

create_sample_news() {
    echo -e "${YELLOW}📰 Tạo tin tức mẫu...${NC}"
    
    post_forex_news \
        "Fed Announces Interest Rate Decision" \
        "The Federal Reserve has decided to maintain interest rates at current levels. This decision comes amid ongoing economic uncertainty and inflation concerns." \
        "high" \
        "EURUSD,GBPUSD,USDJPY"
    
    sleep 2
    
    post_gold_news \
        "Gold Prices Surge on Safe Haven Demand" \
        "Gold prices have risen sharply as investors seek safe haven assets amid global economic uncertainty. Central bank purchases continue to support demand." \
        "high"
    
    sleep 2
    
    post_crypto_news \
        "Bitcoin Breaks Key Resistance Level" \
        "Bitcoin has successfully broken through the $50,000 resistance level with strong volume, indicating potential for further upside movement." \
        "medium" \
        "BTCUSD,ETHUSD"
}

# =============================================================================
# 10. MENU TƯƠNG TÁC
# =============================================================================

interactive_menu() {
    while true; do
        echo -e "\n${CYAN}=== MARKET NEWS POSTING SYSTEM ===${NC}"
        echo -e "${GREEN}1.${NC} Đăng tin tức cơ bản"
        echo -e "${GREEN}2.${NC} Đăng tin tức Forex"
        echo -e "${GREEN}3.${NC} Đăng tin tức Vàng"
        echo -e "${GREEN}4.${NC} Đăng tin tức Crypto"
        echo -e "${GREEN}5.${NC} Đăng tin tức Kinh tế"
        echo -e "${GREEN}6.${NC} Đăng tin khẩn cấp"
        echo -e "${GREEN}7.${NC} Xem tin tức"
        echo -e "${GREEN}8.${NC} Test WebSocket"
        echo -e "${GREEN}9.${NC} Tạo tin mẫu"
        echo -e "${GREEN}0.${NC} Thoát"
        
        read -p "Chọn lựa chọn: " choice
        
        case $choice in
            1)
                read -p "Tiêu đề: " title
                read -p "Nội dung: " content
                post_basic_news "$title" "$content"
                ;;
            2)
                read -p "Tiêu đề: " title
                read -p "Nội dung: " content
                read -p "Tác động (low/medium/high): " impact
                read -p "Symbols (VD: EURUSD,GBPUSD): " symbols
                post_forex_news "$title" "$content" "$impact" "$symbols"
                ;;
            3)
                read -p "Tiêu đề: " title
                read -p "Nội dung: " content
                read -p "Tác động (medium/high): " impact
                post_gold_news "$title" "$content" "$impact"
                ;;
            4)
                read -p "Tiêu đề: " title
                read -p "Nội dung: " content
                read -p "Tác động (low/medium/high): " impact
                read -p "Symbols (VD: BTCUSD,ETHUSD): " symbols
                post_crypto_news "$title" "$content" "$impact" "$symbols"
                ;;
            5)
                read -p "Tiêu đề: " title
                read -p "Nội dung: " content
                read -p "Tác động (medium/high/very_high): " impact
                post_economic_news "$title" "$content" "$impact"
                ;;
            6)
                read -p "Tiêu đề: " title
                read -p "Nội dung: " content
                read -p "Symbols: " symbols
                post_breaking_news "$title" "$content" "$symbols"
                ;;
            7)
                get_news
                ;;
            8)
                test_websocket
                ;;
            9)
                create_sample_news
                ;;
            0)
                echo -e "${GREEN}Tạm biệt!${NC}"
                break
                ;;
            *)
                echo -e "${RED}Lựa chọn không hợp lệ!${NC}"
                ;;
        esac
    done
}

# =============================================================================
# HƯỚNG DẪN SỬ DỤNG
# =============================================================================

show_usage() {
    echo -e "${CYAN}=== HƯỚNG DẪN SỬ DỤNG LỆNH SHELL ===${NC}"
    echo ""
    echo -e "${GREEN}1. Đăng tin cơ bản:${NC}"
    echo "   post_basic_news 'Tiêu đề' 'Nội dung'"
    echo ""
    echo -e "${GREEN}2. Đăng tin Forex:${NC}"
    echo "   post_forex_news 'Tiêu đề' 'Nội dung' 'impact' 'symbols'"
    echo "   VD: post_forex_news 'USD tăng mạnh' 'Đô la Mỹ tăng...' 'high' 'EURUSD,GBPUSD'"
    echo ""
    echo -e "${GREEN}3. Đăng tin Vàng:${NC}"
    echo "   post_gold_news 'Tiêu đề' 'Nội dung' 'impact'"
    echo "   VD: post_gold_news 'Vàng tăng giá' 'Giá vàng SJC...' 'high'"
    echo ""
    echo -e "${GREEN}4. Đăng tin Crypto:${NC}"
    echo "   post_crypto_news 'Tiêu đề' 'Nội dung' 'impact' 'symbols'"
    echo ""
    echo -e "${GREEN}5. Đăng tin Kinh tế:${NC}"
    echo "   post_economic_news 'Tiêu đề' 'Nội dung' 'impact' 'symbols'"
    echo ""
    echo -e "${GREEN}6. Tin khẩn cấp:${NC}"
    echo "   post_breaking_news 'Tiêu đề' 'Nội dung' 'symbols'"
    echo ""
    echo -e "${GREEN}7. Xem tin tức:${NC}"
    echo "   get_news"
    echo ""
    echo -e "${GREEN}8. Test WebSocket:${NC}"
    echo "   test_websocket"
    echo ""
    echo -e "${GREEN}9. Menu tương tác:${NC}"
    echo "   interactive_menu"
    echo ""
}

# Export các function
export -f post_basic_news
export -f post_forex_news
export -f post_gold_news
export -f post_crypto_news
export -f post_economic_news
export -f post_breaking_news
export -f get_news
export -f test_websocket
export -f create_sample_news
export -f interactive_menu
export -f show_usage

# Kiểm tra tham số dòng lệnh
case "${1:-help}" in
    "menu")
        interactive_menu
        ;;
    "usage"|"help")
        show_usage
        ;;
    "sample")
        create_sample_news
        ;;
    "test")
        test_websocket
        ;;
    *)
        show_usage
        ;;
esac
