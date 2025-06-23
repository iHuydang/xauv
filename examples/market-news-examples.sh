
#!/bin/bash

# Ví dụ đăng tin tức tác động cao lên thị trường Forex
post_high_impact_news() {
    market_news_post \
        --title "Federal Reserve Announces Emergency Rate Cut of 0.75%" \
        --content "The Federal Reserve announced an emergency interest rate cut of 0.75% to combat rising inflation concerns. The decision was unanimous among FOMC members. Fed Chair Powell stated this is a preemptive measure to ensure economic stability. Markets are expected to see significant volatility in the coming hours." \
        --category "economics" \
        --impact "high" \
        --source "Federal Reserve" \
        --timestamp "$(date -Iseconds)" \
        --symbols "EURUSD,GBPUSD,USDJPY,USDCHF,XAUUSD,US500,US30" \
        --market_check true \
        --auto_analysis true
}

# Ví dụ đăng tin tức về cryptocurrency
post_crypto_news() {
    market_news_post \
        --title "Bitcoin ETF Approved by SEC - Institutional Adoption Accelerates" \
        --content "The Securities and Exchange Commission has approved the first spot Bitcoin ETF, marking a historic milestone for cryptocurrency adoption. The decision is expected to bring billions in institutional capital into the Bitcoin market. Trading begins tomorrow on major exchanges." \
        --category "crypto" \
        --impact "high" \
        --source "SEC Official Release" \
        --timestamp "$(date -Iseconds)" \
        --symbols "BTCUSD,ETHUSD,ADAUSD,SOLUSD" \
        --market_check true \
        --auto_analysis true
}

# Ví dụ đăng tin tức về hàng hóa
post_commodity_news() {
    market_news_post \
        --title "OPEC+ Cuts Oil Production by 2 Million Barrels Per Day" \
        --content "OPEC+ members have agreed to reduce oil production by 2 million barrels per day starting next month. The decision aims to stabilize oil prices amid concerns about global economic slowdown. Energy markets are already showing strong reactions to this announcement." \
        --category "commodities" \
        --impact "medium" \
        --source "OPEC Secretariat" \
        --timestamp "$(date -Iseconds)" \
        --symbols "USOIL,UKOIL,XAUUSD,USDCAD" \
        --market_check true \
        --auto_analysis true
}

# Ví dụ đăng tin tức chứng khoán
post_stock_news() {
    market_news_post \
        --title "Apple Reports Record Q4 Earnings, Beats All Estimates" \
        --content "Apple Inc. reported record fourth-quarter earnings with revenue of $89.5 billion, beating analyst estimates by 12%. iPhone sales exceeded expectations despite supply chain concerns. The company also announced a $90 billion share buyback program." \
        --category "stocks" \
        --impact "medium" \
        --source "Apple Inc. Earnings Release" \
        --timestamp "$(date -Iseconds)" \
        --symbols "US500,NAS100,US30" \
        --market_check true \
        --auto_analysis true
}

# Ví dụ đăng tin tức địa chính trị
post_geopolitical_news() {
    market_news_post \
        --title "EU Announces New Trade Sanctions on Major Emerging Markets" \
        --content "The European Union has imposed comprehensive trade sanctions affecting multiple emerging market economies. The sanctions target technology transfers, financial services, and commodity imports. Markets are bracing for increased volatility as global supply chains face disruption." \
        --category "forex" \
        --impact "high" \
        --source "European Commission" \
        --timestamp "$(date -Iseconds)" \
        --symbols "EURUSD,EURGBP,EURJPY,GER40,UK100" \
        --market_check true \
        --auto_analysis true
}

# Hàm kiểm tra tác động thị trường trước khi đăng tin
check_market_before_post() {
    local symbols=("$@")
    echo "Checking market impact for symbols: ${symbols[*]}"
    
    market_impact_check \
        --symbols "$(IFS=,; echo "${symbols[*]}")" \
        --timeframe "4h" \
        --analysis_depth "full" \
        --include_correlations true
}

# Hàm đăng tin và phát sóng đến traders
post_and_broadcast() {
    local title="$1"
    local content="$2"
    local category="$3"
    local impact="$4"
    local symbols="$5"
    
    # Đăng tin tức
    local news_id="news_$(date +%s)"
    
    market_news_post \
        --title "$title" \
        --content "$content" \
        --category "$category" \
        --impact "$impact" \
        --source "Trading Terminal" \
        --timestamp "$(date -Iseconds)" \
        --symbols "$symbols" \
        --market_check true \
        --auto_analysis true
    
    # Phát sóng đến traders nếu tác động cao
    if [[ "$impact" == "high" ]]; then
        trader_broadcast \
            --news_id "$news_id" \
            --priority "urgent" \
            --channels "websocket,push,email,sms" \
            --target_audience "all_traders"
    else
        trader_broadcast \
            --news_id "$news_id" \
            --priority "normal" \
            --channels "websocket,push" \
            --target_audience "subscribed_traders"
    fi
}

# Ví dụ sử dụng
echo "=== Market News Posting Examples ==="
echo "1. High Impact Fed News"
post_high_impact_news

echo -e "\n2. Cryptocurrency News"
post_crypto_news

echo -e "\n3. Commodity News"
post_commodity_news

echo -e "\n4. Stock Market News"
post_stock_news

echo -e "\n5. Geopolitical News"
post_geopolitical_news

echo -e "\n6. Market Impact Check Example"
check_market_before_post "EURUSD" "GBPUSD" "USDJPY"

echo -e "\n7. Post and Broadcast Example"
post_and_broadcast \
    "Breaking: Major Central Bank Intervention" \
    "Central banks coordinate massive intervention in currency markets to stabilize global financial system." \
    "economics" \
    "high" \
    "EURUSD,GBPUSD,USDJPY,XAUUSD"
