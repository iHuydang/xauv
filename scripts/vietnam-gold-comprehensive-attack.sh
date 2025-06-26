
#!/bin/bash

# Vietnam Gold Comprehensive Attack System
# Hệ thống tấn công tổng hợp vàng SJC với áp lực USD/VND đồng thời

set -e

# Configuration
API_BASE="http://localhost:5000"
LOG_FILE="vietnam_comprehensive_attack.log"
ATTACK_ID=$(date +%s)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging function
log_attack() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Banner
show_banner() {
    echo -e "${RED}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         VIETNAM GOLD COMPREHENSIVE ATTACK SYSTEM            ║"
    echo "║     🚨 ÁP LỰC ĐỒNG THỜI VÀNG SJC + USD/VND + THẾ GIỚI 🚨   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 1. Lệnh áp lực USD/VND chuyên biệt
execute_usdvnd_pressure() {
    local intensity=${1:-HIGH}
    local duration=${2:-600}
    
    echo -e "${YELLOW}💱 KHỞI CHẠY ÁP LỰC USD/VND CHUYÊN BIỆT${NC}"
    log_attack "💱 Starting USD/VND pressure attack - Intensity: $intensity"
    
    # Quét áp lực tỷ giá với Python scanner
    echo -e "${BLUE}🔍 Quét áp lực USD/VND với thuật toán overnight...${NC}"
    python3 scripts/vietnam-gold-pressure-scanner.py full
    
    # Áp lực trực tiếp lên tỷ giá
    curl -X POST "$API_BASE/api/forex/usdvnd-pressure" \
        -H "Content-Type: application/json" \
        -d '{
            "action": "INCREASE_VOLATILITY",
            "intensity": "'$intensity'",
            "duration": '$duration',
            "target_spread": 50,
            "volume_multiplier": 3.0,
            "overnight_pressure": true,
            "fed_swap_impact": true
        }' | jq '.'
    
    echo -e "${GREEN}✅ Áp lực USD/VND đã khởi chạy${NC}"
}

# 2. Lệnh áp lực vàng thế giới đồng thời
execute_world_gold_pressure() {
    local target_price=${1:-2650}
    local pressure_direction=${2:-UP}
    
    echo -e "${PURPLE}🌍 KHỞI CHẠY ÁP LỰC VÀNG THẾ GIỚI${NC}"
    log_attack "🌍 Starting world gold pressure - Target: $target_price USD"
    
    # Tấn công giá vàng thế giới
    curl -X POST "$API_BASE/api/world-gold/pressure-attack" \
        -H "Content-Type: application/json" \
        -d '{
            "vector": "SPOT_PRESSURE",
            "target_price": '$target_price',
            "direction": "'$pressure_direction'",
            "intensity": "EXTREME",
            "duration": 900,
            "market_hours_boost": true,
            "london_fix_impact": true
        }' | jq '.'
    
    echo -e "${GREEN}✅ Áp lực vàng thế giới đã khởi chạy${NC}"
}

# 3. Lệnh quét thanh khoản SJC chuyên biệt
execute_sjc_liquidity_drain() {
    local drain_percentage=${1:-75}
    local attack_waves=${2:-5}
    
    echo -e "${RED}💧 KHỞI CHẠY QUÉT THANH KHOẢN SJC CHUYÊN BIỆT${NC}"
    log_attack "💧 Starting SJC liquidity drainage - Target: $drain_percentage%"
    
    for ((wave=1; wave<=attack_waves; wave++)); do
        echo -e "${RED}🌊 Sóng quét thanh khoản $wave/$attack_waves${NC}"
        
        # Mỗi sóng quét với cường độ tăng dần
        local wave_intensity=$((wave * 20))
        local wave_duration=$((120 + wave * 30))
        
        curl -X POST "$API_BASE/api/attack/sjc-pressure" \
            -H "Content-Type: application/json" \
            -d '{
                "intensity": "EXTREME",
                "duration": '$wave_duration',
                "vector": "LIQUIDITY_DRAIN_WAVE_'$wave'",
                "target_spread": '$((50000 - wave * 5000))',
                "volume_multiplier": '$((2 + wave))',
                "drain_percentage": '$drain_percentage'
            }' | jq '.'
        
        # Delay giữa các sóng
        sleep 15
    done
    
    echo -e "${GREEN}✅ Quét thanh khoản SJC hoàn thành${NC}"
}

# 4. Lệnh tấn công đồng bộ ba mặt trận
execute_synchronized_triple_attack() {
    local sync_duration=${1:-1200}
    
    echo -e "${CYAN}⚡ KHỞI CHẠY TẤN CÔNG ĐỒNG BỘ BA MẶT TRẬN${NC}"
    log_attack "⚡ Starting synchronized triple attack for ${sync_duration}s"
    
    # Bước 1: Khởi chạy đồng thời tất cả áp lực
    echo -e "${YELLOW}🎯 Bước 1: Khởi chạy đồng thời...${NC}"
    
    # USD/VND pressure trong background
    execute_usdvnd_pressure "EXTREME" $sync_duration &
    USDVND_PID=$!
    
    # World gold pressure trong background  
    execute_world_gold_pressure 2680 "UP" &
    WORLD_GOLD_PID=$!
    
    # SJC liquidity drain trong background
    execute_sjc_liquidity_drain 80 8 &
    SJC_DRAIN_PID=$!
    
    # Bước 2: Tấn công trực tiếp SJC với áp lực tổng hợp
    sleep 30
    echo -e "${RED}🔥 Bước 2: Tấn công trực tiếp SJC...${NC}"
    
    curl -X POST "$API_BASE/api/attack/vietnam-gold" \
        -H "Content-Type: application/json" \
        -d '{
            "target": "SJC",
            "intensity": "MAXIMUM",
            "duration": '$sync_duration',
            "spread_threshold": 15000,
            "volume_multiplier": 10.0,
            "attack_mode": "SYNCHRONIZED_TRIPLE",
            "usd_pressure_boost": true,
            "world_gold_correlation": true,
            "liquidity_drain_boost": true
        }' | jq '.'
    
    # Bước 3: Monitoring và điều chỉnh
    echo -e "${BLUE}📊 Bước 3: Monitoring real-time...${NC}"
    
    for ((i=1; i<=20; i++)); do
        echo -e "${BLUE}📊 Monitoring cycle $i/20${NC}"
        
        # Kiểm tra status tổng hợp
        curl -s "$API_BASE/api/attack/comprehensive-status" | jq '.data.summary'
        
        # Kiểm tra áp lực USD/VND
        python3 scripts/vietnam-gold-pressure-scanner.py quick
        
        sleep 60
    done
    
    # Chờ tất cả background processes
    wait $USDVND_PID $WORLD_GOLD_PID $SJC_DRAIN_PID
    
    echo -e "${GREEN}✅ Tấn công đồng bộ ba mặt trận hoàn thành${NC}"
}

# 5. Lệnh áp lực FED swap đặc biệt
execute_fed_swap_pressure() {
    local swap_volume=${1:-200000000}
    local overnight_rate=${2:-5.5}
    
    echo -e "${PURPLE}🏦 KHỞI CHẠY ÁP LỰC FED SWAP ĐẶC BIỆT${NC}"
    log_attack "🏦 Starting FED swap pressure - Volume: $swap_volume USD"
    
    # Mô phỏng áp lực FED swap
    curl -X POST "$API_BASE/api/fed/swap-pressure" \
        -H "Content-Type: application/json" \
        -d '{
            "swap_type": "USD_LIQUIDITY_OVERNIGHT",
            "volume": '$swap_volume',
            "overnight_rate": '$overnight_rate',
            "termInDays": 1,
            "counterparty": "VIETNAM_BANKS",
            "pressure_vector": "OVERNIGHT_FUNDING_COST",
            "impact_multiplier": 2.5
        }' | jq '.'
    
    echo -e "${GREEN}✅ Áp lực FED swap đã áp dụng${NC}"
}

# 6. Lệnh monitoring tổng hợp real-time
start_comprehensive_monitoring() {
    local interval=${1:-30}
    
    echo -e "${CYAN}📺 BẮT ĐẦU MONITORING TỔNG HỢP${NC}"
    log_attack "📺 Starting comprehensive monitoring"
    
    while true; do
        clear
        echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${BLUE}║                VIETNAM GOLD ATTACK MONITORING                ║${NC}"
        echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        
        # SJC Status
        echo -e "${YELLOW}🥇 SJC GOLD STATUS:${NC}"
        curl -s "$API_BASE/api/vietnam-gold/prices" | jq '.data.prices[] | select(.source == "SJC")'
        echo ""
        
        # USD/VND Status
        echo -e "${GREEN}💱 USD/VND PRESSURE:${NC}"
        python3 scripts/vietnam-gold-pressure-scanner.py quick | tail -10
        echo ""
        
        # World Gold Status
        echo -e "${PURPLE}🌍 WORLD GOLD:${NC}"
        curl -s "$API_BASE/api/world-gold/price" | jq '.data'
        echo ""
        
        # Attack Status
        echo -e "${RED}⚔️ ATTACK STATUS:${NC}"
        curl -s "$API_BASE/api/attack/status" | jq '.data.active_attacks'
        echo ""
        
        echo -e "${CYAN}⏰ Next update in $interval seconds... (Ctrl+C to stop)${NC}"
        sleep $interval
    done
}

# 7. Lệnh dừng tất cả áp lực
stop_all_comprehensive_attacks() {
    echo -e "${RED}⏹️ DỪNG TẤT CẢ ÁP LỰC TỔNG HỢP${NC}"
    log_attack "⏹️ Stopping all comprehensive attacks"
    
    # Dừng tấn công SJC
    curl -X POST "$API_BASE/api/attack/stop-all" | jq '.'
    
    # Dừng áp lực USD/VND
    curl -X POST "$API_BASE/api/forex/stop-usdvnd-pressure" | jq '.'
    
    # Dừng áp lực vàng thế giới
    curl -X POST "$API_BASE/api/world-gold/stop-pressure" | jq '.'
    
    # Dừng FED swap pressure
    curl -X POST "$API_BASE/api/fed/stop-swap-pressure" | jq '.'
    
    echo -e "${GREEN}✅ Tất cả áp lực đã dừng${NC}"
}

# 8. Lệnh báo cáo tổng hợp
generate_comprehensive_report() {
    local report_file="comprehensive_attack_report_$(date +%Y%m%d_%H%M%S).json"
    
    echo -e "${BLUE}📊 TẠO BÁO CÁO TỔNG HỢP${NC}"
    log_attack "📊 Generating comprehensive report"
    
    echo "{" > "$report_file"
    echo "  \"report_timestamp\": \"$(date -Iseconds)\"," >> "$report_file"
    echo "  \"attack_id\": \"$ATTACK_ID\"," >> "$report_file"
    
    # SJC Data
    echo "  \"sjc_status\": " >> "$report_file"
    curl -s "$API_BASE/api/vietnam-gold/prices" | jq '.data.prices[] | select(.source == "SJC")' >> "$report_file"
    echo "," >> "$report_file"
    
    # USD/VND Data
    echo "  \"usdvnd_pressure\": " >> "$report_file"
    python3 scripts/vietnam-gold-pressure-scanner.py full > temp_usdvnd.json
    cat temp_usdvnd.json >> "$report_file" 2>/dev/null || echo "null" >> "$report_file"
    rm -f temp_usdvnd.json
    echo "," >> "$report_file"
    
    # World Gold Data
    echo "  \"world_gold_status\": " >> "$report_file"
    curl -s "$API_BASE/api/world-gold/price" | jq '.data' >> "$report_file"
    echo "," >> "$report_file"
    
    # Attack Summary
    echo "  \"attack_summary\": " >> "$report_file"
    curl -s "$API_BASE/api/attack/comprehensive-status" | jq '.data' >> "$report_file"
    
    echo "}" >> "$report_file"
    
    echo -e "${GREEN}✅ Báo cáo đã lưu: $report_file${NC}"
}

# Menu chính
show_main_menu() {
    show_banner
    echo -e "${YELLOW}LỆNH ÁP LỰC TỔNG HỢP VÀNG SJC + USD/VND:${NC}"
    echo ""
    echo -e "${GREEN}1.${NC} execute_usdvnd_pressure [HIGH|EXTREME] [duration]"
    echo -e "${PURPLE}2.${NC} execute_world_gold_pressure [target_price] [UP|DOWN]"
    echo -e "${RED}3.${NC} execute_sjc_liquidity_drain [percentage] [waves]"
    echo -e "${CYAN}4.${NC} execute_synchronized_triple_attack [duration]"
    echo -e "${PURPLE}5.${NC} execute_fed_swap_pressure [volume] [rate]"
    echo -e "${BLUE}6.${NC} start_comprehensive_monitoring [interval]"
    echo -e "${YELLOW}7.${NC} generate_comprehensive_report"
    echo -e "${RED}8.${NC} stop_all_comprehensive_attacks"
    echo ""
    echo -e "${CYAN}Ví dụ sử dụng:${NC}"
    echo "  ./vietnam-gold-comprehensive-attack.sh execute_synchronized_triple_attack 1800"
    echo "  ./vietnam-gold-comprehensive-attack.sh execute_usdvnd_pressure EXTREME 900"
    echo "  ./vietnam-gold-comprehensive-attack.sh start_comprehensive_monitoring 30"
}

# Xử lý tham số dòng lệnh
case "${1:-menu}" in
    "execute_usdvnd_pressure")
        execute_usdvnd_pressure "$2" "$3"
        ;;
    "execute_world_gold_pressure")
        execute_world_gold_pressure "$2" "$3"
        ;;
    "execute_sjc_liquidity_drain")
        execute_sjc_liquidity_drain "$2" "$3"
        ;;
    "execute_synchronized_triple_attack")
        execute_synchronized_triple_attack "$2"
        ;;
    "execute_fed_swap_pressure")
        execute_fed_swap_pressure "$2" "$3"
        ;;
    "start_comprehensive_monitoring")
        start_comprehensive_monitoring "$2"
        ;;
    "generate_comprehensive_report")
        generate_comprehensive_report
        ;;
    "stop_all_comprehensive_attacks")
        stop_all_comprehensive_attacks
        ;;
    "menu"|"help"|"--help"|"-h"|"")
        show_main_menu
        ;;
    *)
        echo -e "${RED}Lệnh không hợp lệ: $1${NC}"
        show_main_menu
        exit 1
        ;;
esac
