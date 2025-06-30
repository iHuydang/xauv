
#!/bin/bash

# Kill Spread Arsenal - Vũ khí tiêu diệt spread
# Hệ thống vũ khí mạnh nhất để chống độc quyền thị trường vàng

API_BASE="http://localhost:5000"
LOG_FILE="kill_spread_arsenal.log"

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
    echo "║                KILL SPREAD ARSENAL v3.0                     ║"
    echo "║        🚨 VŨ KHÍ TIÊU DIỆT SPREAD MẠNH NHẤT 🚨              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

perfect_ai_attack() {
    echo -e "${PURPLE}🤖 PERFECT AI ATTACK MODE${NC}"
    log_attack "🤖 Starting Perfect AI Attack"
    
    python3 ./scripts/perfect-ai-gold-intervention.py
    
    # Enhanced AI attack
    curl -s -X POST "$API_BASE/api/gold-attack/coordinated" \
        -H "Content-Type: application/json" \
        -d '{
            "attack_type": "PERFECT_AI",
            "intensity": "MAXIMUM",
            "ai_enhancement": true,
            "effectiveness_target": 95
        }' | jq '.'
}

emergency_intervention() {
    echo -e "${RED}🚨 EMERGENCY INTERVENTION${NC}"
    log_attack "🚨 Emergency intervention activated"
    
    curl -s -X POST "$API_BASE/api/gold-attack/stealth" \
        -H "Content-Type: application/json" \
        -d '{
            "intensity": "EXTREME",
            "emergency_mode": true,
            "duration_minutes": 30
        }' | jq '.'
}

all_vectors_attack() {
    echo -e "${YELLOW}⚔️ ALL VECTORS ATTACK${NC}"
    log_attack "⚔️ All vectors attack initiated"
    
    # Execute multiple attack vectors simultaneously
    ./scripts/vietnam-gold-destroyer.sh coordinated &
    ./scripts/multi-ip-gold-attack.sh devastation &
    ./scripts/sjc-indirect-attack.sh extreme &
    
    wait
    echo -e "${GREEN}✅ All vectors completed${NC}"
}

coordinated_attack() {
    echo -e "${BLUE}🎯 COORDINATED ATTACK${NC}"
    log_attack "🎯 Coordinated attack started"
    
    curl -s -X POST "$API_BASE/api/gold-attack/coordinated" \
        -H "Content-Type: application/json" \
        -d '{
            "attack_type": "COORDINATED_ARSENAL",
            "intensity": "EXTREME",
            "duration_minutes": 45,
            "volume_multiplier": 15.0
        }' | jq '.'
}

monitor_monopoly() {
    echo -e "${GREEN}📊 MONOPOLY MONITORING${NC}"
    log_attack "📊 Starting monopoly monitoring"
    
    while true; do
        echo -e "${BLUE}$(date '+%H:%M:%S') - Monopoly check...${NC}"
        
        curl -s "$API_BASE/api/gold-attack/recommendations" | jq '.data.recommendations[] | {
            target: .target,
            vulnerability: .vulnerability,
            recommended_action: .recommended_vector
        }' 2>/dev/null
        
        sleep 30
    done
}

show_help() {
    echo "Usage: $0 [MODE]"
    echo ""
    echo "Available arsenal modes:"
    echo "  perfect-ai           - Perfect AI attack (95% effectiveness)"
    echo "  emergency-intervention - Emergency intervention"
    echo "  all-vectors          - All attack vectors simultaneously"
    echo "  coordinated-attack   - Coordinated multi-vector attack"
    echo "  monitor-monopoly     - Monitor and counter monopoly"
    echo "  help                 - Show this help"
}

main() {
    show_banner
    
    case "${1:-}" in
        "perfect-ai")
            perfect_ai_attack
            ;;
        "emergency-intervention")
            emergency_intervention
            ;;
        "all-vectors")
            all_vectors_attack
            ;;
        "coordinated-attack")
            coordinated_attack
            ;;
        "monitor-monopoly")
            monitor_monopoly
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

# Check if server is running
if ! curl -s "$API_BASE/api/positions" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server not running on $API_BASE${NC}"
    echo -e "${YELLOW}Please start the server first${NC}"
    exit 1
fi

main "$@"
#!/bin/bash

# Kill Spread Arsenal
# Kho vũ khí chuyên tiêu diệt spread cao của SJC

set -e

# Configuration
API_BASE="http://localhost:5000"
TARGET_SPREAD=20000  # Target spread to achieve (20k VND)
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
    echo -e "${RED}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              💀 KILL SPREAD ARSENAL 💀                    ║"
    echo "║            Kho vũ khí tiêu diệt spread cao                 ║"
    echo "║              🎯 Target: ${TARGET_SPREAD} VND                        ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 1. Rapid Spread Killer - Tiêu diệt spread nhanh
rapid_spread_killer() {
    local target_spread=${1:-$TARGET_SPREAD}
    
    echo -e "${RED}⚡ RAPID SPREAD KILLER${NC}"
    echo -e "${YELLOW}🎯 Target spread: ${target_spread} VND${NC}"
    
    # High frequency micro-attacks
    for i in {1..10}; do
        echo -e "${RED}⚡ Micro-attack $i/10${NC}"
        curl -X POST "$API_BASE/api/attack/spread-kill" \
            -H "Content-Type: application/json" \
            -d '{
                "vector": "MICRO_PRESSURE",
                "target_spread": '$target_spread',
                "intensity": "HIGH",
                "duration": 10
            }' &
        sleep 2
    done
    wait
    
    echo -e "${GREEN}✅ Rapid spread killer completed${NC}"
}

# 2. Spread Compression Algorithm
spread_compression() {
    local compression_ratio=${1:-0.7}  # Compress to 70% of current
    
    echo -e "${BLUE}🗜️ SPREAD COMPRESSION ALGORITHM${NC}"
    echo -e "${YELLOW}📊 Compression ratio: ${compression_ratio}${NC}"
    
    # Get current spread
    current_data=$($PYTHON_SCANNER sjc 2>/dev/null || echo '{"spread": 50000}')
    current_spread=$(echo "$current_data" | jq -r '.spread // 50000')
    target_spread=$(echo "$current_spread * $compression_ratio" | bc | cut -d. -f1)
    
    echo -e "${BLUE}📊 Current spread: ${current_spread} VND${NC}"
    echo -e "${BLUE}🎯 Target spread: ${target_spread} VND${NC}"
    
    curl -X POST "$API_BASE/api/attack/spread-compression" \
        -H "Content-Type: application/json" \
        -d '{
            "algorithm": "GRADUAL_COMPRESSION",
            "current_spread": '$current_spread',
            "target_spread": '$target_spread',
            "compression_steps": 10,
            "duration": 600
        }' | jq '.'
}

# 3. Spread Arbitrage Exploit
spread_arbitrage_exploit() {
    echo -e "${PURPLE}💰 SPREAD ARBITRAGE EXPLOIT${NC}"
    
    # Exploit spread differences between sources
    curl -X POST "$API_BASE/api/arbitrage/spread-exploit" \
        -H "Content-Type: application/json" \
        -d '{
            "strategy": "CROSS_SOURCE_ARBITRAGE",
            "sources": ["SJC", "DOJI", "PNJ"],
            "min_spread_diff": 10000,
            "intensity": "HIGH"
        }' | jq '.'
}

# 4. Liquidity Injection Attack
liquidity_injection() {
    local injection_volume=${1:-1000000000}  # 1B VND
    
    echo -e "${GREEN}💉 LIQUIDITY INJECTION ATTACK${NC}"
    echo -e "${YELLOW}💰 Injection volume: ${injection_volume} VND${NC}"
    
    curl -X POST "$API_BASE/api/attack/liquidity-injection" \
        -H "Content-Type: application/json" \
        -d '{
            "volume": '$injection_volume',
            "injection_pattern": "BURST_THEN_SUSTAIN",
            "target": "SPREAD_REDUCTION",
            "duration": 900
        }' | jq '.'
}

# 5. Market Maker Interference
market_maker_interference() {
    echo -e "${RED}🤖 MARKET MAKER INTERFERENCE${NC}"
    
    # Interfere with market makers to reduce spread
    curl -X POST "$API_BASE/api/attack/mm-interference" \
        -H "Content-Type: application/json" \
        -d '{
            "interference_type": "SPREAD_COMPRESSION",
            "target_mm": "ALL",
            "intensity": "EXTREME",
            "duration": 1200
        }' | jq '.'
}

# 6. Spread Monitor & Auto Kill
spread_monitor_auto_kill() {
    local monitor_threshold=${1:-40000}
    local check_interval=${2:-30}
    
    echo -e "${CYAN}📊 SPREAD MONITOR & AUTO KILL${NC}"
    echo -e "${YELLOW}🚨 Threshold: ${monitor_threshold} VND${NC}"
    echo -e "${YELLOW}⏱️ Check interval: ${check_interval}s${NC}"
    
    while true; do
        # Check current spread
        current_data=$($PYTHON_SCANNER sjc 2>/dev/null || echo '{"spread": 0}')
        current_spread=$(echo "$current_data" | jq -r '.spread // 0')
        
        if [ "$current_spread" -gt "$monitor_threshold" ]; then
            echo -e "${RED}🚨 High spread detected: ${current_spread} VND${NC}"
            echo -e "${RED}⚡ Launching auto spread killer...${NC}"
            
            rapid_spread_killer "$TARGET_SPREAD" &
            spread_compression 0.6 &
            
            echo -e "${GREEN}✅ Auto kill launched${NC}"
            sleep 120  # Wait 2 minutes before next check
        else
            echo -e "${GREEN}✅ Spread within threshold: ${current_spread} VND${NC}"
        fi
        
        sleep "$check_interval"
    done
}

# 7. Multi-Vector Spread Destroyer
multi_vector_destroyer() {
    echo -e "${RED}💀 MULTI-VECTOR SPREAD DESTROYER${NC}"
    
    echo -e "${YELLOW}🚀 Launching 5 simultaneous vectors...${NC}"
    
    # Vector 1: Rapid killer
    rapid_spread_killer &
    
    # Vector 2: Compression
    spread_compression 0.5 &
    
    # Vector 3: Arbitrage exploit
    spread_arbitrage_exploit &
    
    # Vector 4: Liquidity injection
    liquidity_injection 2000000000 &
    
    # Vector 5: MM interference
    market_maker_interference &
    
    echo -e "${GREEN}✅ All 5 vectors launched${NC}"
    wait
    echo -e "${GREEN}🏁 Multi-vector destroyer completed${NC}"
}

# 8. Spread Intelligence Analysis
spread_intelligence() {
    echo -e "${BLUE}🧠 SPREAD INTELLIGENCE ANALYSIS${NC}"
    
    echo -e "${YELLOW}🔍 Current market analysis:${NC}"
    $PYTHON_SCANNER full
    
    echo -e "${YELLOW}📊 Spread vulnerability scan:${NC}"
    curl -X GET "$API_BASE/api/vietnam-gold/vulnerability-analysis" | jq '.data.analysis[] | select(.source == "SJC")'
    
    echo -e "${YELLOW}💡 Optimal attack recommendations:${NC}"
    curl -X GET "$API_BASE/api/attack/spread-recommendations" | jq '.'
}

# 9. Precision Spread Sniper
precision_sniper() {
    local exact_target=${1:-25000}
    
    echo -e "${RED}🎯 PRECISION SPREAD SNIPER${NC}"
    echo -e "${YELLOW}🔫 Exact target: ${exact_target} VND${NC}"
    
    # Precision algorithm for exact spread targeting
    curl -X POST "$API_BASE/api/attack/precision-sniper" \
        -H "Content-Type: application/json" \
        -d '{
            "target_spread": '$exact_target',
            "precision_mode": "EXACT_HIT",
            "tolerance": 1000,
            "max_attempts": 20,
            "calibration": true
        }' | jq '.'
}

# 10. Emergency Spread Crash
emergency_spread_crash() {
    echo -e "${RED}🚨 EMERGENCY SPREAD CRASH${NC}"
    echo -e "${RED}⚠️ CẢNH BÁO: CRASH SPREAD KHẨN CẤP${NC}"
    
    read -p "Bạn có chắc chắn muốn crash spread? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        echo -e "${RED}💥 Executing emergency spread crash...${NC}"
        
        # Maximum intensity attack
        curl -X POST "$API_BASE/api/attack/emergency-crash" \
            -H "Content-Type: application/json" \
            -d '{
                "target": "SPREAD",
                "intensity": "NUCLEAR",
                "crash_level": "MAXIMUM",
                "duration": 300
            }' | jq '.'
        
        echo -e "${RED}💥 Emergency crash executed!${NC}"
    else
        echo -e "${YELLOW}❌ Emergency crash cancelled${NC}"
    fi
}

show_menu() {
    echo -e "${YELLOW}🗡️ MENU TIÊU DIỆT SPREAD:${NC}"
    echo ""
    echo -e "${GREEN}1.${NC} rapid_killer         - Tiêu diệt spread nhanh"
    echo -e "${GREEN}2.${NC} compression          - Nén spread theo tỷ lệ"
    echo -e "${GREEN}3.${NC} arbitrage_exploit    - Khai thác arbitrage spread"
    echo -e "${GREEN}4.${NC} liquidity_injection  - Bơm thanh khoản"
    echo -e "${GREEN}5.${NC} mm_interference      - Can thiệp market maker"
    echo -e "${GREEN}6.${NC} auto_monitor         - Giám sát & tiêu diệt tự động"
    echo -e "${GREEN}7.${NC} multi_vector         - Đa vector destroyer"
    echo -e "${GREEN}8.${NC} intelligence         - Phân tích thông minh"
    echo -e "${GREEN}9.${NC} precision_sniper     - Bắn tỉa chính xác"
    echo -e "${GREEN}10.${NC} emergency_crash      - Crash khẩn cấp"
    echo ""
}

# Main execution
main() {
    show_banner
    
    if [ $# -eq 0 ]; then
        show_menu
        read -p "Chọn lệnh (1-10): " choice
        echo ""
        
        case $choice in
            1|"rapid_killer") rapid_spread_killer "${2:-$TARGET_SPREAD}" ;;
            2|"compression") spread_compression "${2:-0.7}" ;;
            3|"arbitrage_exploit") spread_arbitrage_exploit ;;
            4|"liquidity_injection") liquidity_injection "${2:-1000000000}" ;;
            5|"mm_interference") market_maker_interference ;;
            6|"auto_monitor") spread_monitor_auto_kill "${2:-40000}" "${3:-30}" ;;
            7|"multi_vector") multi_vector_destroyer ;;
            8|"intelligence") spread_intelligence ;;
            9|"precision_sniper") precision_sniper "${2:-25000}" ;;
            10|"emergency_crash") emergency_spread_crash ;;
            *) echo -e "${RED}❌ Lựa chọn không hợp lệ!${NC}" ;;
        esac
    else
        # Command line mode
        case "${1}" in
            "rapid_killer"|"1") rapid_spread_killer "${2:-$TARGET_SPREAD}" ;;
            "compression"|"2") spread_compression "${2:-0.7}" ;;
            "arbitrage_exploit"|"3") spread_arbitrage_exploit ;;
            "liquidity_injection"|"4") liquidity_injection "${2:-1000000000}" ;;
            "mm_interference"|"5") market_maker_interference ;;
            "auto_monitor"|"6") spread_monitor_auto_kill "${2:-40000}" "${3:-30}" ;;
            "multi_vector"|"7") multi_vector_destroyer ;;
            "intelligence"|"8") spread_intelligence ;;
            "precision_sniper"|"9") precision_sniper "${2:-25000}" ;;
            "emergency_crash"|"10") emergency_spread_crash ;;
            "help"|"--help"|"-h") show_menu ;;
            *) echo -e "${RED}❌ Lệnh không hợp lệ: $1${NC}" && show_menu ;;
        esac
    fi
}

# Execute main
main "$@"
