
#!/bin/bash

# Quick news posting script - sử dụng nhanh cho việc đăng tin tức

# Load market commands
source scripts/market-commands.sh

quick_post() {
    local type="$1"
    shift
    
    case "$type" in
        "fed")
            market_news_post \
                --title "Federal Reserve Policy Update" \
                --content "$*" \
                --category "economics" \
                --impact "high" \
                --source "Federal Reserve" \
                --timestamp "$(date -Iseconds)" \
                --symbols "EURUSD,GBPUSD,USDJPY,XAUUSD,US500" \
                --market_check true \
                --auto_analysis true
            ;;
        "crypto")
            market_news_post \
                --title "Cryptocurrency Market Update" \
                --content "$*" \
                --category "crypto" \
                --impact "medium" \
                --source "Crypto News" \
                --timestamp "$(date -Iseconds)" \
                --symbols "BTCUSD,ETHUSD,ADAUSD,SOLUSD" \
                --market_check true \
                --auto_analysis true
            ;;
        "oil")
            market_news_post \
                --title "Oil Market Development" \
                --content "$*" \
                --category "commodities" \
                --impact "medium" \
                --source "Energy Markets" \
                --timestamp "$(date -Iseconds)" \
                --symbols "USOIL,UKOIL,USDCAD" \
                --market_check true \
                --auto_analysis true
            ;;
        "breaking")
            market_news_post \
                --title "BREAKING NEWS" \
                --content "$*" \
                --category "economics" \
                --impact "high" \
                --source "Breaking News" \
                --timestamp "$(date -Iseconds)" \
                --symbols "EURUSD,GBPUSD,USDJPY,XAUUSD,BTCUSD,US500" \
                --market_check true \
                --auto_analysis true
            
            # Auto broadcast for breaking news
            trader_broadcast \
                --news_id "breaking_$(date +%s)" \
                --priority "urgent" \
                --channels "websocket,push,email,sms" \
                --target_audience "all_traders"
            ;;
        *)
            echo "Usage: quick_post [fed|crypto|oil|breaking] <content>"
            echo "Examples:"
            echo "  quick_post fed 'Interest rates raised by 0.25%'"
            echo "  quick_post crypto 'Bitcoin breaks $100,000 resistance level'"
            echo "  quick_post oil 'OPEC announces production increase'"
            echo "  quick_post breaking 'Major bank announces bankruptcy'"
            ;;
    esac
}

# Interactive news posting
interactive_post() {
    echo "=== Interactive Market News Posting ==="
    
    read -p "Enter news title: " title
    read -p "Enter news content: " content
    read -p "Select category [forex/crypto/stocks/commodities/economics]: " category
    read -p "Select impact [low/medium/high]: " impact
    read -p "Enter affected symbols (comma-separated): " symbols
    read -p "Enter news source: " source
    
    market_news_post \
        --title "$title" \
        --content "$content" \
        --category "$category" \
        --impact "$impact" \
        --source "$source" \
        --timestamp "$(date -Iseconds)" \
        --symbols "$symbols" \
        --market_check true \
        --auto_analysis true
        
    echo "News posted successfully!"
}

# Scheduled news posting
schedule_post() {
    local delay="$1"
    shift
    
    echo "Scheduling news post in $delay seconds..."
    
    sleep "$delay"
    
    market_news_post \
        --title "Scheduled Market Update" \
        --content "$*" \
        --category "economics" \
        --impact "medium" \
        --source "Scheduled Update" \
        --timestamp "$(date -Iseconds)" \
        --symbols "EURUSD,GBPUSD,USDJPY" \
        --market_check true \
        --auto_analysis true
        
    echo "Scheduled news posted at $(date)"
}

# Make functions available
export -f quick_post
export -f interactive_post
export -f schedule_post

# Show help if no arguments
if [[ $# -eq 0 ]]; then
    echo "Quick News Posting Commands:"
    echo "  quick_post <type> <content>    - Quick post by category"
    echo "  interactive_post               - Interactive posting mode"
    echo "  schedule_post <seconds> <content> - Schedule a post"
    echo ""
    echo "Examples:"
    echo "  ./quick-news-post.sh"
    echo "  quick_post fed 'Emergency rate cut announced'"
    echo "  interactive_post"
    echo "  schedule_post 300 'Market opening update'"
fi
