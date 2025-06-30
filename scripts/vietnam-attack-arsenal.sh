
#!/bin/bash

# Vietnam Gold Attack Arsenal
# Kho vũ khí tấn công vàng Việt Nam - Phiên bản đầy đủ

set -e

# Configuration
API_BASE="http://localhost:5000"
PYTHON_SCANNER="python3 scripts/vietnam-gold-pressure-scanner.py"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Ensure scripts are executable
chmod +x scripts/vietnam-gold-liquidity-attack.sh 2>/dev/null || true
chmod +x scripts/quick-vietnam-attack.sh 2>/dev/null || true
chmod +x scripts/vietnam-gold-comprehensive-attack.sh 2>/dev/null || true
chmod +x scripts/vietnam-gold-destroyer.sh 2>/dev/null || true

show_banner() {
    echo -e "${RED}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║          🚨 KHO VŨ KHÍ TẤN CÔNG VÀNG VIỆT NAM 🚨          ║"
    echo "║                  ARSENAL VERSION 3.0                      ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_menu() {
    echo -e "${YELLOW}📋 MENU LỆNH TẤN CÔNG HOÀN CHỈNH:${NC}"
    echo ""
    echo -e "${GREEN}=== CÁC LỆNH NHANH ===${NC}"
    echo -e "${GREEN}1.${NC} quick_attack        - Tấn công nhanh tổng hợp (30s)"
    echo -e "${GREEN}2.${NC} rapid_strike        - Đòn tấn công chớp nhoáng (10s)"
    echo -e "${GREEN}3.${NC} instant_pressure    - Áp lực tức thì SJC"
    echo ""
    echo -e "${RED}=== CÁC LỆNH ÁP LỰC ===${NC}"
    echo -e "${RED}4.${NC} sjc_pressure        - Tấn công áp lực SJC chuyên biệt"
    echo -e "${RED}5.${NC} usdvnd_pressure     - Áp lực USD/VND cường độ cao"
    echo -e "${RED}6.${NC} multi_target        - Tấn công đa mục tiêu đồng thời"
    echo -e "${RED}7.${NC} devastation         - Tấn công tàn phá toàn diện"
    echo ""
    echo -e "${PURPLE}=== CÁC LỆNH CHUYÊN SÂU ===${NC}"
    echo -e "${PURPLE}8.${NC} world_arbitrage     - Khai thác chênh lệch giá thế giới"
    echo -e "${PURPLE}9.${NC} fed_swap_attack     - Tấn công FED swap liquidity"
    echo -e "${PURPLE}10.${NC} stealth_infiltrate  - Thâm nhập âm thầm"
    echo -e "${PURPLE}11.${NC} liquidity_drain     - Hút cạn thanh khoản"
    echo ""
    echo -e "${BLUE}=== CÁC LỆNH BURST ===${NC}"
    echo -e "${BLUE}12.${NC} burst_attack        - Tấn công burst sóng thần"
    echo -e "${BLUE}13.${NC} tsunami_mode        - Chế độ sóng thần liên hoàn"
    echo -e "${BLUE}14.${NC} nuclear_option      - Tùy chọn hạt nhân (cực kỳ nguy hiểm)"
    echo ""
    echo -e "${CYAN}=== CÁC LỆNH GIÁM SÁT ===${NC}"
    echo -e "${CYAN}15.${NC} auto_monitor        - Giám sát tự động + tấn công"
    echo -e "${CYAN}16.${NC} vulnerability_scan  - Quét điểm yếu hệ thống"
    echo -e "${CYAN}17.${NC} real_time_analysis  - Phân tích thời gian thực"
    echo ""
    echo -e "${YELLOW}=== CÁC LỆNH HỆ THỐNG ===${NC}"
    echo -e "${YELLOW}18.${NC} status              - Kiểm tra trạng thái tất cả"
    echo -e "${YELLOW}19.${NC} stop_all            - Dừng tất cả tấn công"
    echo -e "${YELLOW}20.${NC} emergency_stop      - Dừng khẩn cấp toàn bộ"
    echo ""
}

# 1. Quick Attack - Tấn công nhanh
quick_attack() {
    echo -e "${GREEN}⚡ KHỞI CHẠY TẤN CÔNG NHANH TỔNG HỢP${NC}"
    
    # Parallel attacks trong 30 giây
    echo -e "${YELLOW}🚀 Khởi chạy 6 vector tấn công đồng thời...${NC}"
    
    # Vector 1: SJC Pressure
    curl -X POST "$API_BASE/api/attack/sjc-pressure" \
        -H "Content-Type: application/json" \
        -d '{"intensity":"HIGH","duration":30,"vector":"QUICK_PRESSURE"}' &
    
    # Vector 2: USD/VND Pressure  
    $PYTHON_SCANNER full &
    
    # Vector 3: Multi-target attack
    if [ -f "scripts/vietnam-gold-liquidity-attack.sh" ]; then
        scripts/vietnam-gold-liquidity-attack.sh multi_target_attack &
    fi
    
    # Vector 4: World gold pressure
    curl -X POST "$API_BASE/api/world-gold/pressure" \
        -H "Content-Type: application/json" \
        -d '{"intensity":"MODERATE","duration":30}' &
    
    # Vector 5: Liquidity drainage
    curl -X POST "$API_BASE/api/attack/vietnam-gold" \
        -H "Content-Type: application/json" \
        -d '{"target":"ALL","intensity":"HIGH","duration":30,"volume_multiplier":3.0}' &
    
    # Vector 6: Broker pressure
    curl -X POST "$API_BASE/api/vietnam-gold/pressure-attack" \
        -H "Content-Type: application/json" \
        -d '{"targets":["SJC","DOJI"],"intensity":"high","duration":30}' &
    
    echo -e "${GREEN}✅ Tất cả 6 vector đã khởi chạy! Chờ 30 giây...${NC}"
    sleep 30
    echo -e "${GREEN}🏁 Tấn công nhanh hoàn thành!${NC}"
}

# 2. Rapid Strike - Đòn chớp nhoáng
rapid_strike() {
    echo -e "${RED}⚡ ĐÒNG TẤN CÔNG CHỚP NHOÁNG (10 GIÂY)${NC}"
    
    if [ -f "scripts/rapid-vietnam-gold-strike.sh" ]; then
        scripts/rapid-vietnam-gold-strike.sh
    else
        echo -e "${YELLOW}📝 Executing inline rapid strike...${NC}"
        # Inline rapid strike
        for i in {1..10}; do
            echo -e "${RED}⚡ Strike $i/10${NC}"
            curl -s -X POST "$API_BASE/api/attack/vietnam-gold" \
                -H "Content-Type: application/json" \
                -d '{"target":"SJC","intensity":"EXTREME","duration":1}' > /dev/null &
            sleep 1
        done
        wait
    fi
    
    echo -e "${GREEN}⚡ Rapid strike hoàn thành!${NC}"
}

# 3. Instant Pressure - Áp lực tức thì
instant_pressure() {
    echo -e "${RED}🚨 ÁP LỰC TỨC THÌ SJC${NC}"
    
    curl -X POST "$API_BASE/api/attack/sjc-pressure" \
        -H "Content-Type: application/json" \
        -d '{
            "intensity": "MAXIMUM",
            "duration": 60,
            "vector": "INSTANT_SHOCK",
            "target_spread": 15000,
            "volume_multiplier": 8.0
        }' | jq '.'
}

# 4. SJC Pressure - Áp lực SJC chuyên biệt  
sjc_pressure() {
    local intensity=${1:-EXTREME}
    local duration=${2:-600}
    
    echo -e "${RED}🎯 TẤN CÔNG ÁP LỰC SJC CHUYÊN BIỆT${NC}"
    echo -e "${YELLOW}Cường độ: $intensity | Thời gian: ${duration}s${NC}"
    
    if [ -f "scripts/vietnam-gold-liquidity-attack.sh" ]; then
        scripts/vietnam-gold-liquidity-attack.sh attack_sjc_pressure "$intensity" "$duration"
    else
        curl -X POST "$API_BASE/api/attack/sjc-pressure" \
            -H "Content-Type: application/json" \
            -d '{
                "intensity": "'$intensity'",
                "duration": '$duration',
                "vector": "SPECIALIZED_PRESSURE",
                "target_spread": 25000,
                "volume_multiplier": 5.0
            }' | jq '.'
    fi
}

# 5. USD/VND Pressure - Áp lực tỷ giá
usdvnd_pressure() {
    local mode=${1:-HIGH}
    
    echo -e "${PURPLE}💱 ÁP LỰC USD/VND CƯỜNG ĐỘ CAO${NC}"
    
    # Python scanner với thuật toán áp lực
    echo -e "${BLUE}🔍 Khởi chạy thuật toán áp lực USD/VND...${NC}"
    $PYTHON_SCANNER full
    
    # Comprehensive attack
    if [ -f "scripts/vietnam-gold-comprehensive-attack.sh" ]; then
        scripts/vietnam-gold-comprehensive-attack.sh execute_usdvnd_pressure "$mode" 900
    else
        curl -X POST "$API_BASE/api/forex/usdvnd-pressure" \
            -H "Content-Type: application/json" \
            -d '{
                "action": "INCREASE_VOLATILITY",
                "intensity": "'$mode'",
                "duration": 900,
                "overnight_pressure": true
            }' | jq '.'
    fi
}

# 6. Multi Target - Đa mục tiêu
multi_target() {
    echo -e "${RED}🎯 TẤN CÔNG ĐA MỤC TIÊU ĐỒNG THỜI${NC}"
    
    if [ -f "scripts/vietnam-gold-liquidity-attack.sh" ]; then
        scripts/vietnam-gold-liquidity-attack.sh multi_target_attack
    else
        # Inline multi-target
        targets=("SJC" "DOJI" "PNJ" "TYGIA_SJC")
        for target in "${targets[@]}"; do
            echo -e "${YELLOW}🎯 Attacking $target...${NC}"
            curl -X POST "$API_BASE/api/vietnam-gold/quick-attack/$target" \
                -H "Content-Type: application/json" \
                -d '{"intensity":"high"}' &
        done
        wait
    fi
}

# 7. Devastation - Tàn phá toàn diện
devastation() {
    echo -e "${RED}💀 TẤN CÔNG TÀN PHÁ TOÀN DIỆN${NC}"
    echo -e "${RED}⚠️ CẢNH BÁO: TẤN CÔNG MỨC ĐỘ TỐI ĐA${NC}"
    
    if [ -f "scripts/vietnam-gold-destroyer.sh" ]; then
        scripts/vietnam-gold-destroyer.sh destroy
    else
        curl -X POST "$API_BASE/api/vietnam-gold/devastation-attack" \
            -H "Content-Type: application/json" \
            -d '{}' | jq '.'
    fi
}

# 8. World Arbitrage - Chênh lệch thế giới
world_arbitrage() {
    echo -e "${PURPLE}🌍 KHAI THÁC CHÊNH LỆCH GIÁ THẾ GIỚI${NC}"
    
    if [ -f "scripts/vietnam-gold-liquidity-attack.sh" ]; then
        scripts/vietnam-gold-liquidity-attack.sh world_price_arbitrage_attack
    else
        curl -X POST "$API_BASE/api/world-gold/arbitrage-exploit" \
            -H "Content-Type: application/json" \
            -d '{"intensity":"HIGH","duration":600}' | jq '.'
    fi
}

# 9. FED Swap Attack - Tấn công FED
fed_swap_attack() {
    echo -e "${GREEN}🏦 TẤN CÔNG FED SWAP LIQUIDITY${NC}"
    
    if [ -f "scripts/vietnam-gold-comprehensive-attack.sh" ]; then
        scripts/vietnam-gold-comprehensive-attack.sh execute_fed_swap_pressure 500000000 5.5
    else
        curl -X POST "$API_BASE/api/fed/swap-pressure" \
            -H "Content-Type: application/json" \
            -d '{
                "swap_volume": 500000000,
                "overnight_rate": 5.5,
                "pressure_vector": "OVERNIGHT_FUNDING_COST"
            }' | jq '.'
    fi
}

# 10. Stealth Infiltrate - Thâm nhập âm thầm
stealth_infiltrate() {
    echo -e "${BLUE}👤 THÂM NHẬP ÂM THẦM${NC}"
    
    if [ -f "scripts/vietnam-gold-liquidity-attack.sh" ]; then
        scripts/vietnam-gold-liquidity-attack.sh stealth_liquidity_attack 20
    else
        curl -X POST "$API_BASE/api/attack/stealth" \
            -H "Content-Type: application/json" \
            -d '{"mode":"infiltrate","duration":1200,"stealth_level":"maximum"}' | jq '.'
    fi
}

# 11. Liquidity Drain - Hút cạn thanh khoản
liquidity_drain() {
    local percentage=${1:-80}
    
    echo -e "${CYAN}🌪️ HÚT CẠN THANH KHOẢN ($percentage%)${NC}"
    
    if [ -f "scripts/vietnam-gold-comprehensive-attack.sh" ]; then
        scripts/vietnam-gold-comprehensive-attack.sh execute_sjc_liquidity_drain "$percentage" 10
    else
        curl -X POST "$API_BASE/api/attack/liquidity-drain" \
            -H "Content-Type: application/json" \
            -d '{"percentage":'$percentage',"waves":10}' | jq '.'
    fi
}

# 12. Burst Attack - Tấn công burst
burst_attack() {
    local bursts=${1:-8}
    local interval=${2:-12}
    
    echo -e "${BLUE}💥 TẤN CÔNG BURST SÓNG THẦN${NC}"
    
    if [ -f "scripts/vietnam-gold-liquidity-attack.sh" ]; then
        scripts/vietnam-gold-liquidity-attack.sh burst_attack "$bursts" "$interval"
    else
        for ((i=1; i<=bursts; i++)); do
            echo -e "${RED}💥 Burst $i/$bursts${NC}"
            curl -X POST "$API_BASE/api/attack/vietnam-gold" \
                -H "Content-Type: application/json" \
                -d '{"target":"ALL","intensity":"EXTREME","duration":60}' &
            sleep "$interval"
        done
    fi
}

# 13. Tsunami Mode - Sóng thần liên hoàn
tsunami_mode() {
    echo -e "${RED}🌊 CHẾ ĐỘ SÓNG THẦN LIÊN HOÀN${NC}"
    
    if [ -f "scripts/vietnam-gold-comprehensive-attack.sh" ]; then
        scripts/vietnam-gold-comprehensive-attack.sh execute_synchronized_triple_attack 1800
    else
        # Simulate tsunami with multiple waves
        for wave in {1..5}; do
            echo -e "${RED}🌊 Tsunami Wave $wave/5${NC}"
            curl -X POST "$API_BASE/api/attack/tsunami" \
                -H "Content-Type: application/json" \
                -d '{"wave":'$wave',"intensity":"MAXIMUM"}' &
            sleep 180  # 3 minutes between waves
        done
    fi
}

# 14. Nuclear Option - Tùy chọn hạt nhân
nuclear_option() {
    echo -e "${RED}☢️ TÙY CHỌN HẠT NHÂN - CỰC KỲ NGUY HIỂM${NC}"
    echo -e "${RED}⚠️ CẢNH BÁO: ĐIỀU NÀY SẼ GÂY RA TẤN CÔNG TỐI ĐA${NC}"
    
    read -p "Bạn có chắc chắn muốn tiếp tục? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        echo -e "${RED}☢️ Khởi chạy nuclear option...${NC}"
        
        # All systems attack simultaneously
        quick_attack &
        devastation &
        tsunami_mode &
        
        echo -e "${RED}☢️ Nuclear attack initiated!${NC}"
    else
        echo -e "${YELLOW}❌ Nuclear option cancelled${NC}"
    fi
}

# 15. Auto Monitor - Giám sát tự động
auto_monitor() {
    local threshold=${1:-35000}
    local interval=${2:-30}
    
    echo -e "${CYAN}📊 GIÁM SÁT TỰ ĐỘNG + TẤN CÔNG${NC}"
    
    if [ -f "scripts/vietnam-gold-liquidity-attack.sh" ]; then
        scripts/vietnam-gold-liquidity-attack.sh auto_monitor_attack "$interval" "$threshold"
    else
        curl -X POST "$API_BASE/api/monitoring/auto-attack" \
            -H "Content-Type: application/json" \
            -d '{"threshold":'$threshold',"interval":'$interval'}' | jq '.'
    fi
}

# 16. Vulnerability Scan - Quét điểm yếu
vulnerability_scan() {
    echo -e "${CYAN}🔍 QUÉT ĐIỂM YẾU HỆ THỐNG${NC}"
    
    curl -X GET "$API_BASE/api/vietnam-gold/vulnerability-analysis" | jq '.'
    
    echo -e "${YELLOW}📊 Phân tích Python scanner...${NC}"
    $PYTHON_SCANNER sjc
}

# 17. Real-time Analysis - Phân tích thời gian thực
real_time_analysis() {
    echo -e "${BLUE}📈 PHÂN TÍCH THỜI GIAN THỰC${NC}"
    
    if [ -f "scripts/vietnam-gold-commands.sh" ]; then
        scripts/vietnam-gold-commands.sh monitor 15
    else
        while true; do
            clear
            echo -e "${BLUE}📊 REAL-TIME VIETNAM GOLD ANALYSIS${NC}"
            echo "$(date)"
            echo ""
            
            curl -s "$API_BASE/api/vietnam-gold/prices" | jq '.data.prices[]' 2>/dev/null || echo "API not available"
            echo ""
            
            $PYTHON_SCANNER quick 2>/dev/null || echo "Scanner not available"
            
            sleep 15
        done
    fi
}

# 18. Status Check - Kiểm tra trạng thái
status_check() {
    echo -e "${YELLOW}📊 KIỂM TRA TRẠNG THÁI TẤT CẢ HỆ THỐNG${NC}"
    
    echo -e "${BLUE}🌐 API Status:${NC}"
    curl -s "$API_BASE/api/vietnam-gold/broker-status" | jq '.' || echo "Broker API offline"
    
    echo -e "${BLUE}🔍 Scanner Status:${NC}"
    $PYTHON_SCANNER quick || echo "Scanner offline"
    
    echo -e "${BLUE}⚔️ Attack Status:${NC}"
    curl -s "$API_BASE/api/attack/status" | jq '.' || echo "Attack API offline"
}

# 19. Stop All - Dừng tất cả
stop_all() {
    echo -e "${YELLOW}⏹️ DỪNG TẤT CẢ TẤN CÔNG${NC}"
    
    if [ -f "scripts/vietnam-gold-liquidity-attack.sh" ]; then
        scripts/vietnam-gold-liquidity-attack.sh stop_all_attacks
    fi
    
    if [ -f "scripts/vietnam-gold-comprehensive-attack.sh" ]; then
        scripts/vietnam-gold-comprehensive-attack.sh stop_all_comprehensive_attacks
    fi
    
    curl -X POST "$API_BASE/api/attack/stop-all" | jq '.' || echo "Stop API call failed"
    
    echo -e "${GREEN}✅ Tất cả tấn công đã dừng${NC}"
}

# 20. Emergency Stop - Dừng khẩn cấp
emergency_stop() {
    echo -e "${RED}🚨 DỪNG KHẨN CẤP TOÀN BỘ HỆ THỐNG${NC}"
    
    # Kill all related processes
    pkill -f "vietnam-gold" 2>/dev/null || true
    pkill -f "sjc-" 2>/dev/null || true
    pkill -f "pressure-scanner" 2>/dev/null || true
    
    # API stop calls
    curl -X POST "$API_BASE/api/emergency/stop-all" 2>/dev/null || true
    
    echo -e "${RED}🚨 HỆ THỐNG ĐÃ DỪNG KHẨN CẤP${NC}"
}

# Main execution logic
main() {
    show_banner
    
    if [ $# -eq 0 ]; then
        show_menu
        echo ""
        read -p "Chọn lệnh (1-20): " choice
        echo ""
        
        case $choice in
            1|"quick_attack") quick_attack ;;
            2|"rapid_strike") rapid_strike ;;
            3|"instant_pressure") instant_pressure ;;
            4|"sjc_pressure") sjc_pressure "${2:-EXTREME}" "${3:-600}" ;;
            5|"usdvnd_pressure") usdvnd_pressure "${2:-HIGH}" ;;
            6|"multi_target") multi_target ;;
            7|"devastation") devastation ;;
            8|"world_arbitrage") world_arbitrage ;;
            9|"fed_swap_attack") fed_swap_attack ;;
            10|"stealth_infiltrate") stealth_infiltrate ;;
            11|"liquidity_drain") liquidity_drain "${2:-80}" ;;
            12|"burst_attack") burst_attack "${2:-8}" "${3:-12}" ;;
            13|"tsunami_mode") tsunami_mode ;;
            14|"nuclear_option") nuclear_option ;;
            15|"auto_monitor") auto_monitor "${2:-35000}" "${3:-30}" ;;
            16|"vulnerability_scan") vulnerability_scan ;;
            17|"real_time_analysis") real_time_analysis ;;
            18|"status") status_check ;;
            19|"stop_all") stop_all ;;
            20|"emergency_stop") emergency_stop ;;
            *) echo -e "${RED}❌ Lựa chọn không hợp lệ!${NC}" ;;
        esac
    else
        # Command line mode
        case "${1}" in
            "quick_attack"|"1") quick_attack ;;
            "rapid_strike"|"2") rapid_strike ;;
            "instant_pressure"|"3") instant_pressure ;;
            "sjc_pressure"|"4") sjc_pressure "${2:-EXTREME}" "${3:-600}" ;;
            "usdvnd_pressure"|"5") usdvnd_pressure "${2:-HIGH}" ;;
            "multi_target"|"6") multi_target ;;
            "devastation"|"7") devastation ;;
            "world_arbitrage"|"8") world_arbitrage ;;
            "fed_swap_attack"|"9") fed_swap_attack ;;
            "stealth_infiltrate"|"10") stealth_infiltrate ;;
            "liquidity_drain"|"11") liquidity_drain "${2:-80}" ;;
            "burst_attack"|"12") burst_attack "${2:-8}" "${3:-12}" ;;
            "tsunami_mode"|"13") tsunami_mode ;;
            "nuclear_option"|"14") nuclear_option ;;
            "auto_monitor"|"15") auto_monitor "${2:-35000}" "${3:-30}" ;;
            "vulnerability_scan"|"16") vulnerability_scan ;;
            "real_time_analysis"|"17") real_time_analysis ;;
            "status"|"18") status_check ;;
            "stop_all"|"19") stop_all ;;
            "emergency_stop"|"20") emergency_stop ;;
            "help"|"--help"|"-h")
                show_menu
                echo ""
                echo "Sử dụng: $0 [command] [options]"
                echo "Ví dụ: $0 quick_attack"
                echo "       $0 sjc_pressure EXTREME 900"
                echo "       $0 liquidity_drain 85"
                ;;
            *)
                echo -e "${RED}❌ Lệnh không hợp lệ: $1${NC}"
                show_menu
                ;;
        esac
    fi
}

# Execute main function
main "$@"
