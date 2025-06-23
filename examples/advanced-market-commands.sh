
#!/bin/bash

# Advanced market news posting với nhiều tham số
advanced_market_post() {
    market_news_post \
        --title "BREAKING: Central Bank Digital Currency (CBDC) Launch Announcement" \
        --content "The Federal Reserve, European Central Bank, and Bank of Japan have jointly announced the coordinated launch of their Central Bank Digital Currencies (CBDCs) within the next 6 months. This historic move is expected to revolutionize global financial systems and significantly impact traditional banking, cryptocurrency markets, and international trade. The digital currencies will be backed by their respective national currencies and will feature advanced blockchain technology for enhanced security and transparency." \
        --category "economics" \
        --impact "very_high" \
        --source "Joint Central Bank Statement" \
        --timestamp "$(date -Iseconds)" \
        --symbols "EURUSD,USDJPY,BTCUSD,ETHUSD,XAUUSD,US500,GER40,JPN225" \
        --market_check true \
        --auto_analysis true \
        --urgency "immediate" \
        --confidence_level "95" \
        --market_sentiment "bullish_usd" \
        --expected_volatility "extreme" \
        --trading_session "overlap_london_ny"
}

# Batch posting multiple related news
batch_market_news() {
    local base_timestamp=$(date -Iseconds)
    
    # News 1: Initial announcement
    market_news_post \
        --title "IMF Warns of Global Recession Risk" \
        --content "International Monetary Fund issues urgent warning about increasing global recession risks due to persistent inflation and supply chain disruptions." \
        --category "economics" \
        --impact "high" \
        --source "IMF Press Release" \
        --timestamp "$base_timestamp" \
        --symbols "EURUSD,GBPUSD,USDJPY,XAUUSD" \
        --market_check true \
        --auto_analysis true
    
    sleep 2
    
    # News 2: Market reaction
    market_news_post \
        --title "Global Stock Markets Plunge Following IMF Warning" \
        --content "Major stock indices worldwide are experiencing sharp declines as investors react to IMF's recession warning. Safe-haven assets seeing increased demand." \
        --category "stocks" \
        --impact "high" \
        --source "Market Analysis" \
        --timestamp "$(date -Iseconds)" \
        --symbols "US500,NAS100,GER40,JPN225,XAUUSD" \
        --market_check true \
        --auto_analysis true
    
    sleep 2
    
    # News 3: Central bank response
    market_news_post \
        --title "Central Banks Consider Coordinated Response to Market Volatility" \
        --content "Major central banks are reportedly discussing coordinated monetary policy measures to address market instability and economic uncertainty." \
        --category "economics" \
        --impact "medium" \
        --source "Central Bank Sources" \
        --timestamp "$(date -Iseconds)" \
        --symbols "EURUSD,GBPUSD,USDJPY,US500" \
        --market_check true \
        --auto_analysis true
}

# Real-time market monitoring và automated news posting
monitor_and_post() {
    local symbol="$1"
    local threshold="$2"
    
    echo "Monitoring $symbol for price movements exceeding $threshold%"
    
    # Simulate price monitoring (in real scenario, this would connect to live data)
    while true; do
        # Get current price (simulated)
        local current_price=$(echo "scale=5; $(shuf -i 100000-200000 -n 1)/100000" | bc)
        local price_change=$(echo "scale=2; ($(shuf -i -500-500 -n 1))/100" | bc)
        
        echo "Current price: $current_price, Change: $price_change%"
        
        # Check if price change exceeds threshold
        if (( $(echo "$price_change > $threshold || $price_change < -$threshold" | bc -l) )); then
            echo "Price movement threshold exceeded! Posting automated news..."
            
            local impact="medium"
            if (( $(echo "$price_change > 2 || $price_change < -2" | bc -l) )); then
                impact="high"
            fi
            
            market_news_post \
                --title "ALERT: $symbol Shows Significant Price Movement" \
                --content "$symbol has moved $price_change% in the current trading session, indicating potential market-moving events or increased institutional activity." \
                --category "forex" \
                --impact "$impact" \
                --source "Automated Market Monitor" \
                --timestamp "$(date -Iseconds)" \
                --symbols "$symbol" \
                --market_check true \
                --auto_analysis true
                
            # Broadcast urgent alert if high impact
            if [[ "$impact" == "high" ]]; then
                trader_broadcast \
                    --news_id "alert_$(date +%s)" \
                    --priority "urgent" \
                    --channels "websocket,push,sms" \
                    --target_audience "all_traders"
            fi
            
            break
        fi
        
        sleep 5
    done
}

# Market news với custom validation
post_with_validation() {
    local title="$1"
    local content="$2"
    local symbols="$3"
    
    echo "Validating market conditions before posting..."
    
    # Check market hours
    local hour=$(date +%H)
    if [[ $hour -lt 8 || $hour -gt 17 ]]; then
        echo "Warning: Posting outside of main trading hours"
    fi
    
    # Check for conflicting news
    echo "Checking for recent similar news..."
    
    # Validate symbols
    IFS=',' read -ra SYMBOL_ARRAY <<< "$symbols"
    for symbol in "${SYMBOL_ARRAY[@]}"; do
        echo "Validating symbol: $symbol"
        # In real scenario, validate against available symbols
    done
    
    # Proceed with posting
    market_news_post \
        --title "$title" \
        --content "$content" \
        --category "forex" \
        --impact "medium" \
        --source "Validated News Source" \
        --timestamp "$(date -Iseconds)" \
        --symbols "$symbols" \
        --market_check true \
        --auto_analysis true
        
    echo "News posted successfully with validation"
}

# Execute examples
echo "=== Advanced Market Command Examples ==="

echo "1. Advanced Market Post"
advanced_market_post

echo -e "\n2. Batch Market News"
batch_market_news

echo -e "\n3. Market Monitoring (simulation)"
monitor_and_post "EURUSD" "1.5"

echo -e "\n4. Post with Validation"
post_with_validation \
    "European Central Bank Holds Emergency Meeting" \
    "ECB officials convene for unscheduled policy discussion amid market volatility" \
    "EURUSD,EURGBP,EURJPY"
