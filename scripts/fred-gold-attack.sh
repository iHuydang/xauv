
#!/bin/bash

# FRED-Gold Attack Script
# Script tấn công vàng Việt Nam sử dụng dữ liệu FRED St. Louis

set -e

API_BASE="http://localhost:5000"
LOG_FILE="fred_gold_attack.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging function
log_attack() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Banner
show_banner() {
    echo -e "${RED}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                FRED-GOLD ATTACK SYSTEM v1.0                 ║"
    echo "║         🏛️ Fed St. Louis + GoldPrice.io Attack 💰          ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Get FRED indicators
get_fred_indicators() {
    echo -e "${BLUE}📊 Fetching FRED Economic Indicators...${NC}"
    log_attack "📊 Fetching FRED indicators"
    
    curl -s "$API_BASE/api/fred-gold/indicators" | jq '.'
}

# Analyze market conditions
analyze_market() {
    echo -e "${YELLOW}🔍 Analyzing Market Conditions...${NC}"
    log_attack "🔍 Analyzing market conditions"
    
    local response=$(curl -s "$API_BASE/api/fred-gold/market-analysis")
    echo "$response" | jq '.'
    
    # Extract opportunity level
    local opportunity=$(echo "$response" | jq -r '.analysis.arbitrageOpportunity // "UNKNOWN"')
    local volatility=$(echo "$response" | jq -r '.analysis.volatilityLevel // "UNKNOWN"')
    
    echo -e "${GREEN}📈 Arbitrage Opportunity: $opportunity${NC}"
    echo -e "${GREEN}📊 Volatility Level: $volatility${NC}"
    
    if [[ "$opportunity" == "HIGH" && "$volatility" == "HIGH" ]]; then
        echo -e "${RED}🚨 OPTIMAL ATTACK CONDITIONS DETECTED!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ Suboptimal conditions for attack${NC}"
        return 1
    fi
}

# Execute FRED-based attack
execute_fred_attack() {
    local strategy="${1:-FED_RATE_IMPACT}"
    
    echo -e "${RED}🚨 EXECUTING FRED-GOLD ATTACK${NC}"
    echo -e "${RED}⚔️ Strategy: $strategy${NC}"
    log_attack "🚨 Executing FRED-Gold attack with strategy: $strategy"
    
    local response=$(curl -s -X POST "$API_BASE/api/fred-gold/attack" \
        -H "Content-Type: application/json" \
        -d "{\"strategy\": \"$strategy\"}")
    
    if echo "$response" | jq -e '.success' > /dev/null; then
        echo -e "${GREEN}✅ Attack executed successfully${NC}"
        echo "$response" | jq '.'
        log_attack "✅ FRED-Gold attack completed successfully"
        
        # Extract results
        local damage=$(echo "$response" | jq -r '.result.damage // "N/A"')
        local impact=$(echo "$response" | jq -r '.result.marketImpact // "N/A"')
        
        echo -e "${GREEN}💥 Total Damage: ${damage}%${NC}"
        echo -e "${GREEN}📊 Market Impact: ${impact}%${NC}"
    else
        echo -e "${RED}❌ Attack failed${NC}"
        echo "$response" | jq '.'
        log_attack "❌ FRED-Gold attack failed"
    fi
}

# Coordinated FRED-Gold assault
coordinated_assault() {
    echo -e "${PURPLE}🎯 INITIATING COORDINATED FRED-GOLD ASSAULT${NC}"
    log_attack "🎯 Starting coordinated FRED-Gold assault"
    
    # Phase 1: Market analysis
    echo -e "${BLUE}Phase 1: Market Analysis${NC}"
    if analyze_market; then
        echo -e "${GREEN}✅ Optimal conditions detected${NC}"
    else
        echo -e "${YELLOW}⚠️ Proceeding with caution${NC}"
    fi
    
    sleep 3
    
    # Phase 2: Fed Rate Impact Attack
    echo -e "${RED}Phase 2: Fed Rate Impact Attack${NC}"
    execute_fred_attack "FED_RATE_IMPACT"
    
    sleep 5
    
    # Phase 3: Inflation Correlation Attack
    echo -e "${RED}Phase 3: Inflation Correlation Attack${NC}"
    execute_fred_attack "INFLATION_ATTACK"
    
    sleep 5
    
    # Phase 4: Dollar Weakness Exploit
    echo -e "${RED}Phase 4: Dollar Weakness Exploit${NC}"
    execute_fred_attack "DOLLAR_WEAKNESS"
    
    log_attack "🏁 Coordinated FRED-Gold assault completed"
}

# Auto FRED monitoring
auto_monitor() {
    local interval="${1:-15}"
    
    echo -e "${BLUE}🤖 Starting Automatic FRED Monitoring (${interval} min intervals)${NC}"
    log_attack "🤖 Starting automatic FRED monitoring"
    
    curl -s -X POST "$API_BASE/api/fred-gold/auto-monitor" \
        -H "Content-Type: application/json" \
        -d "{\"action\": \"start\", \"intervalMinutes\": $interval}" | jq '.'
}

# Economic indicator scan
indicator_scan() {
    echo -e "${BLUE}📊 FRED Economic Indicator Scan${NC}"
    
    echo -e "${YELLOW}Federal Funds Rate:${NC}"
    get_fred_indicators | jq '.indicators[] | select(.indicator == "FEDFUNDS")'
    
    echo -e "${YELLOW}10-Year Treasury:${NC}"
    get_fred_indicators | jq '.indicators[] | select(.indicator == "DGS10")'
    
    echo -e "${YELLOW}CPI Inflation:${NC}"
    get_fred_indicators | jq '.indicators[] | select(.indicator == "CPIAUCSL")'
    
    echo -e "${YELLOW}Dollar Index:${NC}"
    get_fred_indicators | jq '.indicators[] | select(.indicator == "DTWEXBGS")'
}

# Help function
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Available commands:"
    echo "  indicators   - Scan FRED economic indicators"
    echo "  analyze      - Analyze current market conditions"
    echo "  attack       - Execute single FRED-Gold attack"
    echo "  coordinated  - Execute coordinated assault"
    echo "  monitor      - Start automatic FRED monitoring"
    echo "  help         - Show this help"
    echo ""
    echo "Attack strategies:"
    echo "  FED_RATE_IMPACT    - Fed rate impact attack"
    echo "  INFLATION_ATTACK   - Inflation correlation attack"
    echo "  DOLLAR_WEAKNESS    - Dollar weakness exploit"
    echo "  GDP_IMPACT         - GDP impact manipulation"
    echo ""
    echo "Examples:"
    echo "  $0 indicators"
    echo "  $0 analyze"
    echo "  $0 attack FED_RATE_IMPACT"
    echo "  $0 coordinated"
    echo "  $0 monitor 10"
}

# Main execution
main() {
    show_banner
    
    case "${1:-}" in
        "indicators")
            indicator_scan
            ;;
        "analyze")
            analyze_market
            ;;
        "attack")
            local strategy="${2:-FED_RATE_IMPACT}"
            execute_fred_attack "$strategy"
            ;;
        "coordinated")
            coordinated_assault
            ;;
        "monitor")
            local interval="${2:-15}"
            auto_monitor "$interval"
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

# Check if server is running
if ! curl -s "$API_BASE/api/positions" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server not running on $API_BASE${NC}"
    echo -e "${YELLOW}Please start the Market Trading System first${NC}"
    exit 1
fi

# Execute main function
main "$@"
