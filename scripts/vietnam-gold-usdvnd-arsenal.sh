
#!/bin/bash

# Vietnam Gold USD/VND Arsenal
# Kho vũ khí tấn công USD/VND và vàng thế giới

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

show_banner() {
    echo -e "${PURPLE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           🚨 USD/VND + WORLD GOLD ARSENAL 🚨              ║"
    echo "║              Kho vũ khí tỷ giá và vàng thế giới            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_menu() {
    echo -e "${YELLOW}💱 MENU TẤIN CÔNG USD/VND + VÀNG THẾ GIỚI:${NC}"
    echo ""
    echo -e "${GREEN}=== TẤN CÔNG USD/VND ===${NC}"
    echo -e "${GREEN}1.${NC} usdvnd_pressure_boost   - Tăng áp lực USD/VND"
    echo -e "${GREEN}2.${NC} usdvnd_overnight_attack - Tấn công overnight USD/VND"
    echo -e "${GREEN}3.${NC} usdvnd_volatility_boost - Tăng biến động USD/VND"
    echo -e "${GREEN}4.${NC} fed_swap_simulation     - Mô phỏng FED swap"
    echo ""
    echo -e "${YELLOW}=== TẤN CÔNG VÀNG THẾ GIỚI ===${NC}"
    echo -e "${YELLOW}5.${NC} world_gold_pump        - Đẩy vàng thế giới lên"
    echo -e "${YELLOW}6.${NC} world_gold_dump        - Đẩy vàng thế giới xuống"
    echo -e "${YELLOW}7.${NC} london_fix_pressure    - Áp lực London Gold Fix"
    echo -e "${YELLOW}8.${NC} spot_gold_volatility   - Biến động vàng spot"
    echo ""
    echo -e "${RED}=== TẤN CÔNG SJC CHUYÊN BIỆT ===${NC}"
    echo -e "${RED}9.${NC} sjc_premium_crusher     - Nghiền nát premium SJC"
    echo -e "${RED}10.${NC} sjc_liquidity_vacuum    - Hút cạn thanh khoản SJC"
    echo -e "${RED}11.${NC} sjc_spread_destroyer    - Phá hủy spread SJC"
    echo -e "${RED}12.${NC} sjc_monopoly_breaker    - Phá vỡ độc quyền SJC"
    echo ""
    echo -e "${BLUE}=== TẤN CÔNG KẾT HỢP ===${NC}"
    echo -e "${BLUE}13.${NC} synchronized_triple     - Tấn công ba mặt trận đồng bộ"
    echo -e "${BLUE}14.${NC} global_arbitrage_exploit - Khai thác arbitrage toàn cầu"
    echo -e "${BLUE}15.${NC} currency_gold_correlation - Tương quan tiền tệ-vàng"
    echo ""
    echo -e "${PURPLE}=== GIÁM SÁT VÀ PHÂN TÍCH ===${NC}"
    echo -e "${PURPLE}16.${NC} real_time_correlation   - Tương quan thời gian thực"
    echo -e "${PURPLE}17.${NC} arbitrage_scanner       - Quét cơ hội arbitrage"
    echo -e "${PURPLE}18.${NC} pressure_analysis       - Phân tích áp lực tổng hợp"
    echo ""
    echo -e "${CYAN}=== HỆ THỐNG ===${NC}"
    echo -e "${CYAN}19.${NC} status                  - Trạng thái hệ thống"
    echo -e "${CYAN}20.${NC} stop_all                - Dừng tất cả"
    echo ""
}

# 1. USD/VND Pressure Boost
usdvnd_pressure_boost() {
    local intensity=${1:-MEDIUM}
    local direction=${2:-INCREASE}
    
    echo -e "${GREEN}💱 TĂNG ÁP LỰC USD/VND${NC}"
    echo -e "${YELLOW}Cường độ: $intensity | Hướng: $direction${NC}"
    
    # Python scanner analysis
    echo -e "${BLUE}🔍 Phân tích áp lực USD/VND...${NC}"
    $PYTHON_SCANNER usdvnd
    
    # API pressure boost
    case $direction in
        "INCREASE")
            echo -e "${RED}📈 Hướng: Tăng tỷ giá${NC}"
            curl -X POST "$API_BASE/api/forex/usdvnd-pressure" \
                -H "Content-Type: application/json" \
                -d '{"action":"INCREASE_RATE","intensity":"'$intensity'","duration":900}' | jq '.'
            ;;
        "DECREASE")
            echo -e "${GREEN}📉 Hướng: Giảm tỷ giá${NC}"
            curl -X POST "$API_BASE/api/forex/usdvnd-pressure" \
                -H "Content-Type: application/json" \
                -d '{"action":"DECREASE_RATE","intensity":"'$intensity'","duration":900}' | jq '.'
            ;;
        *)
            echo -e "${YELLOW}📊 Hướng: Tăng biến động${NC}"
            curl -X POST "$API_BASE/api/forex/usdvnd-pressure" \
                -H "Content-Type: application/json" \
                -d '{"action":"INCREASE_VOLATILITY","intensity":"'$intensity'","duration":900}' | jq '.'
            ;;
    esac
}

# 2. USD/VND Overnight Attack
usdvnd_overnight_attack() {
    echo -e "${PURPLE}🌙 TẤN CÔNG OVERNIGHT USD/VND${NC}"
    
    # Enhanced overnight pressure
    curl -X POST "$API_BASE/api/forex/overnight-pressure" \
        -H "Content-Type: application/json" \
        -d '{
            "pair": "USDVND",
            "intensity": "HIGH",
            "overnight_rate_impact": true,
            "fed_funds_correlation": true,
            "duration": 1200
        }' | jq '.'
    
    # Monitor overnight impact
    echo -e "${BLUE}📊 Giám sát tác động overnight...${NC}"
    $PYTHON_SCANNER quick
}

# 3. USD/VND Volatility Boost
usdvnd_volatility_boost() {
    echo -e "${PURPLE}📈 TĂNG BIẾN ĐỘNG USD/VND${NC}"
    
    curl -X POST "$API_BASE/api/forex/volatility-boost" \
        -H "Content-Type: application/json" \
        -d '{
            "pair": "USDVND",
            "boost_factor": 3.5,
            "duration": 600,
            "volatility_pattern": "SPIKE_AND_SUSTAIN"
        }' | jq '.'
}

# 4. FED Swap Simulation
fed_swap_simulation() {
    echo -e "${GREEN}🏦 MÔ PHỎNG FED SWAP${NC}"
    
    # Python scanner with FED analysis
    if [ -f "scripts/vietnam-gold-pressure-scanner.py" ]; then
        echo -e "${BLUE}🔍 Phân tích FED swap impact...${NC}"
        $PYTHON_SCANNER full
    else
        echo -e "${YELLOW}⚠️ Python scanner không tìm thấy, sử dụng API fallback${NC}"
    fi
    
    # FED swap pressure simulation
    curl -X POST "$API_BASE/api/fed/swap-simulation" \
        -H "Content-Type: application/json" \
        -d '{
            "swap_volume": 300000000,
            "overnight_rate": 5.5,
            "duration": 1800,
            "counterparty": "VIETNAM_BANKS"
        }' | jq '.'
}

# 5. World Gold Pump
world_gold_pump() {
    local target_price=${1:-2700}
    
    echo -e "${YELLOW}🚀 ĐẨY VÀNG THẾ GIỚI LÊN${NC}"
    echo -e "${GREEN}🎯 Mục tiêu: $target_price USD/oz${NC}"
    
    if [ -f "scripts/vietnam-gold-comprehensive-attack.sh" ]; then
        scripts/vietnam-gold-comprehensive-attack.sh execute_world_gold_pressure "$target_price" UP
    else
        curl -X POST "$API_BASE/api/world-gold/pressure" \
            -H "Content-Type: application/json" \
            -d '{
                "vector": "PUMP",
                "target_price": '$target_price',
                "intensity": "HIGH",
                "duration": 900
            }' | jq '.'
    fi
}

# 6. World Gold Dump
world_gold_dump() {
    local target_price=${1:-2600}
    
    echo -e "${RED}📉 ĐẨY VÀNG THẾ GIỚI XUỐNG${NC}"
    echo -e "${RED}🎯 Mục tiêu: $target_price USD/oz${NC}"
    
    if [ -f "scripts/vietnam-gold-comprehensive-attack.sh" ]; then
        scripts/vietnam-gold-comprehensive-attack.sh execute_world_gold_pressure "$target_price" DOWN
    else
        curl -X POST "$API_BASE/api/world-gold/pressure" \
            -H "Content-Type: application/json" \
            -d '{
                "vector": "DUMP",
                "target_price": '$target_price',
                "intensity": "HIGH",
                "duration": 900
            }' | jq '.'
    fi
}

# 7. London Fix Pressure
london_fix_pressure() {
    echo -e "${BLUE}🇬🇧 ÁP LỰC LONDON GOLD FIX${NC}"
    
    curl -X POST "$API_BASE/api/world-gold/london-fix-pressure" \
        -H "Content-Type: application/json" \
        -d '{
            "intensity": "EXTREME",
            "fix_time": "15:00",
            "duration": 900,
            "manipulation_vector": "BENCHMARK_DISTORTION"
        }' | jq '.'
}

# 8. Spot Gold Volatility
spot_gold_volatility() {
    echo -e "${PURPLE}⚡ BIẾN ĐỘNG VÀNG SPOT${NC}"
    
    curl -X POST "$API_BASE/api/world-gold/volatility-injection" \
        -H "Content-Type: application/json" \
        -d '{
            "volatility_factor": 4.0,
            "duration": 1200,
            "pattern": "CHAOTIC_SPIKES"
        }' | jq '.'
}

# 9. SJC Premium Crusher
sjc_premium_crusher() {
    echo -e "${RED}💀 NGHIỀN NÁT PREMIUM SJC${NC}"
    
    if [ -f "scripts/vietnam-gold-liquidity-attack.sh" ]; then
        scripts/vietnam-gold-liquidity-attack.sh high_premium_exploit
    else
        curl -X POST "$API_BASE/api/attack/sjc-premium-crush" \
            -H "Content-Type: application/json" \
            -d '{
                "target_premium": 2.0,
                "intensity": "MAXIMUM",
                "duration": 1200
            }' | jq '.'
    fi
}

# 10. SJC Liquidity Vacuum
sjc_liquidity_vacuum() {
    echo -e "${BLUE}🌪️ HÚT CẠN THANH KHOẢN SJC${NC}"
    
    if [ -f "scripts/vietnam-gold-comprehensive-attack.sh" ]; then
        scripts/vietnam-gold-comprehensive-attack.sh execute_sjc_liquidity_drain 85 10
    else
        curl -X POST "$API_BASE/api/attack/liquidity-vacuum" \
            -H "Content-Type: application/json" \
            -d '{
                "target": "SJC",
                "drain_percentage": 85,
                "waves": 10,
                "duration": 1800
            }' | jq '.'
    fi
}

# 11. SJC Spread Destroyer
sjc_spread_destroyer() {
    echo -e "${YELLOW}⚔️ PHÁ HỦY SPREAD SJC${NC}"
    
    if [ -f "scripts/vietnam-gold-liquidity-attack.sh" ]; then
        scripts/vietnam-gold-liquidity-attack.sh attack_sjc_pressure EXTREME 900
    else
        curl -X POST "$API_BASE/api/attack/spread-destroyer" \
            -H "Content-Type: application/json" \
            -d '{
                "target": "SJC",
                "target_spread": 15000,
                "intensity": "EXTREME",
                "duration": 900
            }' | jq '.'
    fi
}

# 12. SJC Monopoly Breaker
sjc_monopoly_breaker() {
    echo -e "${RED}⚡ PHÁ VỠ ĐỘC QUYỀN SJC${NC}"
    
    # Multi-vector attack on SJC monopoly
    echo -e "${YELLOW}🎯 Vector 1: Premium pressure${NC}"
    sjc_premium_crusher &
    
    echo -e "${YELLOW}🎯 Vector 2: Liquidity drainage${NC}"
    sjc_liquidity_vacuum &
    
    echo -e "${YELLOW}🎯 Vector 3: Spread compression${NC}"
    sjc_spread_destroyer &
    
    echo -e "${GREEN}✅ Ba vector monopoly breaker đã khởi chạy${NC}"
    wait
}

# 13. Synchronized Triple Attack
synchronized_triple() {
    echo -e "${BLUE}⚡ TẤN CÔNG BA MẶT TRẬN ĐỒNG BỘ${NC}"
    
    if [ -f "scripts/vietnam-gold-comprehensive-attack.sh" ]; then
        scripts/vietnam-gold-comprehensive-attack.sh execute_synchronized_triple_attack 1800
    else
        echo -e "${YELLOW}🔥 Executing inline triple attack...${NC}"
        
        # Triple vector: USD/VND + World Gold + SJC
        usdvnd_pressure_boost HIGH INCREASE &
        world_gold_pump 2720 &
        sjc_premium_crusher &
        
        echo -e "${GREEN}✅ Triple attack synchronized${NC}"
        wait
    fi
}

# 14. Global Arbitrage Exploit
global_arbitrage_exploit() {
    echo -e "${PURPLE}🌍 KHAI THÁC ARBITRAGE TOÀN CẦU${NC}"
    
    # Comprehensive arbitrage analysis
    echo -e "${BLUE}🔍 Phân tích arbitrage toàn cầu...${NC}"
    $PYTHON_SCANNER full
    
    curl -X POST "$API_BASE/api/arbitrage/global-exploit" \
        -H "Content-Type: application/json" \
        -d '{
            "markets": ["VIETNAM", "LONDON", "NEW_YORK", "SINGAPORE"],
            "intensity": "HIGH",
            "duration": 1200
        }' | jq '.'
}

# 15. Currency Gold Correlation
currency_gold_correlation() {
    echo -e "${GREEN}💱 TƯƠNG QUAN TIỀN TỆ-VÀNG${NC}"
    
    curl -X POST "$API_BASE/api/correlation/currency-gold" \
        -H "Content-Type: application/json" \
        -d '{
            "base_currency": "USD",
            "target_currency": "VND",
            "gold_markets": ["COMEX", "LBMA", "SJC"],
            "correlation_boost": 2.5
        }' | jq '.'
}

# 16. Real-time Correlation
real_time_correlation() {
    echo -e "${PURPLE}📊 TƯƠNG QUAN THỜI GIAN THỰC${NC}"
    
    while true; do
        clear
        echo -e "${BLUE}📈 REAL-TIME USD/VND + GOLD CORRELATION${NC}"
        echo "$(date)"
        echo ""
        
        echo -e "${YELLOW}💱 USD/VND Analysis:${NC}"
        $PYTHON_SCANNER quick 2>/dev/null || echo "USD/VND scanner offline"
        
        echo ""
        echo -e "${YELLOW}🥇 SJC Analysis:${NC}"
        $PYTHON_SCANNER sjc 2>/dev/null || echo "SJC scanner offline"
        
        echo ""
        echo -e "${YELLOW}🌍 World Gold:${NC}"
        curl -s "$API_BASE/api/world-gold/price" | jq '.data' 2>/dev/null || echo "World gold API offline"
        
        sleep 30
    done
}

# 17. Arbitrage Scanner
arbitrage_scanner() {
    echo -e "${CYAN}🔍 QUÉT CƠ HỘI ARBITRAGE${NC}"
    
    curl -X GET "$API_BASE/api/arbitrage/scan" | jq '.'
    
    echo -e "${BLUE}📊 Python analysis:${NC}"
    $PYTHON_SCANNER full
}

# 18. Pressure Analysis
pressure_analysis() {
    echo -e "${BLUE}📊 PHÂN TÍCH ÁP LỰC TỔNG HỢP${NC}"
    
    echo -e "${YELLOW}🔍 USD/VND Pressure:${NC}"
    $PYTHON_SCANNER usdvnd
    
    echo -e "${YELLOW}🔍 SJC Pressure:${NC}"
    $PYTHON_SCANNER sjc
    
    echo -e "${YELLOW}🔍 Overall Analysis:${NC}"
    $PYTHON_SCANNER full
}

# 19. Status Check
status_check() {
    echo -e "${CYAN}📊 TRẠNG THÁI HỆ THỐNG USD/VND + GOLD${NC}"
    
    echo -e "${BLUE}💱 USD/VND Status:${NC}"
    curl -s "$API_BASE/api/forex/status" | jq '.' || echo "Forex API offline"
    
    echo -e "${BLUE}🥇 Gold Status:${NC}"
    curl -s "$API_BASE/api/world-gold/status" | jq '.' || echo "Gold API offline"
    
    echo -e "${BLUE}🔍 Scanner Status:${NC}"
    $PYTHON_SCANNER quick || echo "Scanner offline"
}

# 20. Stop All
stop_all() {
    echo -e "${RED}⏹️ DỪNG TẤT CẢ USD/VND + GOLD ATTACKS${NC}"
    
    curl -X POST "$API_BASE/api/forex/stop-all" | jq '.' || echo "Forex stop failed"
    curl -X POST "$API_BASE/api/world-gold/stop-all" | jq '.' || echo "Gold stop failed"
    curl -X POST "$API_BASE/api/attack/stop-all" | jq '.' || echo "Attack stop failed"
    
    echo -e "${GREEN}✅ Tất cả tấn công USD/VND + Gold đã dừng${NC}"
}

# Main execution
main() {
    show_banner
    
    if [ $# -eq 0 ]; then
        show_menu
        read -p "Chọn lệnh (1-20): " choice
        echo ""
        
        case $choice in
            1|"usdvnd_pressure_boost") usdvnd_pressure_boost "${2:-MEDIUM}" "${3:-INCREASE}" ;;
            2|"usdvnd_overnight_attack") usdvnd_overnight_attack ;;
            3|"usdvnd_volatility_boost") usdvnd_volatility_boost ;;
            4|"fed_swap_simulation") fed_swap_simulation ;;
            5|"world_gold_pump") world_gold_pump "${2:-2700}" ;;
            6|"world_gold_dump") world_gold_dump "${2:-2600}" ;;
            7|"london_fix_pressure") london_fix_pressure ;;
            8|"spot_gold_volatility") spot_gold_volatility ;;
            9|"sjc_premium_crusher") sjc_premium_crusher ;;
            10|"sjc_liquidity_vacuum") sjc_liquidity_vacuum ;;
            11|"sjc_spread_destroyer") sjc_spread_destroyer ;;
            12|"sjc_monopoly_breaker") sjc_monopoly_breaker ;;
            13|"synchronized_triple") synchronized_triple ;;
            14|"global_arbitrage_exploit") global_arbitrage_exploit ;;
            15|"currency_gold_correlation") currency_gold_correlation ;;
            16|"real_time_correlation") real_time_correlation ;;
            17|"arbitrage_scanner") arbitrage_scanner ;;
            18|"pressure_analysis") pressure_analysis ;;
            19|"status") status_check ;;
            20|"stop_all") stop_all ;;
            *) echo -e "${RED}❌ Lựa chọn không hợp lệ!${NC}" ;;
        esac
    else
        # Command line mode
        case "${1}" in
            "usdvnd_pressure_boost"|"1") usdvnd_pressure_boost "${2:-MEDIUM}" "${3:-INCREASE}" ;;
            "usdvnd_overnight_attack"|"2") usdvnd_overnight_attack ;;
            "usdvnd_volatility_boost"|"3") usdvnd_volatility_boost ;;
            "fed_swap_simulation"|"4") fed_swap_simulation ;;
            "world_gold_pump"|"5") world_gold_pump "${2:-2700}" ;;
            "world_gold_dump"|"6") world_gold_dump "${2:-2600}" ;;
            "london_fix_pressure"|"7") london_fix_pressure ;;
            "spot_gold_volatility"|"8") spot_gold_volatility ;;
            "sjc_premium_crusher"|"9") sjc_premium_crusher ;;
            "sjc_liquidity_vacuum"|"10") sjc_liquidity_vacuum ;;
            "sjc_spread_destroyer"|"11") sjc_spread_destroyer ;;
            "sjc_monopoly_breaker"|"12") sjc_monopoly_breaker ;;
            "synchronized_triple"|"13") synchronized_triple ;;
            "global_arbitrage_exploit"|"14") global_arbitrage_exploit ;;
            "currency_gold_correlation"|"15") currency_gold_correlation ;;
            "real_time_correlation"|"16") real_time_correlation ;;
            "arbitrage_scanner"|"17") arbitrage_scanner ;;
            "pressure_analysis"|"18") pressure_analysis ;;
            "status"|"19") status_check ;;
            "stop_all"|"20") stop_all ;;
            "help"|"--help"|"-h") show_menu ;;
            *) echo -e "${RED}❌ Lệnh không hợp lệ: $1${NC}" && show_menu ;;
        esac
    fi
}

# Execute main function
main "$@"
