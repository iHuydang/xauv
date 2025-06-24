#!/bin/bash

# XTB xAPI Gold Scanner với Real-time Data
# Tích hợp XTB xAPI vào hệ thống scanner hiện tại

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

BASE_URL="http://localhost:5000"

# Header
show_header() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║              XTB xAPI GOLD LIQUIDITY SCANNER                   ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Check XTB connection status
check_xtb_status() {
    echo -e "${BLUE}📡 Checking XTB xAPI connection...${NC}"
    
    local status=$(curl -s "$BASE_URL/api/xtb/status" | node -p "
    try {
        const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        if (data.success && data.data.isConnected) {
            'connected';
        } else {
            'disconnected';
        }
    } catch(e) {
        'error';
    }
    ")
    
    case $status in
        "connected")
            echo -e "${GREEN}   ✅ XTB xAPI connected${NC}"
            return 0
            ;;
        "disconnected")
            echo -e "${RED}   ❌ XTB xAPI disconnected${NC}"
            return 1
            ;;
        *)
            echo -e "${YELLOW}   ⚠️ Unable to check XTB status${NC}"
            return 1
            ;;
    esac
}

# Connect to XTB (demo account)
connect_xtb() {
    echo -e "${BLUE}🔗 Connecting to XTB xAPI demo...${NC}"
    
    # Using demo credentials - user should replace with real ones
    local response=$(curl -s -X POST "$BASE_URL/api/xtb/connect" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "demo_user",
            "password": "demo_password",
            "accountType": "demo"
        }')
    
    local success=$(echo "$response" | node -p "
    try {
        const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        data.success ? 'true' : 'false';
    } catch(e) {
        'false';
    }
    ")
    
    if [ "$success" = "true" ]; then
        echo -e "${GREEN}   ✅ XTB connection successful${NC}"
        return 0
    else
        echo -e "${RED}   ❌ XTB connection failed${NC}"
        echo -e "${YELLOW}   💡 Please configure real XTB credentials${NC}"
        return 1
    fi
}

# Get XTB gold price
get_xtb_gold_price() {
    local response=$(curl -s "$BASE_URL/api/xtb/gold-price")
    
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        echo "$response" | node -p "
        try {
            const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
            if (data.success) {
                JSON.stringify(data.data);
            } else {
                'null';
            }
        } catch(e) {
            'null';
        }
        "
    else
        echo "null"
    fi
}

# Perform XTB liquidity scan
perform_xtb_scan() {
    local min_price=${1:-3300}
    local max_price=${2:-3350}
    
    echo -e "${PURPLE}📊 XTB Liquidity Scan (${min_price}-${max_price})${NC}"
    
    local scan_data=$(curl -s "$BASE_URL/api/xtb/liquidity-scan?range_min=${min_price}&range_max=${max_price}")
    
    if [ $? -eq 0 ] && [ -n "$scan_data" ]; then
        echo "$scan_data" | node -p "
        try {
            const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
            if (data.success) {
                const d = data.data;
                console.log('═══ XTB LIQUIDITY ANALYSIS ═══');
                console.log('💰 Current Price: $' + d.currentPrice.toFixed(2) + '/oz');
                console.log('📊 Bid/Ask: $' + d.bid.toFixed(2) + ' / $' + d.ask.toFixed(2));
                console.log('📏 Spread: $' + d.spread.toFixed(3) + ' (' + d.spreadPercent + '%)');
                console.log('🎯 Liquidity Score: ' + d.liquidityScore);
                
                if (d.rangeAnalysis) {
                    const r = d.rangeAnalysis;
                    console.log('📍 Range Analysis:');
                    console.log('   In Range: ' + (r.inRange ? 'YES ✅' : 'NO ❌'));
                    console.log('   Position: ' + r.positionInRange + ' of range');
                    console.log('   Distance from Min: ' + r.distanceFromMin);
                    console.log('   Distance from Max: ' + r.distanceFromMax);
                }
                
                console.log('⏰ Timestamp: ' + new Date(d.timestamp).toLocaleString());
                console.log('🔗 Source: ' + d.source);
                'scan_completed';
            } else {
                'scan_failed';
            }
        } catch(e) {
            'parse_error';
        }
        "
    else
        echo -e "${RED}❌ Failed to get scan data${NC}"
    fi
}

# Compare XTB vs other sources
compare_sources() {
    echo -e "${CYAN}🔄 Comparing XTB vs Other Sources${NC}"
    
    # Get XTB price
    local xtb_data=$(get_xtb_gold_price)
    
    # Get GoldAPI price
    local gold_api_data=$(curl -s -X GET "https://www.goldapi.io/api/XAU/USD" \
        -H "x-access-token: goldapi-a1omwe19mc2bnqkx-io" | node -p "
        try {
            const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
            data.price || '0';
        } catch(e) {
            '0';
        }
        ")
    
    echo -e "${YELLOW}═══ MULTI-SOURCE COMPARISON ═══${NC}"
    
    if [ "$xtb_data" != "null" ]; then
        echo "$xtb_data" | node -p "
        const xtb = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        const goldAPI = parseFloat('$gold_api_data');
        
        console.log('🏦 XTB xAPI:');
        console.log('   Price: $' + xtb.price.toFixed(2));
        console.log('   Bid/Ask: $' + xtb.bid.toFixed(2) + ' / $' + xtb.ask.toFixed(2));
        console.log('   Spread: $' + xtb.spread.toFixed(3));
        console.log('');
        console.log('🌐 GoldAPI.io:');
        console.log('   Price: $' + goldAPI.toFixed(2));
        console.log('');
        
        if (goldAPI > 0) {
            const diff = Math.abs(xtb.price - goldAPI);
            const diffPercent = (diff / goldAPI * 100).toFixed(4);
            console.log('📊 Price Difference:');
            console.log('   Absolute: $' + diff.toFixed(2));
            console.log('   Percentage: ' + diffPercent + '%');
            console.log('   Arbitrage Opportunity: ' + (diff > 1 ? 'YES ⚡' : 'NO'));
        }
        "
    else
        echo -e "${RED}❌ XTB data not available${NC}"
        echo -e "${GREEN}🌐 GoldAPI.io: \$${gold_api_data}${NC}"
    fi
}

# Main execution
case "${1:-status}" in
    "status")
        show_header
        echo -e "${GREEN}🔍 Checking XTB xAPI Status${NC}"
        check_xtb_status
        ;;
    "connect")
        show_header
        echo -e "${GREEN}🔗 Connecting to XTB xAPI${NC}"
        connect_xtb
        ;;
    "scan")
        show_header
        MIN_PRICE=${2:-3300}
        MAX_PRICE=${3:-3350}
        echo -e "${GREEN}🚀 Starting XTB Liquidity Scan${NC}"
        
        if check_xtb_status; then
            perform_xtb_scan "$MIN_PRICE" "$MAX_PRICE"
        else
            echo -e "${YELLOW}⚠️ XTB not connected, attempting connection...${NC}"
            if connect_xtb; then
                sleep 2
                perform_xtb_scan "$MIN_PRICE" "$MAX_PRICE"
            fi
        fi
        ;;
    "compare")
        show_header
        echo -e "${GREEN}📊 Multi-Source Price Comparison${NC}"
        
        if check_xtb_status; then
            compare_sources
        else
            echo -e "${YELLOW}⚠️ XTB not connected, attempting connection...${NC}"
            if connect_xtb; then
                sleep 2
                compare_sources
            fi
        fi
        ;;
    "price")
        show_header
        echo -e "${GREEN}💰 Current XTB Gold Price${NC}"
        
        if check_xtb_status; then
            local xtb_data=$(get_xtb_gold_price)
            if [ "$xtb_data" != "null" ]; then
                echo "$xtb_data" | node -p "
                const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
                console.log('💰 XAUUSD: $' + data.price.toFixed(2) + '/oz');
                console.log('📊 Bid: $' + data.bid.toFixed(2));
                console.log('📊 Ask: $' + data.ask.toFixed(2));
                console.log('📏 Spread: $' + data.spread.toFixed(3));
                console.log('⏰ Time: ' + new Date(data.timestamp).toLocaleString());
                "
            else
                echo -e "${RED}❌ No price data available${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️ XTB not connected${NC}"
        fi
        ;;
    "help")
        echo -e "${CYAN}XTB xAPI Gold Scanner Usage:${NC}"
        echo -e "${YELLOW}Commands:${NC}"
        echo -e "  status              - Check XTB connection status"
        echo -e "  connect             - Connect to XTB xAPI"
        echo -e "  scan [min] [max]    - Liquidity scan in price range"
        echo -e "  compare             - Compare XTB vs other sources"
        echo -e "  price               - Get current XTB gold price"
        echo -e "  help                - Show this help"
        echo ""
        echo -e "${GREEN}Examples:${NC}"
        echo -e "  $0 scan 3300 3350   - Scan $3300-$3350 range"
        echo -e "  $0 compare          - Compare all sources"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo -e "${YELLOW}Use '$0 help' for usage information${NC}"
        exit 1
        ;;
esac