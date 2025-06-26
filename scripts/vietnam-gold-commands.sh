#!/bin/bash

# Vietnam Gold Liquidity Scanner Commands
# Các lệnh quét thanh khoản vàng Việt Nam với thuật toán áp lực USD/VND

set -e

# Configuration
API_BASE="http://localhost:5000"
PYTHON_SCANNER="./scripts/vietnam-gold-pressure-scanner.py"
LOG_DIR="./logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Create logs directory if not exists
mkdir -p "$LOG_DIR"

# Helper functions
log_command() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/vietnam_gold_commands_${TIMESTAMP}.log"
}

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║               VIETNAM GOLD LIQUIDITY SCANNER               ║${NC}"
    echo -e "${BLUE}║           Quét Thanh Khoản Vàng Việt Nam với USD/VND      ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Command 1: Quét áp lực vàng toàn diện
scan_full_pressure() {
    echo -e "${GREEN}🚀 LỆNH 1: QUÉT ÁP LỰC VÀNG TOÀN DIỆN${NC}"
    log_command "Executing full pressure scan"
    
    echo -e "${YELLOW}Đang khởi chạy thuật toán áp lực USD/VND...${NC}"
    python3 "$PYTHON_SCANNER" full
    
    echo -e "${CYAN}✅ Hoàn thành quét áp lực toàn diện${NC}"
}

# Command 2: Quét nhanh chỉ tỷ giá
scan_quick_exchange() {
    echo -e "${GREEN}🚀 LỆNH 2: QUÉT NHANH TỶ GIÁ USD/VND${NC}"
    log_command "Executing quick exchange rate scan"
    
    echo -e "${YELLOW}Đang lấy tỷ giá USD/VND thời gian thực...${NC}"
    python3 "$PYTHON_SCANNER" quick
    
    echo -e "${CYAN}✅ Hoàn thành quét nhanh tỷ giá${NC}"
}

# Command 3: Tấn công áp lực SJC cao
attack_sjc_high() {
    local duration=${1:-300}
    echo -e "${RED}🚀 LỆNH 3: TẤN CÔNG ÁP LỰC SJC CAO${NC}"
    log_command "Executing SJC high pressure attack for ${duration}s"
    
    echo -e "${YELLOW}Đang khởi chạy tấn công áp lực SJC cường độ cao...${NC}"
    curl -X POST "$API_BASE/api/vietnam-gold/pressure-attack" \
        -H "Content-Type: application/json" \
        -d '{
            "targets": ["SJC", "DOJI"],
            "intensity": "high",
            "duration": '${duration}',
            "stealth_mode": true
        }' | jq '.' || echo "API không phản hồi"
    
    echo -e "${CYAN}✅ Hoàn thành tấn công áp lực SJC${NC}"
}

# Command 4: Quét vulnerability tất cả nguồn
scan_vulnerabilities() {
    echo -e "${GREEN}🚀 LỆNH 4: QUÉT VULNERABILITY TẤT CẢ NGUỒN${NC}"
    log_command "Scanning vulnerabilities across all sources"
    
    echo -e "${YELLOW}Đang phân tích điểm yếu các nguồn giá vàng...${NC}"
    curl -X GET "$API_BASE/api/vietnam-gold/vulnerability-analysis" | jq '.' || echo "API không phản hồi"
    
    echo -e "${CYAN}✅ Hoàn thành quét vulnerability${NC}"
}

# Command 5: Theo dõi giá vàng real-time
monitor_realtime() {
    local interval=${1:-30}
    echo -e "${GREEN}🚀 LỆNH 5: THEO DÕI GIÁ VÀNG REAL-TIME${NC}"
    log_command "Starting real-time monitoring with ${interval}s interval"
    
    echo -e "${YELLOW}Đang theo dõi giá vàng mỗi ${interval} giây (Nhấn Ctrl+C để dừng)...${NC}"
    
    while true; do
        echo -e "${PURPLE}$(date '+%H:%M:%S') - Đang cập nhật giá...${NC}"
        curl -s "$API_BASE/api/vietnam-gold/prices" | jq '.data.prices[] | {source: .source, buy: .buy, sell: .sell, spread: .spread}' || echo "Lỗi lấy dữ liệu"
        echo "---"
        sleep "$interval"
    done
}

# Command 6: Phân tích arbitrage cơ hội
analyze_arbitrage() {
    echo -e "${GREEN}🚀 LỆNH 6: PHÂN TÍCH CƠ HỘI ARBITRAGE${NC}"
    log_command "Analyzing arbitrage opportunities"
    
    echo -e "${YELLOW}Đang tính toán cơ hội arbitrage giữa các nguồn...${NC}"
    
    # Get Vietnam prices
    vn_prices=$(curl -s "$API_BASE/api/vietnam-gold/prices" | jq '.data.prices // []')
    
    # Calculate arbitrage opportunities
    echo "$vn_prices" | jq '
    map(select(.buy and .sell)) |
    sort_by(.buy) |
    {
        lowest_buy: .[0],
        highest_sell: .[-1],
        arbitrage_opportunity: ((.[-1].sell - .[0].buy) / .[0].buy * 100)
    }' || echo "Không thể tính arbitrage"
    
    echo -e "${CYAN}✅ Hoàn thành phân tích arbitrage${NC}"
}

# Command 7: Test kết nối tất cả API
test_connections() {
    echo -e "${GREEN}🚀 LỆNH 7: TEST KẾT NỐI TẤT CẢ API${NC}"
    log_command "Testing all API connections"
    
    echo -e "${YELLOW}Đang kiểm tra kết nối đến các API...${NC}"
    
    # Test local API
    echo -e "🔗 Local Vietnam Gold API:"
    curl -s "$API_BASE/api/vietnam-gold/prices" > /dev/null && echo "✅ OK" || echo "❌ Failed"
    
    # Test USD/VND rate
    echo -e "🔗 USD/VND Exchange Rate API:"
    curl -s "https://markets.newyorkfed.org/api/fxs/all/latest.json" > /dev/null && echo "✅ OK" || echo "❌ Failed"
    
    # Test world gold price
    echo -e "🔗 World Gold Price API:"
    curl -s "https://goldprice.org/api/json/goldapi-a1omwe19mc2bnqkx-io" > /dev/null && echo "✅ OK" || echo "❌ Failed"
    
    echo -e "${CYAN}✅ Hoàn thành test kết nối${NC}"
}

# Command 8: Báo cáo tổng hợp hàng ngày
generate_daily_report() {
    echo -e "${GREEN}🚀 LỆNH 8: TẠO BÁO CÁO TỔNG HỢP HÀNG NGÀY${NC}"
    log_command "Generating daily comprehensive report"
    
    local report_file="$LOG_DIR/daily_report_${TIMESTAMP}.json"
    
    echo -e "${YELLOW}Đang tạo báo cáo tổng hợp...${NC}"
    
    # Run comprehensive scan and save results
    python3 "$PYTHON_SCANNER" full > "$report_file.tmp"
    
    # Add system status
    echo "{" > "$report_file"
    echo "  \"report_timestamp\": \"$(date -Iseconds)\"," >> "$report_file"
    echo "  \"system_status\": {" >> "$report_file"
    echo "    \"api_status\": \"$(curl -s "$API_BASE/api/vietnam-gold/prices" > /dev/null && echo 'online' || echo 'offline')\"," >> "$report_file"
    echo "    \"scan_duration\": \"$(date '+%s')\"" >> "$report_file"
    echo "  }," >> "$report_file"
    echo "  \"scan_results\": " >> "$report_file"
    
    # Add scan results (if available)
    if [ -f "$report_file.tmp" ]; then
        cat "$report_file.tmp" >> "$report_file" || echo "null" >> "$report_file"
        rm "$report_file.tmp"
    else
        echo "null" >> "$report_file"
    fi
    
    echo "}" >> "$report_file"
    
    echo -e "${CYAN}✅ Báo cáo đã lưu tại: $report_file${NC}"
}

# Main menu
show_menu() {
    print_header
    echo -e "${YELLOW}Chọn lệnh để thực hiện:${NC}"
    echo ""
    echo -e "${GREEN}1.${NC} Quét áp lực vàng toàn diện (Full pressure scan)"
    echo -e "${GREEN}2.${NC} Quét nhanh tỷ giá USD/VND (Quick exchange scan)"
    echo -e "${RED}3.${NC} Tấn công áp lực SJC cao (SJC high pressure attack)"
    echo -e "${GREEN}4.${NC} Quét vulnerability tất cả nguồn (Vulnerability scan)"
    echo -e "${BLUE}5.${NC} Theo dõi real-time (Real-time monitoring)"
    echo -e "${PURPLE}6.${NC} Phân tích arbitrage (Arbitrage analysis)"
    echo -e "${CYAN}7.${NC} Test kết nối API (API connection test)"
    echo -e "${YELLOW}8.${NC} Báo cáo tổng hợp (Daily report)"
    echo -e "${NC}9.${NC} Thoát (Exit)"
    echo ""
}

# Command line interface
if [ $# -eq 0 ]; then
    # Interactive mode
    while true; do
        show_menu
        read -p "Nhập lựa chọn (1-9): " choice
        echo ""
        
        case $choice in
            1) scan_full_pressure ;;
            2) scan_quick_exchange ;;
            3) 
                read -p "Nhập thời gian tấn công (giây, mặc định 300): " duration
                attack_sjc_high "${duration:-300}"
                ;;
            4) scan_vulnerabilities ;;
            5) 
                read -p "Nhập khoảng thời gian theo dõi (giây, mặc định 30): " interval
                monitor_realtime "${interval:-30}"
                ;;
            6) analyze_arbitrage ;;
            7) test_connections ;;
            8) generate_daily_report ;;
            9) echo "Thoát chương trình."; exit 0 ;;
            *) echo -e "${RED}Lựa chọn không hợp lệ!${NC}" ;;
        esac
        
        echo ""
        read -p "Nhấn Enter để tiếp tục..."
        clear
    done
else
    # Command line mode
    case $1 in
        "scan-full") scan_full_pressure ;;
        "scan-quick") scan_quick_exchange ;;
        "attack-sjc") attack_sjc_high "${2:-300}" ;;
        "scan-vuln") scan_vulnerabilities ;;
        "monitor") monitor_realtime "${2:-30}" ;;
        "arbitrage") analyze_arbitrage ;;
        "test") test_connections ;;
        "report") generate_daily_report ;;
        *)
            echo "Sử dụng: $0 [command] [options]"
            echo "Commands:"
            echo "  scan-full     - Quét áp lực toàn diện"
            echo "  scan-quick    - Quét nhanh tỷ giá"
            echo "  attack-sjc    - Tấn công áp lực SJC [duration]"
            echo "  scan-vuln     - Quét vulnerability"
            echo "  monitor       - Theo dõi real-time [interval]"
            echo "  arbitrage     - Phân tích arbitrage"
            echo "  test          - Test kết nối API"
            echo "  report        - Tạo báo cáo tổng hợp"
            ;;
    esac
fi