
#!/bin/bash

# Vietnam Gold Broker Attack Script
# Advanced pressure attack system through broker intermediary

set -e

API_BASE="http://localhost:5000"
LOG_FILE="vietnam_broker_attack.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging
log_attack() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Banner
show_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║           🇻🇳 VIETNAM GOLD BROKER ATTACK SYSTEM 🇻🇳         ║"
    echo "║              Intelligent Pressure Through Broker            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Get current prices
get_current_prices() {
    echo -e "${BLUE}📊 Getting current Vietnamese gold prices...${NC}"
    
    local response=$(curl -s "$API_BASE/api/vietnam-gold/prices")
    
    if [ $? -eq 0 ]; then
        echo "$response" | jq '.data.prices[] | "\(.source): Mua \(.buy | tostring | tonumber | . / 1000000 | floor)tr \(.sell | tostring | tonumber | . / 1000000 | floor)tr (Spread: \(.spread | tostring | tonumber | . / 1000 | floor)k)"' -r
        echo -e "${GREEN}✅ Price data retrieved successfully${NC}"
    else
        echo -e "${RED}❌ Failed to get prices${NC}"
    fi
}

# Execute pressure attack
execute_pressure_attack() {
    local targets="$1"
    local intensity="$2"
    local duration="$3"
    
    echo -e "${RED}⚔️ EXECUTING PRESSURE ATTACK THROUGH BROKER${NC}"
    echo -e "${YELLOW}🎯 Targets: $targets${NC}"
    echo -e "${YELLOW}🔥 Intensity: $intensity${NC}"
    echo -e "${YELLOW}⏱️ Duration: $duration minutes${NC}"
    
    local payload='{
        "targets": '$targets',
        "intensity": "'$intensity'",
        "duration": '$duration',
        "stealth_mode": true
    }'
    
    local response=$(curl -s -X POST "$API_BASE/api/vietnam-gold/pressure-attack" \
        -H "Content-Type: application/json" \
        -d "$payload")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Pressure attack initiated${NC}"
        echo "$response" | jq '.'
        log_attack "Pressure attack executed: $intensity on $targets"
    else
        echo -e "${RED}❌ Pressure attack failed${NC}"
        log_attack "Pressure attack failed"
    fi
}

# Quick attack on specific target
quick_attack() {
    local target="$1"
    local intensity="${2:-moderate}"
    
    echo -e "${RED}⚡ QUICK ATTACK ON $target${NC}"
    
    local payload='{"intensity": "'$intensity'"}'
    
    local response=$(curl -s -X POST "$API_BASE/api/vietnam-gold/quick-attack/$target" \
        -H "Content-Type: application/json" \
        -d "$payload")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Quick attack on $target initiated${NC}"
        echo "$response" | jq '.'
        log_attack "Quick attack on $target with $intensity intensity"
    else
        echo -e "${RED}❌ Quick attack failed${NC}"
    fi
}

# Devastation attack (all targets)
devastation_attack() {
    echo -e "${RED}💀 INITIATING DEVASTATION ATTACK${NC}"
    echo -e "${RED}⚠️ WARNING: MAXIMUM MARKET DISRUPTION${NC}"
    
    local response=$(curl -s -X POST "$API_BASE/api/vietnam-gold/devastation-attack")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Devastation attack initiated${NC}"
        echo "$response" | jq '.'
        log_attack "DEVASTATION ATTACK executed - maximum disruption"
    else
        echo -e "${RED}❌ Devastation attack failed${NC}"
    fi
}

# Vulnerability analysis
vulnerability_analysis() {
    echo -e "${BLUE}🔍 ANALYZING MARKET VULNERABILITIES${NC}"
    
    local response=$(curl -s "$API_BASE/api/vietnam-gold/vulnerability-analysis")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Vulnerability analysis completed${NC}"
        echo "$response" | jq '.data.analysis[] | "🎯 \(.source): Vulnerability \(.vulnerability_score)/10 - \(.attack_recommendation)"' -r
        
        local highest=$(echo "$response" | jq -r '.data.highest_vulnerability')
        local ready_count=$(echo "$response" | jq -r '.data.attack_ready_count')
        
        echo -e "${PURPLE}📈 Highest vulnerability: $highest${NC}"
        echo -e "${PURPLE}🚨 Targets ready for attack: $ready_count${NC}"
        
        if [ "$ready_count" -gt 0 ]; then
            echo -e "${RED}⚔️ RECOMMENDATION: IMMEDIATE ATTACK${NC}"
        fi
        
    else
        echo -e "${RED}❌ Vulnerability analysis failed${NC}"
    fi
}

# Get broker status
broker_status() {
    echo -e "${BLUE}📊 CHECKING BROKER STATUS${NC}"
    
    local response=$(curl -s "$API_BASE/api/vietnam-gold/broker-status")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Broker status retrieved${NC}"
        echo "$response" | jq '.'
    else
        echo -e "${RED}❌ Failed to get broker status${NC}"
    fi
}

# Get active orders
active_orders() {
    echo -e "${BLUE}📋 GETTING ACTIVE BROKER ORDERS${NC}"
    
    local response=$(curl -s "$API_BASE/api/vietnam-gold/broker-orders")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Active orders retrieved${NC}"
        echo "$response" | jq '.data.orders[] | "📝 \(.id): \(.side | ascii_upcase) \(.volume)kg \(.target) @ \(.price | tostring | tonumber | . / 1000000 | floor)tr"' -r
    else
        echo -e "${RED}❌ Failed to get active orders${NC}"
    fi
}

# Coordinated multi-phase attack
coordinated_attack() {
    echo -e "${PURPLE}🎯 INITIATING COORDINATED MULTI-PHASE ATTACK${NC}"
    
    # Phase 1: Reconnaissance
    echo -e "${BLUE}Phase 1: Market Reconnaissance${NC}"
    vulnerability_analysis
    sleep 3
    
    # Phase 2: Targeted attacks on high vulnerability targets
    echo -e "${YELLOW}Phase 2: Targeted Pressure Attacks${NC}"
    quick_attack "SJC" "aggressive"
    sleep 5
    quick_attack "DOJI" "moderate"
    sleep 5
    quick_attack "PNJ" "aggressive"
    sleep 5
    
    # Phase 3: Coordinated pressure
    echo -e "${RED}Phase 3: Coordinated Market Pressure${NC}"
    execute_pressure_attack '["SJC", "DOJI", "PNJ"]' "aggressive" 20
    sleep 10
    
    # Phase 4: Status check
    echo -e "${GREEN}Phase 4: Post-Attack Analysis${NC}"
    active_orders
    get_current_prices
    
    log_attack "Coordinated multi-phase attack completed"
}

# Stealth continuous attack
stealth_attack() {
    local cycles="${1:-10}"
    echo -e "${BLUE}👤 INITIATING STEALTH CONTINUOUS ATTACK${NC}"
    echo -e "${BLUE}🔄 Cycles: $cycles${NC}"
    
    for ((i=1; i<=cycles; i++)); do
        echo -e "${BLUE}👤 Stealth Cycle $i/$cycles${NC}"
        
        # Random target and intensity
        local targets=("SJC" "DOJI" "PNJ")
        local intensities=("subtle" "moderate")
        local target=${targets[$RANDOM % ${#targets[@]}]}
        local intensity=${intensities[$RANDOM % ${#intensities[@]}]}
        
        quick_attack "$target" "$intensity"
        
        # Random stealth delay (30-90 seconds)
        local delay=$((30 + $RANDOM % 60))
        echo -e "${BLUE}👤 Stealth delay: $delay seconds${NC}"
        sleep "$delay"
    done
    
    log_attack "Stealth attack completed - $cycles cycles"
}

# Help function
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Available commands:"
    echo "  prices           - Hiển thị giá vàng hiện tại"
    echo "  status           - Kiểm tra trạng thái broker"
    echo "  orders           - Xem lệnh đang hoạt động"
    echo "  vulnerability    - Phân tích điểm yếu thị trường"
    echo "  quick [TARGET]   - Tấn công nhanh (SJC/DOJI/PNJ)"
    echo "  pressure         - Tấn công áp lực phối hợp"
    echo "  devastation      - Tấn công devastation (tối đa)"
    echo "  coordinated      - Tấn công phối hợp nhiều giai đoạn"
    echo "  stealth [CYCLES] - Tấn công stealth liên tục"
    echo "  help             - Hiển thị trợ giúp"
    echo ""
    echo "Examples:"
    echo "  $0 prices"
    echo "  $0 quick SJC"
    echo "  $0 coordinated"
    echo "  $0 stealth 20"
}

# Main execution
main() {
    show_banner
    
    case "${1:-}" in
        "prices")
            get_current_prices
            ;;
        "status")
            broker_status
            ;;
        "orders")
            active_orders
            ;;
        "vulnerability")
            vulnerability_analysis
            ;;
        "quick")
            if [ -z "$2" ]; then
                echo -e "${RED}❌ Please specify target: SJC, DOJI, or PNJ${NC}"
                exit 1
            fi
            quick_attack "$2" "${3:-moderate}"
            ;;
        "pressure")
            execute_pressure_attack '["SJC", "DOJI", "PNJ"]' "aggressive" 15
            ;;
        "devastation")
            devastation_attack
            ;;
        "coordinated")
            coordinated_attack
            ;;
        "stealth")
            stealth_attack "${2:-10}"
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        "")
            echo -e "${YELLOW}No command specified. Use 'help' for available options.${NC}"
            show_help
            ;;
        *)
            echo -e "${RED}Invalid command: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Check server availability
if ! curl -s "$API_BASE/api/vietnam-gold/broker-status" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server not available at $API_BASE${NC}"
    echo -e "${YELLOW}Please start the Vietnam Gold Broker System first${NC}"
    exit 1
fi

# Execute main function
main "$@"
