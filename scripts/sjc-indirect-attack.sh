
#!/bin/bash

# SJC Indirect Pressure Attack Script
# Tấn công áp lực gián tiếp để buộc SJC giảm chênh lệch giá

API_BASE="http://localhost:5000"
LOG_FILE="sjc_pressure_attack.log"

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

show_banner() {
    echo -e "${RED}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║             SJC INDIRECT PRESSURE ATTACK v3.0               ║"
    echo "║        🚨 BUỘC SJC GIẢM CHÊNH LỆCH VỚI GIÁ THẾ GIỚI 🚨      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Tấn công áp lực gián tiếp chính
execute_indirect_pressure() {
    local intensity="$1"
    
    echo -e "${RED}🚨 KHỞI ĐỘNG TẤN CÔNG ÁP LỰC GIÁN TIẾP SJC${NC}"
    echo -e "${YELLOW}⚔️ Cường độ: $intensity${NC}"
    
    log_attack "🚨 Bắt đầu tấn công áp lực gián tiếp SJC - Cường độ: $intensity"
    
    local response=$(curl -s -X POST "$API_BASE/api/sjc/indirect-pressure" \
        -H "Content-Type: application/json" \
        -d '{
            "intensity": "'$intensity'"
        }')
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Tấn công đã được khởi động${NC}"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        log_attack "✅ Tấn công áp lực gián tiếp khởi động thành công"
    else
        echo -e "${RED}❌ Lỗi khởi động tấn công${NC}"
        log_attack "❌ Lỗi khởi động tấn công áp lực gián tiếp"
    fi
}

# Tấn công nhanh
quick_pressure() {
    echo -e "${PURPLE}⚡ TẤN CÔNG ÁP LỰC NHANH${NC}"
    
    curl -s -X POST "$API_BASE/api/sjc/quick-pressure" \
        -H "Content-Type: application/json" \
        -d '{
            "intensity": "EXTREME",
            "target_gap_percent": 1.5,
            "duration_minutes": 15
        }' | jq '.'
    
    log_attack "⚡ Thực hiện tấn công áp lực nhanh"
}

# Giám sát trạng thái
monitor_attacks() {
    echo -e "${BLUE}📊 GIÁM SÁT TRẠNG THÁI TẤN CÔNG${NC}"
    
    while true; do
        echo -e "${BLUE}$(date '+%H:%M:%S') - Kiểm tra trạng thái...${NC}"
        
        curl -s "$API_BASE/api/sjc/active-pressures" | jq '.data.pressures[] | {
            pressure_id: .pressure_id,
            status: .status,
            duration_seconds: (.duration / 1000),
            financial_impact: .financial_impact,
            sjc_errors: .sjc_response.websiteErrors
        }' 2>/dev/null
        
        sleep 30
    done
}

# Bombardment mode - tấn công liên tục
bombardment_mode() {
    local cycles=${1:-20}
    
    echo -e "${RED}💥 BOMBARDMENT MODE - $cycles CYCLES${NC}"
    log_attack "💥 Bắt đầu bombardment mode với $cycles cycles"
    
    for ((i=1; i<=cycles; i++)); do
        echo -e "${RED}💥 BOMBARDMENT CYCLE $i/$cycles${NC}"
        
        # Tấn công với cường độ ngẫu nhiên
        local intensities=("HIGH" "EXTREME")
        local intensity=${intensities[$((RANDOM % 2))]}
        
        execute_indirect_pressure "$intensity"
        
        # Delay ngẫu nhiên giữa các cycles
        local delay=$((30 + RANDOM % 60))
        echo -e "${YELLOW}⏱️ Waiting $delay seconds...${NC}"
        sleep "$delay"
        
        # Kiểm tra kết quả mỗi 5 cycles
        if [ $((i % 5)) -eq 0 ]; then
            echo -e "${BLUE}📊 Progress check - Cycle $i completed${NC}"
            curl -s "$API_BASE/api/sjc/system-status" | jq '.data' 2>/dev/null
        fi
    done
    
    log_attack "💥 Bombardment mode hoàn thành - $cycles cycles"
}

# Stealth mode
stealth_mode() {
    echo -e "${BLUE}👤 STEALTH MODE${NC}"
    log_attack "👤 Bắt đầu stealth mode"
    
    for ((i=1; i<=15; i++)); do
        echo -e "${BLUE}👤 Stealth Attack $i/15${NC}"
        
        execute_indirect_pressure "MEDIUM"
        
        # Delay dài để tránh phát hiện
        local stealth_delay=$((120 + RANDOM % 180))
        echo -e "${BLUE}👤 Stealth delay: $stealth_delay seconds${NC}"
        sleep "$stealth_delay"
    done
    
    log_attack "👤 Stealth mode hoàn thành"
}

# Help
show_help() {
    echo "Usage: $0 [MODE]"
    echo ""
    echo "Available modes:"
    echo "  high         - Tấn công cường độ cao"
    echo "  extreme      - Tấn công cường độ cực đại"
    echo "  quick        - Tấn công nhanh 15 phút"
    echo "  bombardment  - Bombardment 20 cycles"
    echo "  stealth      - Stealth mode tránh phát hiện"
    echo "  monitor      - Giám sát trạng thái liên tục"
    echo "  help         - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 extreme"
    echo "  $0 bombardment"
    echo "  $0 stealth"
}

# Main execution
main() {
    show_banner
    
    case "${1:-}" in
        "high")
            execute_indirect_pressure "HIGH"
            ;;
        "extreme")
            execute_indirect_pressure "EXTREME"
            ;;
        "quick")
            quick_pressure
            ;;
        "bombardment")
            bombardment_mode 20
            ;;
        "stealth")
            stealth_mode
            ;;
        "monitor")
            monitor_attacks
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        "")
            echo -e "${YELLOW}No mode specified. Use 'help' for available options.${NC}"
            show_help
            ;;
        *)
            echo -e "${RED}Invalid mode: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Check server
if ! curl -s "$API_BASE/api/positions" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server not running on $API_BASE${NC}"
    echo -e "${YELLOW}Please start the server first${NC}"
    exit 1
fi

main "$@"
