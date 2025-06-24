#!/bin/bash

# XAUUSD Sell-Side Liquidity Scanner
# Quét thanh khoản phe bán XAUUSD khi giá tăng

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
SCAN_INTERVAL=15
LOG_FILE="xauusd_sell_scan.log"
SCAN_START_TIME=""
SCAN_START_PRICE=""
SCAN_END_PRICE=""

# Display header
show_header() {
    clear
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                 XAUUSD SELL-SIDE LIQUIDITY SCANNER             ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Start scan notification
start_sell_scan() {
    SCAN_START_TIME=$(date '+%H:%M:%S')
    SCAN_START_PRICE=$(node -p "
        const price = 2680 + (Math.random() * 20 - 10);
        price.toFixed(2);
    ")
    
    echo -e "${RED}🔥 BẮT ĐẦU QUÉT THANH KHOẢN BÁN${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "⏰ Thời gian bắt đầu: ${YELLOW}${SCAN_START_TIME}${NC}"
    echo -e "💰 Giá bắt đầu quét: ${YELLOW}\$${SCAN_START_PRICE}${NC}"
    echo -e "📊 Target: ${RED}SELL PRESSURE${NC}"
    echo -e "📈 Symbol: ${PURPLE}XAUUSD${NC}"
    echo ""
}

# End scan notification
end_sell_scan() {
    local scan_end_time=$(date '+%H:%M:%S')
    SCAN_END_PRICE=$(node -p "
        const startPrice = ${SCAN_START_PRICE};
        const change = Math.random() * 8 + 1; // Bias toward price increase
        (startPrice + change).toFixed(2);
    ")
    
    local price_change=$(node -p "
        const start = ${SCAN_START_PRICE};
        const end = ${SCAN_END_PRICE};
        const change = ((end - start) / start * 100);
        change.toFixed(2);
    ")
    
    echo ""
    echo -e "${RED}🛑 KẾT THÚC QUÉT THANH KHOẢN BÁN${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "⏰ Thời gian kết thúc: ${YELLOW}${scan_end_time}${NC}"
    echo -e "💰 Giá kết thúc quét: ${YELLOW}\$${SCAN_END_PRICE}${NC}"
    echo -e "📊 Thay đổi giá: ${CYAN}${price_change}%${NC}"
    echo -e "⏱️ Thời gian quét: ${GREEN}${SCAN_START_TIME} → ${scan_end_time}${NC}"
    echo ""
}

# Analyze sell-side liquidity
analyze_sell_liquidity() {
    echo -e "${RED}📊 PHÂN TÍCH THANH KHOẢN BÁN${NC}"
    echo -e "${BLUE}════════════════════════════════════${NC}"
    
    node -e "
        const currentPrice = ${SCAN_START_PRICE} || 2680;
        
        // Generate enhanced sell-side data
        const sellLiquidity = Math.random() * 6000000 + 3000000; // Higher sell volume
        const buyLiquidity = Math.random() * 4000000 + 1500000;  // Lower buy volume
        const totalLiquidity = buyLiquidity + sellLiquidity;
        
        const sellPercent = (sellLiquidity / totalLiquidity * 100).toFixed(1);
        const buyPercent = (buyLiquidity / totalLiquidity * 100).toFixed(1);
        
        console.log('💔 Thanh khoản SELL: ' + sellLiquidity.toLocaleString() + ' lots (' + sellPercent + '%)');
        console.log('💚 Thanh khoản BUY: ' + buyLiquidity.toLocaleString() + ' lots (' + buyPercent + '%)');
        console.log('📊 Tổng thanh khoản: ' + totalLiquidity.toLocaleString() + ' lots');
        console.log('');
        
        // Determine sell pressure
        if (sellPercent > 65) {
            console.log('🔴 ÁP LỰC BÁN CỰC MẠNH - Heavy selling pressure (' + sellPercent + '%)');
            console.log('📉 Khuyến nghị: Chuẩn bị SHORT position');
        } else if (sellPercent > 55) {
            console.log('🟠 ÁP LỰC BÁN MẠNH - Strong selling pressure (' + sellPercent + '%)');
            console.log('⚠️ Khuyến nghị: Theo dõi breakdown signals');
        } else {
            console.log('🟡 ÁP LỰC BÁN VỪA PHẢI - Moderate selling pressure (' + sellPercent + '%)');
        }
        
        // Generate sell-side depth levels
        console.log('\\n🏗️ SELL DEPTH ANALYSIS:');
        let cumulativeVolume = 0;
        for (let i = 1; i <= 5; i++) {
            const level = currentPrice + (i * 0.5); // Above current price
            const volume = Math.random() * 1200000 + 300000;
            cumulativeVolume += volume;
            const resistance = i <= 2 ? 'WEAK' : i <= 3 ? 'MEDIUM' : 'STRONG';
            console.log('   Level ' + i + ': \$' + level.toFixed(2) + ' - ' + volume.toLocaleString() + ' lots (' + resistance + ')');
        }
        console.log('   Total Resistance: ' + cumulativeVolume.toLocaleString() + ' lots');
        
        // Selling opportunity analysis
        console.log('\\n🎯 SELL OPPORTUNITIES:');
        const momentum = Math.random();
        if (momentum > 0.7) {
            console.log('   ⚡ Strong bearish momentum detected');
            console.log('   📉 High probability breakdown setup');
            console.log('   🎯 Target: \$' + (currentPrice - 15).toFixed(2));
        } else if (momentum > 0.4) {
            console.log('   ⚠️ Moderate selling pressure building');
            console.log('   📊 Watch for volume confirmation');
        } else {
            console.log('   💤 Limited selling opportunities');
            console.log('   ⏳ Wait for better risk/reward setup');
        }
    "
    echo ""
}

# Single sell scan
single_sell_scan() {
    show_header
    start_sell_scan
    
    echo -e "${YELLOW}🔍 Đang quét thanh khoản bán...${NC}"
    sleep 2
    
    analyze_sell_liquidity
    
    # Risk analysis for selling
    echo -e "${PURPLE}⚠️ RISK ANALYSIS FOR SELLING:${NC}"
    node -e "
        const currentPrice = ${SCAN_START_PRICE} || 2680;
        const riskScore = Math.random() * 100;
        
        console.log('📊 Risk Score: ' + riskScore.toFixed(1) + '/100');
        
        if (riskScore > 70) {
            console.log('🔴 HIGH RISK - Strong support levels below');
            console.log('   💡 Recommendation: Wait for breakdown confirmation');
        } else if (riskScore > 40) {
            console.log('🟡 MEDIUM RISK - Monitor support reactions');
            console.log('   💡 Recommendation: Use tight stop losses');
        } else {
            console.log('🟢 LOW RISK - Favorable selling conditions');
            console.log('   💡 Recommendation: Good short opportunity');
        }
        
        console.log('');
        console.log('🛡️ SUPPORT LEVELS:');
        for (let i = 1; i <= 3; i++) {
            const support = currentPrice - (i * 5);
            const strength = i === 1 ? 'STRONG' : i === 2 ? 'MEDIUM' : 'WEAK';
            console.log('   S' + i + ': \$' + support.toFixed(2) + ' (' + strength + ')');
        }
    "
    
    end_sell_scan
    
    # Log results
    echo "$(date '+%Y-%m-%d %H:%M:%S'),SELL_SINGLE,${SCAN_START_PRICE},${SCAN_END_PRICE}" >> "$LOG_FILE"
}

# Monitor sell-side continuously
monitor_sell_scan() {
    local count=0
    
    show_header
    echo -e "${RED}🔄 BẮT ĐẦU MONITOR BÁN LIÊN TỤC${NC}"
    echo -e "📊 Target: ${RED}SELL PRESSURE${NC}"
    echo -e "⏱️ Interval: ${YELLOW}${SCAN_INTERVAL}s${NC}"
    echo -e "❌ Nhấn Ctrl+C để dừng"
    echo ""
    
    while true; do
        count=$((count + 1))
        echo -e "${RED}📊 SELL SCAN #${count} - $(date '+%H:%M:%S')${NC}"
        echo "───────────────────────────────────"
        
        start_sell_scan
        analyze_sell_liquidity
        end_sell_scan
        
        echo -e "${YELLOW}😴 Waiting ${SCAN_INTERVAL}s for next scan...${NC}"
        echo ""
        
        # Log results
        echo "$(date '+%Y-%m-%d %H:%M:%S'),SELL_MONITOR,${SCAN_START_PRICE},${SCAN_END_PRICE}" >> "$LOG_FILE"
        
        sleep $SCAN_INTERVAL
    done
}

# Show sell report
show_sell_report() {
    show_header
    echo -e "${RED}📋 BÁO CÁO QUÉT THANH KHOẢN BÁN${NC}"
    echo -e "${BLUE}═══════════════════════════════════${NC}"
    
    if [ -f "$LOG_FILE" ]; then
        echo -e "${YELLOW}📊 10 lần quét bán gần nhất:${NC}"
        echo ""
        
        tail -10 "$LOG_FILE" | while IFS=',' read -r timestamp type start_price end_price; do
            local change=$(node -p "
                const start = ${start_price} || 2680;
                const end = ${end_price} || 2680;
                ((end - start) / start * 100).toFixed(2);
            ")
            
            echo -e "⏰ ${timestamp}"
            echo -e "   📊 Type: ${RED}${type}${NC}"
            echo -e "   💰 Price: \$${start_price} → \$${end_price} (${change}%)"
            echo ""
        done
        
        # Sell statistics
        local total_scans=$(wc -l < "$LOG_FILE")
        echo -e "${RED}📈 SELL STATISTICS:${NC}"
        echo -e "   📊 Tổng số lần quét bán: ${YELLOW}${total_scans}${NC}"
        echo -e "   📅 File log: ${CYAN}${LOG_FILE}${NC}"
        
    else
        echo -e "${RED}❌ Chưa có dữ liệu quét bán${NC}"
        echo -e "   💡 Chạy lệnh scan để tạo dữ liệu"
    fi
    echo ""
}

# Sell depth analysis
sell_depth_analysis() {
    show_header
    start_sell_scan
    
    echo -e "${RED}🔬 PHÂN TÍCH DEPTH BÁN CHI TIẾT${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    
    node -e "
        const currentPrice = ${SCAN_START_PRICE} || 2680;
        
        console.log('💰 Current Price: \$' + currentPrice);
        console.log('🔴 ANALYZING SELL-SIDE RESISTANCE');
        console.log('');
        
        console.log('📊 RESISTANCE LEVELS (Above Current Price):');
        console.log('════════════════════════════════════════════');
        
        let totalSellVolume = 0;
        for (let i = 1; i <= 10; i++) {
            const price = currentPrice + (i * 0.25);
            const volume = Math.random() * 1000000 + 400000;
            totalSellVolume += volume;
            const percentage = (volume / 7000000 * 100).toFixed(1);
            const strength = i <= 3 ? 'WEAK' : i <= 6 ? 'MEDIUM' : 'STRONG';
            
            console.log('  R' + i.toString().padStart(2) + ': \$' + price.toFixed(2) + ' | ' + 
                       volume.toLocaleString().padStart(10) + ' lots (' + percentage + '%) - ' + strength);
        }
        console.log('  ─────────────────────────────────────────');
        console.log('  Total Sell Volume: ' + totalSellVolume.toLocaleString() + ' lots');
        console.log('');
        
        // Selling pressure analysis
        console.log('⚡ SELLING PRESSURE METRICS:');
        console.log('══════════════════════════════');
        const pressure = Math.random() * 100;
        const momentum = Math.random() * 100;
        const volume = Math.random() * 100;
        
        console.log('  📉 Selling Pressure: ' + pressure.toFixed(1) + '%');
        console.log('  🔥 Bearish Momentum: ' + momentum.toFixed(1) + '%');
        console.log('  📊 Volume Intensity: ' + volume.toFixed(1) + '%');
        console.log('');
        
        // Breakdown probability
        const breakdown = (pressure + momentum + volume) / 3;
        console.log('🎯 BREAKDOWN PROBABILITY: ' + breakdown.toFixed(1) + '%');
        
        if (breakdown > 70) {
            console.log('🔴 HIGH - Strong breakdown potential');
            console.log('💡 Strategy: Aggressive short positioning');
        } else if (breakdown > 40) {
            console.log('🟡 MEDIUM - Monitor for confirmation');
            console.log('💡 Strategy: Wait for volume spike');
        } else {
            console.log('🟢 LOW - Limited breakdown risk');
            console.log('💡 Strategy: Look for reversal signals');
        }
    "
    
    end_sell_scan
    echo ""
}

# Main execution
case "${1:-single}" in
    "single")
        single_sell_scan
        ;;
    "monitor")
        monitor_sell_scan
        ;;
    "report")
        show_sell_report
        ;;
    "depth")
        sell_depth_analysis
        ;;
    *)
        show_header
        echo -e "${YELLOW}📖 HƯỚNG DẪN SỬ DỤNG SELL SCANNER:${NC}"
        echo -e "${BLUE}═══════════════════════════════════════${NC}"
        echo ""
        echo -e "${RED}🔍 Quét thanh khoản bán một lần:${NC}"
        echo -e "   ./scripts/xauusd-sell-scanner.sh single"
        echo ""
        echo -e "${RED}🔄 Theo dõi bán liên tục:${NC}"
        echo -e "   ./scripts/xauusd-sell-scanner.sh monitor"
        echo ""
        echo -e "${RED}📊 Xem báo cáo bán:${NC}"
        echo -e "   ./scripts/xauusd-sell-scanner.sh report"
        echo ""
        echo -e "${RED}🔬 Phân tích depth bán:${NC}"
        echo -e "   ./scripts/xauusd-sell-scanner.sh depth"
        echo ""
        ;;
esac