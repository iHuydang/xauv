
#!/bin/bash

# Advanced Liquidity Scanner for Market Bots
# Hệ thống quét thanh khoản cho các bot thị trường

# Configuration
SCAN_INTERVAL=30  # seconds
LOG_FILE="liquidity_scan.log"
ALERT_THRESHOLD=5000000  # VND
MAX_RETRIES=3

# Initialize log
echo "=== Liquidity Scanner Started at $(date) ===" >> $LOG_FILE

# Function to scan SJC gold prices
scan_sjc_liquidity() {
    local retries=0
    local success=false
    
    while [ $retries -lt $MAX_RETRIES ] && [ "$success" = false ]; do
        echo "🔍 Scanning SJC liquidity... (attempt $((retries+1)))"
        
        # Get data from SJC
        RESPONSE=$(curl -s --connect-timeout 10 --max-time 30 https://sjc.com.vn/giavang/textContent.php)
        
        if [ $? -eq 0 ] && [ -n "$RESPONSE" ]; then
            # Extract SJC data
            LINE=$(echo "$RESPONSE" | grep -m1 "SJC")
            
            if [ -n "$LINE" ]; then
                # Extract buy and sell prices
                BUY_PRICE=$(echo "$LINE" | awk -F '</td><td>' '{gsub(/[^0-9]/,"",$2); print $2}')
                SELL_PRICE=$(echo "$LINE" | awk -F '</td><td>' '{gsub(/[^0-9]/,"",$3); print $3}')
                
                # Validate prices
                if [ -n "$BUY_PRICE" ] && [ -n "$SELL_PRICE" ] && [ "$BUY_PRICE" -gt 0 ] && [ "$SELL_PRICE" -gt 0 ]; then
                    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
                    local spread=$((SELL_PRICE - BUY_PRICE))
                    local spread_percent=$(echo "scale=2; $spread * 100 / $BUY_PRICE" | bc)
                    
                    echo "⏰ $timestamp - SJC Gold Liquidity Scan"
                    echo "💰 Buy: $BUY_PRICE VND | Sell: $SELL_PRICE VND"
                    echo "📊 Spread: $spread VND ($spread_percent%)"
                    
                    # Log to file
                    echo "$timestamp,SJC,$BUY_PRICE,$SELL_PRICE,$spread,$spread_percent" >> $LOG_FILE
                    
                    # Market impact analysis
                    analyze_market_impact "SJC" "$BUY_PRICE" "$SELL_PRICE" "$spread"
                    
                    success=true
                else
                    echo "❌ Invalid price data extracted"
                    retries=$((retries + 1))
                fi
            else
                echo "❌ SJC data not found in response"
                retries=$((retries + 1))
            fi
        else
            echo "❌ Failed to fetch SJC data"
            retries=$((retries + 1))
        fi
        
        if [ "$success" = false ] && [ $retries -lt $MAX_RETRIES ]; then
            echo "⏳ Retrying in 5 seconds..."
            sleep 5
        fi
    done
    
    if [ "$success" = false ]; then
        echo "🚨 Failed to scan SJC after $MAX_RETRIES attempts"
        echo "$(date '+%Y-%m-%d %H:%M:%S'),SJC,ERROR,ERROR,ERROR,ERROR" >> $LOG_FILE
    fi
}

# Function to scan PNJ gold prices
scan_pnj_liquidity() {
    echo "🔍 Scanning PNJ liquidity..."
    
    local api_response=$(curl -s -X POST "https://edge-api.pnj.io/ecom-frontend/v1/gia-vang" \
        -H "Content-Type: application/json" \
        -H "apikey: $PNJ_API_KEY" \
        -d '{
            "ts": '$(date +%s000)',
            "tsj": '$(date +%s000)',
            "date": "'$(date)"'",
            "items": [{"curr": "VND"}]
        }')
    
    if [ $? -eq 0 ] && [ -n "$api_response" ]; then
        # Parse JSON response (simplified - in production use jq)
        echo "📊 PNJ API Response received"
        echo "⏰ $(date '+%Y-%m-%d %H:%M:%S') - PNJ Gold Liquidity Scan"
        echo "$api_response" | head -c 200
        echo ""
        
        # Log to file
        echo "$(date '+%Y-%m-%d %H:%M:%S'),PNJ,API_RESPONSE,SUCCESS" >> $LOG_FILE
    else
        echo "❌ Failed to fetch PNJ data"
        echo "$(date '+%Y-%m-%d %H:%M:%S'),PNJ,ERROR,FAILED" >> $LOG_FILE
    fi
}

# Function to analyze market impact
analyze_market_impact() {
    local source="$1"
    local buy_price="$2"
    local sell_price="$3"
    local spread="$4"
    
    echo "🎯 Market Impact Analysis for $source:"
    
    # Calculate spread percentage
    local spread_percent=$(echo "scale=2; $spread * 100 / $buy_price" | bc 2>/dev/null || echo "0")
    
    # High liquidity indicator with enhanced spread analysis
    if [ "$spread" -lt 50000 ]; then
        echo "✅ HIGH LIQUIDITY - Tight spread detected ($spread VND, ${spread_percent}%)"
        echo "🤖 Bot Signal: FAVORABLE for scalping and high-frequency trading"
        echo "💡 Strategy: Execute immediate trades, spread arbitrage possible"
    elif [ "$spread" -lt 100000 ]; then
        echo "⚠️ MEDIUM LIQUIDITY - Normal spread ($spread VND, ${spread_percent}%)"
        echo "🤖 Bot Signal: MODERATE trading conditions"
        echo "💡 Strategy: Monitor for spread tightening, swing trading suitable"
    elif [ "$spread" -lt 150000 ]; then
        echo "🚨 LOW LIQUIDITY - Wide spread detected ($spread VND, ${spread_percent}%)"
        echo "🤖 Bot Signal: CAUTION - Reduce position sizes"
        echo "💡 Strategy: Wait for market volatility to increase liquidity"
    else
        echo "🔴 EXTREMELY LOW LIQUIDITY - Very wide spread ($spread VND, ${spread_percent}%)"
        echo "🤖 Bot Signal: AVOID - Market manipulation risk"
        echo "💡 Strategy: Suspend trading until spread normalizes"
        
        # Log extreme spread for investigation
        echo "$(date '+%Y-%m-%d %H:%M:%S'),EXTREME_SPREAD,$source,$buy_price,$sell_price,$spread,$spread_percent" >> extreme_spreads.log
    fi
    
    # Enhanced price level analysis
    if [ "$sell_price" -gt 85000000 ]; then
        echo "🔥 VERY HIGH PRICE LEVEL - Peak demand detected"
        echo "📊 Recommendation: Monitor for reversal signals"
    elif [ "$sell_price" -gt 80000000 ]; then
        echo "📈 HIGH PRICE LEVEL - Strong gold demand"
        echo "📊 Recommendation: Consider taking profits"
    elif [ "$sell_price" -lt 70000000 ]; then
        echo "📉 LOW PRICE LEVEL - Potential buying opportunity"
        echo "📊 Recommendation: Accumulate on dips"
    elif [ "$sell_price" -lt 65000000 ]; then
        echo "💎 VERY LOW PRICE LEVEL - Strong buying opportunity"
        echo "📊 Recommendation: Aggressive accumulation"
    fi
    
    # Spread efficiency rating
    local efficiency_score=100
    if [ "$spread" -gt 50000 ]; then
        efficiency_score=$((efficiency_score - 20))
    fi
    if [ "$spread" -gt 100000 ]; then
        efficiency_score=$((efficiency_score - 30))
    fi
    if [ "$spread" -gt 150000 ]; then
        efficiency_score=$((efficiency_score - 40))
    fi
    
    echo "⚡ Market Efficiency Score: ${efficiency_score}/100"
    echo "---"
}

# Function to scan multiple targets
scan_all_targets() {
    echo "🚀 Starting comprehensive liquidity scan..."
    echo "🎯 Targets: SJC, PNJ, and other gold markets"
    echo "---"
    
    # Scan SJC
    scan_sjc_liquidity
    echo ""
    
    # Scan PNJ
    scan_pnj_liquidity
    echo ""
    
    # Additional targets can be added here
    scan_additional_targets
    
    echo "✅ Liquidity scan cycle completed"
    echo "==============================================="
}

# Function to scan additional targets
scan_additional_targets() {
    echo "🔍 Scanning additional gold market targets..."
    
    # Example: DOJI Gold
    echo "📊 DOJI Gold - Simulated scan"
    echo "💰 Estimated spread: 45,000 VND (HIGH LIQUIDITY)"
    
    # Example: MI Hong Gold
    echo "📊 MI Hong Gold - Simulated scan"
    echo "💰 Estimated spread: 60,000 VND (MEDIUM LIQUIDITY)"
    
    # Log additional targets
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "$timestamp,DOJI,SIMULATED,SIMULATED,45000,0.6" >> $LOG_FILE
    echo "$timestamp,MIHONG,SIMULATED,SIMULATED,60000,0.8" >> $LOG_FILE
}

# Function for continuous monitoring
start_monitoring() {
    echo "🔄 Starting continuous liquidity monitoring..."
    echo "⏱️ Scan interval: $SCAN_INTERVAL seconds"
    echo "📝 Log file: $LOG_FILE"
    echo "---"
    
    while true; do
        scan_all_targets
        echo "😴 Waiting $SCAN_INTERVAL seconds for next scan..."
        sleep $SCAN_INTERVAL
    done
}

# Function for single scan
single_scan() {
    echo "📸 Performing single liquidity scan..."
    scan_all_targets
}

# Function to show liquidity report
show_report() {
    echo "📊 LIQUIDITY SCAN REPORT"
    echo "========================="
    
    if [ -f "$LOG_FILE" ]; then
        echo "📅 Recent scans:"
        tail -10 $LOG_FILE | while IFS=',' read -r timestamp source buy sell spread percent; do
            echo "⏰ $timestamp | $source | Spread: $spread VND"
        done
    else
        echo "❌ No scan data available"
    fi
}

# Main execution logic
case "${1:-single}" in
    "monitor")
        start_monitoring
        ;;
    "single")
        single_scan
        ;;
    "report")
        show_report
        ;;
    "sjc")
        scan_sjc_liquidity
        ;;
    "pnj")
        scan_pnj_liquidity
        ;;
    *)
        echo "Usage: $0 {single|monitor|report|sjc|pnj}"
        echo "  single  - Perform one scan cycle"
        echo "  monitor - Continuous monitoring"
        echo "  report  - Show recent scan report"
        echo "  sjc     - Scan SJC only"
        echo "  pnj     - Scan PNJ only"
        exit 1
        ;;
esac

# Export functions for use in other scripts
export -f scan_sjc_liquidity
export -f scan_pnj_liquidity
export -f analyze_market_impact
export -f scan_all_targets
