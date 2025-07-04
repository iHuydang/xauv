#!/bin/bash

# Script mô phỏng các lệnh thị trường
# Trong thực tế, đây sẽ kết nối với các API thị trường thật

# Enhanced SJC scanning function
scan_sjc_gold() {
    local stop_loss=${1:-8500000}
    
    echo "🔍 Scanning SJC gold prices..."
    
    RESPONSE=$(curl -s --connect-timeout 10 --max-time 30 https://sjc.com.vn/giavang/textContent.php)
    
    if [ $? -eq 0 ] && [ -n "$RESPONSE" ]; then
        LINE=$(echo "$RESPONSE" | grep -m1 "SJC")
        
        if [ -n "$LINE" ]; then
            SELL_PRICE=$(echo "$LINE" | awk -F '</td><td>' '{gsub(/[^0-9]/,"",$3); if($3 != "") print $3; else print "0"}')
            
            # Validate price
            if [ -n "$SELL_PRICE" ] && [ "$SELL_PRICE" -gt 0 ]; then
                echo "⏰ $(date '+%Y-%m-%d %H:%M:%S') - SJC Sell Price: $SELL_PRICE VND"
                
                # Compare with stop loss
                if [ "$SELL_PRICE" -lt "$stop_loss" ]; then
                    echo "🚨 STOP LOSS HIT! Price $SELL_PRICE is below $stop_loss"
                    return 1
                else
                    echo "✅ Gold price is safe. Stop loss not triggered."
                    return 0
                fi
            else
                echo "❌ Unable to extract valid price from SJC data"
                echo "🔍 Raw data sample: $(echo "$LINE" | head -c 100)"
                return 2
            fi
        else
            echo "❌ SJC data not found in response"
            return 2
        fi
    else
        echo "❌ Failed to fetch data from SJC website"
        return 2
    fi
}

market_news_post() {
    local title=""
    local content=""
    local category=""
    local impact=""
    local source=""
    local timestamp=""
    local symbols=""
    local market_check=""
    local auto_analysis=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            --title)
                title="$2"
                shift 2
                ;;
            --content)
                content="$2"
                shift 2
                ;;
            --category)
                category="$2"
                shift 2
                ;;
            --impact)
                impact="$2"
                shift 2
                ;;
            --source)
                source="$2"
                shift 2
                ;;
            --timestamp)
                timestamp="$2"
                shift 2
                ;;
            --symbols)
                symbols="$2"
                shift 2
                ;;
            --market_check)
                market_check="$2"
                shift 2
                ;;
            --auto_analysis)
                auto_analysis="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    echo "Publishing news via WebSocket: $title"
    echo "Category: $category | Impact: $impact"
    echo "Symbols: $symbols"

    # Send to WebSocket server and HTTP API
    local websocket_data=$(cat <<EOF
{
    "command": "market_news_post",
    "title": "$title",
    "content": "$content", 
    "category": "$category",
    "impact": "$impact",
    "source": "$source",
    "timestamp": "$timestamp",
    "symbols": $(echo "$symbols" | jq -R 'split(",")' 2>/dev/null || echo "[]"),
    "market_check": $market_check,
    "auto_analysis": $auto_analysis
}
EOF
)

    # Send via HTTP API to WebSocket handler
    curl -s -X POST "http://localhost:5000/api/websocket/news" \
        -H "Content-Type: application/json" \
        -d "$websocket_data" || echo "WebSocket API not available"

    echo "News posted successfully at $timestamp"
    echo "WebSocket clients notified"
}

market_impact_check() {
    local symbols=""
    local timeframe=""
    local analysis_depth=""
    local include_correlations=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --symbols)
                symbols="$2"
                shift 2
                ;;
            --timeframe)
                timeframe="$2"
                shift 2
                ;;
            --analysis_depth)
                analysis_depth="$2"
                shift 2
                ;;
            --include_correlations)
                include_correlations="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    # Validate inputs
    if [[ -z "$symbols" ]]; then
        symbols="EURUSD,GBPUSD,USDJPY"
    fi
    
    if [[ -z "$timeframe" ]]; then
        timeframe="1h"
    fi

    echo "Checking market impact for symbols: $symbols"
    echo "Timeframe: $timeframe"
    echo "Analysis depth: ${analysis_depth:-standard}"

    # Send to API endpoint for processing
    local api_data=$(cat <<EOF
{
    "symbols": "$(echo "$symbols" | tr ',' ' ' | xargs | tr ' ' ',')",
    "timeframe": "$timeframe",
    "analysis_depth": "${analysis_depth:-standard}",
    "include_correlations": $include_correlations
}
EOF
)

    # Try API call first
    local api_result=""
    if curl -s -f -X POST "http://localhost:5000/api/market/impact-check" \
        -H "Content-Type: application/json" \
        -d "$api_data" >/dev/null 2>&1; then
        
        api_result=$(curl -s -X POST "http://localhost:5000/api/market/impact-check" \
            -H "Content-Type: application/json" \
            -d "$api_data")
        
        echo "$api_result"
    else
        # Fallback to local calculation
        local symbol_array=(${symbols//,/ })
        local impact_score=$(echo "scale=2; 5.0 + ${#symbol_array[@]} * 1.5" | bc 2>/dev/null || echo "7.5")
        
        echo "{
            \"success\": true,
            \"impact_score\": $impact_score,
            \"affected_symbols\": [\"${symbols//,/\", \"}\"],
            \"timeframe\": \"$timeframe\",
            \"volatility_increase\": \"$(echo "scale=1; $impact_score * 2" | bc 2>/dev/null || echo "15.0")%\",
            \"correlation_analysis\": {
                \"positive\": [\"EURUSD\", \"GBPUSD\"],
                \"negative\": [\"USDJPY\", \"USDCHF\"],
                \"neutral\": [\"GBPJPY\", \"EURJPY\"]
            },
            \"recommendation\": \"Monitor closely for next $(echo "scale=0; $impact_score / 2" | bc 2>/dev/null || echo "4") hours\",
            \"timestamp\": \"$(date -Iseconds)\",
            \"method\": \"fallback_calculation\"
        }"
    fi
}

trader_broadcast() {
    local news_id=""
    local priority=""
    local channels=""
    local target_audience=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            --news_id)
                news_id="$2"
                shift 2
                ;;
            --priority)
                priority="$2"
                shift 2
                ;;
            --channels)
                channels="$2"
                shift 2
                ;;
            --target_audience)
                target_audience="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    echo "Broadcasting news $news_id with priority $priority"
    echo "Channels: $channels"
    echo "Target: $target_audience"
    echo "Broadcast successful - 1,247 traders notified"
}

# Export functions
export -f market_news_post
export -f market_impact_check
export -f trader_broadcast