
#!/bin/bash

# Vietnam Gold Liquidity Attack Commands
# Các lệnh tấn công thanh khoản vàng Việt Nam chuyên dụng

set -e

# Configuration
API_BASE="http://localhost:5000"
GOLD_API_KEY="goldapi-a1omwe19mc2bnqkx-io"
LOG_FILE="vietnam_liquidity_attack.log"
ATTACK_ID=$(date +%s)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_attack() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 1. Lệnh tấn công SJC áp lực cao
attack_sjc_pressure() {
    local intensity=${1:-HIGH}
    local duration=${2:-300}
    
    echo -e "${RED}🚨 TẤN CÔNG ÁP LỰC SJC - Cường độ: $intensity${NC}"
    log_attack "🚨 Khởi chạy tấn công áp lực SJC"
    
    curl -X POST "$API_BASE/api/attack/sjc-pressure" \
        -H "Content-Type: application/json" \
        -d '{
            "intensity": "'$intensity'",
            "duration": '$duration',
            "vector": "HF_SPREAD_PRESSURE",
            "target_spread": 25000,
            "volume_multiplier": 3.5
        }' | jq '.'
}

# 2. Lệnh quét thanh khoản tổng thể
scan_vietnam_liquidity() {
    echo -e "${BLUE}🔍 QUÉT THANH KHOẢN VÀNG VIỆT NAM${NC}"
    log_attack "🔍 Bắt đầu quét thanh khoản"
    
    curl -X GET "$API_BASE/api/liquidity/scan" | jq '.'
    
    # Phân tích kết quả
    echo -e "${YELLOW}📊 Phân tích cơ hội tấn công...${NC}"
    curl -X GET "$API_BASE/api/attack/test-scan" | jq '.'
}

# 3. Lệnh tấn công đa mục tiêu
multi_target_attack() {
    local targets=("SJC" "PNJ" "DOJI" "MIHONG")
    
    echo -e "${PURPLE}🎯 TẤN CÔNG ĐA MỤC TIÊU${NC}"
    log_attack "🎯 Khởi chạy tấn công đa mục tiêu"
    
    for target in "${targets[@]}"; do
        echo -e "${RED}⚔️ Tấn công $target${NC}"
        curl -X POST "$API_BASE/api/attack/vietnam-gold" \
            -H "Content-Type: application/json" \
            -d '{
                "target": "'$target'",
                "intensity": "HIGH",
                "duration": 180,
                "spread_threshold": 35000,
                "volume_multiplier": 2.8,
                "stealth_mode": false
            }' | jq '.'
        sleep 5
    done
}

# 4. Lệnh tấn công thanh khoản bằng chênh lệch giá thế giới
world_price_arbitrage_attack() {
    echo -e "${GREEN}🌍 TẤN CÔNG CHÊNH LỆCH GIÁ THẾ GIỚI${NC}"
    log_attack "🌍 Khởi chạy tấn công chênh lệch giá"
    
    # Lấy giá vàng thế giới
    WORLD_PRICE=$(curl -s -X GET 'https://www.goldapi.io/api/XAU/USD' \
        -H "x-access-token: $GOLD_API_KEY" | jq -r '.price')
    
    echo "💰 Giá vàng thế giới: $WORLD_PRICE USD/oz"
    
    # Tấn công dựa trên chênh lệch
    curl -X POST "$API_BASE/api/world-gold/attack" \
        -H "Content-Type: application/json" \
        -d '{
            "vector": "SPOT_PRESSURE",
            "world_price": '$WORLD_PRICE',
            "target_premium": 0.15,
            "intensity": "EXTREME"
        }' | jq '.'
}

# 5. Lệnh tấn công stealth (không bị phát hiện)
stealth_liquidity_attack() {
    local cycles=${1:-10}
    
    echo -e "${BLUE}👤 TẤN CÔNG STEALTH - $cycles chu kỳ${NC}"
    log_attack "👤 Khởi chạy tấn công stealth"
    
    for ((i=1; i<=cycles; i++)); do
        echo -e "${BLUE}👤 Chu kỳ stealth $i/$cycles${NC}"
        
        # Tấn công nhỏ, ngẫu nhiên
        local duration=$((60 + $RANDOM % 120))
        local spread=$((50000 + $RANDOM % 20000))
        local volume=$(echo "scale=1; 1.2 + ($RANDOM % 8) / 10" | bc)
        
        curl -X POST "$API_BASE/api/attack/vietnam-gold" \
            -H "Content-Type: application/json" \
            -d '{
                "target": "SJC",
                "intensity": "LOW",
                "duration": '$duration',
                "spread_threshold": '$spread',
                "volume_multiplier": '$volume',
                "stealth_mode": true
            }' | jq '.'
        
        # Delay ngẫu nhiên
        local delay=$((30 + $RANDOM % 90))
        echo -e "${BLUE}👤 Delay: $delay giây${NC}"
        sleep "$delay"
    done
}

# 6. Lệnh tấn công premium cao
high_premium_exploit() {
    echo -e "${YELLOW}💎 KHAI THÁC PREMIUM CAO${NC}"
    log_attack "💎 Khởi chạy khai thác premium"
    
    # Quét premium hiện tại
    PREMIUM_DATA=$(curl -s "$API_BASE/api/liquidity/scan" | jq '.results[] | select(.source == "SJC")')
    
    if [ -n "$PREMIUM_DATA" ]; then
        echo "📊 Dữ liệu premium SJC:"
        echo "$PREMIUM_DATA" | jq '.'
        
        # Tấn công nếu premium cao
        curl -X POST "$API_BASE/api/attack/sjc-pressure" \
            -H "Content-Type: application/json" \
            -d '{
                "intensity": "EXTREME",
                "duration": 600,
                "vector": "PREMIUM_EXPLOIT",
                "target_spread": 40000,
                "volume_multiplier": 1.8
            }' | jq '.'
    fi
}

# 7. Lệnh giám sát và tấn công tự động
auto_monitor_attack() {
    local interval=${1:-30}
    local threshold=${2:-40000}
    
    echo -e "${GREEN}🤖 GIÁM SÁT VÀ TẤN CÔNG TỰ ĐỘNG${NC}"
    echo -e "${GREEN}⏱️ Khoảng cách: $interval giây${NC}"
    echo -e "${GREEN}🎯 Ngưỡng: $threshold VND${NC}"
    
    # Bắt đầu giám sát
    curl -X POST "$API_BASE/api/liquidity/monitor" \
        -H "Content-Type: application/json" \
        -d '{
            "action": "start",
            "intervalSeconds": '$interval'
        }' | jq '.'
    
    echo -e "${GREEN}✅ Hệ thống giám sát đã khởi chạy${NC}"
}

# 8. Lệnh tấn công burst (nổ tung)
burst_attack() {
    local burst_count=${1:-5}
    local burst_interval=${2:-10}
    
    echo -e "${RED}💥 TẤN CÔNG BURST - $burst_count đợt${NC}"
    log_attack "💥 Khởi chạy tấn công burst"
    
    for ((i=1; i<=burst_count; i++)); do
        echo -e "${RED}💥 Đợt burst $i/$burst_count${NC}"
        
        # Tấn công cường độ cao
        curl -X POST "$API_BASE/api/attack/vietnam-gold" \
            -H "Content-Type: application/json" \
            -d '{
                "target": "ALL",
                "intensity": "EXTREME",
                "duration": 60,
                "spread_threshold": 20000,
                "volume_multiplier": 5.0,
                "attack_mode": "BURST_'$i'"
            }' | jq '.'
        
        if [ $i -lt $burst_count ]; then
            echo -e "${YELLOW}⏱️ Chờ $burst_interval giây...${NC}"
            sleep "$burst_interval"
        fi
    done
}

# 9. Lệnh kiểm tra trạng thái tấn công
check_attack_status() {
    echo -e "${BLUE}📊 KIỂM TRA TRẠNG THÁI TẤN CÔNG${NC}"
    
    echo "🎯 Trạng thái tấn công hiện tại:"
    curl -X GET "$API_BASE/api/attack/status" | jq '.'
    
    echo -e "\n💧 Trạng thái thanh khoản:"
    curl -X GET "$API_BASE/api/liquidity/scan" | jq '.summary'
    
    echo -e "\n🌍 Trạng thái vàng thế giới:"
    curl -X GET "$API_BASE/api/world-gold/price" | jq '.'
}

# 10. Lệnh dừng tất cả tấn công
stop_all_attacks() {
    echo -e "${RED}⏹️ DỪNG TẤT CẢ TẤन CÔNG${NC}"
    log_attack "⏹️ Dừng tất cả tấn công"
    
    # Dừng giám sát thanh khoản
    curl -X POST "$API_BASE/api/liquidity/monitor" \
        -H "Content-Type: application/json" \
        -d '{"action": "stop"}' | jq '.'
    
    # Dừng giám sát vàng thế giới
    curl -X POST "$API_BASE/api/world-gold/monitor" \
        -H "Content-Type: application/json" \
        -d '{"action": "stop"}' | jq '.'
    
    echo -e "${GREEN}✅ Tất cả tấn công đã dừng${NC}"
}

# Menu chính
main_menu() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         VIETNAM GOLD LIQUIDITY ATTACK COMMANDS              ║"
    echo "║              🚨 HỆ THỐNG TẤIN CÔNG THANH KHOẢN 🚨          ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo "Các lệnh tấn công có sẵn:"
    echo "  1. attack_sjc_pressure [HIGH|EXTREME] [duration]"
    echo "  2. scan_vietnam_liquidity"
    echo "  3. multi_target_attack"
    echo "  4. world_price_arbitrage_attack"
    echo "  5. stealth_liquidity_attack [cycles]"
    echo "  6. high_premium_exploit"
    echo "  7. auto_monitor_attack [interval] [threshold]"
    echo "  8. burst_attack [count] [interval]"
    echo "  9. check_attack_status"
    echo "  10. stop_all_attacks"
    echo ""
    echo "Ví dụ sử dụng:"
    echo "  ./vietnam-gold-liquidity-attack.sh attack_sjc_pressure EXTREME 600"
    echo "  ./vietnam-gold-liquidity-attack.sh stealth_liquidity_attack 20"
    echo "  ./vietnam-gold-liquidity-attack.sh burst_attack 10 15"
}

# Xử lý tham số dòng lệnh
case "${1:-}" in
    "attack_sjc_pressure")
        attack_sjc_pressure "$2" "$3"
        ;;
    "scan_vietnam_liquidity")
        scan_vietnam_liquidity
        ;;
    "multi_target_attack")
        multi_target_attack
        ;;
    "world_price_arbitrage_attack")
        world_price_arbitrage_attack
        ;;
    "stealth_liquidity_attack")
        stealth_liquidity_attack "$2"
        ;;
    "high_premium_exploit")
        high_premium_exploit
        ;;
    "auto_monitor_attack")
        auto_monitor_attack "$2" "$3"
        ;;
    "burst_attack")
        burst_attack "$2" "$3"
        ;;
    "check_attack_status")
        check_attack_status
        ;;
    "stop_all_attacks")
        stop_all_attacks
        ;;
    "help"|"--help"|"-h"|"")
        main_menu
        ;;
    *)
        echo -e "${RED}Lệnh không hợp lệ: $1${NC}"
        main_menu
        exit 1
        ;;
esac
