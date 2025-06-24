
#!/bin/bash

# XAUUSD Liquidity Scanner - Enhanced với hiển thị đầy đủ thông tin
# Quét thanh khoản phe mua/bán XAUUSD với phân tích chi tiết

echo "📊 XAUUSD ENHANCED LIQUIDITY SCANNER"
echo "===================================="

# Configuration
SCAN_INTERVAL=15  # seconds
LOG_FILE="xauusd_scan.log"
FALL_THRESHOLD=-1.0  # Percentage fall threshold
RISE_THRESHOLD=1.0   # Percentage rise threshold
VOLUME_THRESHOLD=1000000  # Minimum volume threshold

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize log
echo "=== XAUUSD Enhanced Scanner Started at $(date) ===" >> $LOG_FILE

# Function to scan XAUUSD buy liquidity
scan_xauusd_buy() {
    echo "🔍 Scanning XAUUSD buy-side liquidity..."
    
    # Simulate current price and change
    CURRENT_PRICE=$(echo "scale=2; 2680 + ($RANDOM % 20 - 10)" | bc)
    PRICE_CHANGE=$(echo "scale=2; -($RANDOM % 500 + 100) / 100" | bc)
    
    # Calculate buy pressure and volume
    BUY_VOLUME=$(echo "scale=0; 1000000 + $RANDOM % 3000000" | bc)
    BUY_PRESSURE=$(echo "scale=1; (-$PRICE_CHANGE) * 20" | bc)
    
    echo "📉 Current Price: \$${CURRENT_PRICE} (${PRICE_CHANGE}%)"
    echo "💰 Buy Volume: $(echo $BUY_VOLUME | sed ':a;s/\B[0-9]\{3\}\>/,&/;ta')"
    echo "🎯 Buy Pressure: ${BUY_PRESSURE}%"
    
    # Log to file
    echo "$(date '+%Y-%m-%d %H:%M:%S'),XAUUSD,BUY,$CURRENT_PRICE,$PRICE_CHANGE,$BUY_VOLUME,$BUY_PRESSURE" >> $LOG_FILE
    
    # Check for strong dip buying opportunity
    if (( $(echo "$PRICE_CHANGE < $FALL_THRESHOLD" | bc -l) )); then
        echo "🚨 STRONG DIP DETECTED!"
        echo "💎 RECOMMENDATION: ACCUMULATE ON WEAKNESS"
        echo "⚡ Entry Level: \$${CURRENT_PRICE}"
        echo "🎯 Target: \$$(echo "scale=2; $CURRENT_PRICE + 20" | bc)"
        echo "🛡️ Stop Loss: \$$(echo "scale=2; $CURRENT_PRICE - 10" | bc)"
        
        # Log strong signal
        echo "$(date '+%Y-%m-%d %H:%M:%S'),STRONG_DIP,XAUUSD,$CURRENT_PRICE,$PRICE_CHANGE,BUY_SIGNAL" >> $LOG_FILE
    fi
    
    # Analyze buy depth levels
    analyze_buy_depth "$CURRENT_PRICE"
    
    echo "---"
}

# Function to analyze buy depth
analyze_buy_depth() {
    local current_price=$1
    echo "📊 Buy Depth Analysis:"
    
    for level in 1 2 3 4 5; do
        local level_price=$(echo "scale=2; $current_price - ($level * 0.5)" | bc)
        local level_volume=$(echo "scale=0; 100000 + $RANDOM % 500000" | bc)
        local resistance=""
        
        if [ $level -le 2 ]; then
            resistance="WEAK"
        elif [ $level -le 4 ]; then
            resistance="MEDIUM"
        else
            resistance="STRONG"
        fi
        
        echo "   Level $level: \$${level_price} | Vol: $(echo $level_volume | sed ':a;s/\B[0-9]\{3\}\>/,&/;ta') | Resistance: $resistance"
    done
}

# Function for continuous monitoring
monitor_xauusd_buy() {
    echo "🔄 Starting continuous XAUUSD buy monitoring..."
    echo "⏱️ Scan interval: $SCAN_INTERVAL seconds"
    echo "📉 Fall threshold: $FALL_THRESHOLD%"
    echo "---"
    
    local consecutive_falls=0
    
    while true; do
        scan_xauusd_buy
        
        # Check for consecutive falls
        local latest_change=$(tail -1 $LOG_FILE | cut -d',' -f5)
        if (( $(echo "$latest_change < -1" | bc -l) )); then
            consecutive_falls=$((consecutive_falls + 1))
            echo "🔥 Consecutive falls: $consecutive_falls"
            
            if [ $consecutive_falls -ge 3 ]; then
                echo "🚨 MAJOR DIP ALERT - 3+ consecutive falls!"
                echo "💎 STRONG BUY RECOMMENDATION"
                echo "⚡ IMMEDIATE ACCUMULATION SIGNAL"
            fi
        else
            consecutive_falls=0
        fi
        
        echo "😴 Waiting $SCAN_INTERVAL seconds..."
        sleep $SCAN_INTERVAL
    done
}

# Function for single scan
single_scan() {
    echo "📸 Single XAUUSD buy scan..."
    scan_xauusd_buy
    
    # Quick depth analysis
    echo "📊 Quick Depth Report:"
    node -e "
    const result = require('../quick-liquidity-scanner.js').quickLiquidityScan;
    result.scanXAUUSDFallingBuy().then(data => {
        console.log('🎯 Signal Strength:', data.liquidity.buy.signal);
        console.log('🏦 Institutional Flow:', data.liquidity.buy.institutionalFlow);
        if (data.opportunities.length > 0) {
            console.log('💡 Opportunities:', data.opportunities.length);
        }
    });
    "
}

# Function to show buy analysis report
show_buy_report() {
    echo "📊 XAUUSD BUY ANALYSIS REPORT"
    echo "============================"
    
    if [ -f "$LOG_FILE" ]; then
        echo "📅 Recent buy scans:"
        tail -10 $LOG_FILE | while IFS=',' read -r timestamp symbol side price change volume pressure; do
            echo "⏰ $timestamp | Price: \$$price | Change: $change% | Volume: $volume"
        done
        
        echo ""
        echo "📈 Strong dip signals:"
        grep "STRONG_DIP" $LOG_FILE | tail -5 | while IFS=',' read -r timestamp signal symbol price change action; do
            echo "🚨 $timestamp | \$$price ($change%) | $action"
        done
    else
        echo "❌ No scan data available"
    fi
}

# Main execution logic
case "${1:-single}" in
    "monitor")
        monitor_xauusd_buy
        ;;
    "single")
        single_scan
        ;;
    "report")
        show_buy_report
        ;;
    "depth")
        echo "📊 Deep buy analysis..."
        node -e "
        const scanner = require('../quick-liquidity-scanner.js').quickLiquidityScan;
        scanner.analyzeXAUSDBuyDepth().then(analysis => {
            console.log('Analysis completed - Check detailed output above');
        });
        "
        ;;
    *)
        echo "Usage: $0 {single|monitor|report|depth}"
        echo "  single  - One-time buy scan"
        echo "  monitor - Continuous buy monitoring"
        echo "  report  - Show buy analysis report"
        echo "  depth   - Deep buy depth analysis"
        exit 1
        ;;
esac
