
#!/bin/bash

# Vietnam Gold USD/VND Arsenal
# Kho vũ khí chuyên biệt cho áp lực tỷ giá và vàng

# Quick access commands
API_BASE="http://localhost:5000"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${RED}🚨 VIETNAM GOLD USD/VND ARSENAL - QUICK COMMANDS${NC}"
echo "==============================================="

echo -e "${YELLOW}📋 DANH SÁCH LỆNH CHUYÊN BIỆT:${NC}"
echo ""

echo -e "${GREEN}=== ÁP LỰC USD/VND ===${NC}"
echo "1. quick_usdvnd_blast    - Tấn công USD/VND nhanh (5 phút)"
echo "2. overnight_usd_pressure - Áp lực USD qua đêm với FED swap"
echo "3. usdvnd_volatility_boost - Tăng biến động USD/VND"
echo "4. fed_swap_simulation   - Mô phỏng FED swap pressure"
echo "17. increase_usdvnd      - TĂNG tỷ giá USD/VND (đẩy USD lên)"
echo "18. decrease_usdvnd      - GIẢM tỷ giá USD/VND (đẩy USD xuống)"
echo "19. volatile_usdvnd      - Tạo biến động mạnh USD/VND"
echo ""

echo -e "${PURPLE}=== VÀNG THẾ GIỚI ===${NC}"
echo "5. world_gold_pump       - Đẩy giá vàng thế giới lên"
echo "6. world_gold_dump       - Đẩy giá vàng thế giới xuống"
echo "7. london_fix_pressure   - Áp lực London Gold Fix"
echo "8. spot_gold_volatility  - Tăng biến động vàng spot"
echo ""

echo -e "${RED}=== SJC CHUYÊN BIỆT ===${NC}"
echo "9. sjc_premium_crusher   - Nghiền nát premium SJC"
echo "10. sjc_liquidity_vacuum - Hút cạn thanh khoản SJC"
echo "11. sjc_spread_destroyer - Phá hủy spread SJC"
echo "12. sjc_monopoly_breaker - Phá độc quyền SJC"
echo ""

echo -e "${CYAN}=== TẤN CÔNG TẬP HỢP ===${NC}"
echo "13. triple_sync_attack   - Tấn công đồng bộ 3 mặt trận"
echo "14. maximum_devastation  - Tàn phá tối đa"
echo "15. stealth_comprehensive - Tấn công tổng hợp âm thầm"
echo "16. monitor_all_fronts   - Giám sát tất cả mặt trận"
echo ""

case "${1:-}" in
    "quick_usdvnd_blast"|"1")
        echo -e "${YELLOW}💥 TẤN CÔNG USD/VND NHANH${NC}"
        python3 scripts/vietnam-gold-pressure-scanner.py full
        curl -X POST "$API_BASE/api/forex/usdvnd-pressure" \
            -H "Content-Type: application/json" \
            -d '{"action":"QUICK_BLAST","intensity":"HIGH","duration":300}'
        ;;
        
    "overnight_usd_pressure"|"2")
        echo -e "${BLUE}🌙 ÁP LỰC USD QUA ĐÊM${NC}"
        echo "Chọn hướng áp lực tỷ giá:"
        echo "1. Tăng USD/VND (tăng giá USD)"
        echo "2. Giảm USD/VND (giảm giá USD)"
        read -p "Chọn (1-2): " direction
        
        case "$direction" in
            "1")
                echo -e "${RED}📈 TĂNG TỶ GIÁ USD/VND${NC}"
                curl -X POST "$API_BASE/api/forex/usdvnd-pressure" \
                    -H "Content-Type: application/json" \
                    -d '{"action":"INCREASE_RATE","intensity":"HIGH","duration":1800,"target_rate":25500}'
                python3 scripts/vietnam-gold-pressure-scanner.py full
                ;;
            "2")
                echo -e "${GREEN}📉 GIẢM TỶ GIÁ USD/VND${NC}"
                curl -X POST "$API_BASE/api/forex/usdvnd-pressure" \
                    -H "Content-Type: application/json" \
                    -d '{"action":"DECREASE_RATE","intensity":"HIGH","duration":1800,"target_rate":24800}'
                python3 scripts/vietnam-gold-pressure-scanner.py full
                ;;
            *)
                echo -e "${YELLOW}Mặc định: Tăng tỷ giá${NC}"
                curl -X POST "$API_BASE/api/forex/usdvnd-pressure" \
                    -H "Content-Type: application/json" \
                    -d '{"action":"INCREASE_RATE","intensity":"MEDIUM","duration":900}'
                ;;
        esac
        ;;
        
    "usdvnd_volatility_boost"|"3")
        echo -e "${PURPLE}📈 TĂNG BIẾN ĐỘNG USD/VND${NC}"
        curl -X POST "$API_BASE/api/forex/volatility-boost" \
            -H "Content-Type: application/json" \
            -d '{"pair":"USDVND","boost_factor":3.5,"duration":600}'
        ;;
        
    "fed_swap_simulation"|"4")
        echo -e "${GREEN}🏦 MÔ PHỎNG FED SWAP${NC}"
        python3 scripts/vietnam-gold-pressure-scanner.py full
        ;;
        
    "world_gold_pump"|"5")
        echo -e "${YELLOW}🚀 ĐẨY VÀNG THẾ GIỚI LÊN${NC}"
        ./scripts/vietnam-gold-comprehensive-attack.sh execute_world_gold_pressure 2700 UP
        ;;
        
    "world_gold_dump"|"6")
        echo -e "${RED}📉 ĐẨY VÀNG THẾ GIỚI XUỐNG${NC}"
        ./scripts/vietnam-gold-comprehensive-attack.sh execute_world_gold_pressure 2600 DOWN
        ;;
        
    "london_fix_pressure"|"7")
        echo -e "${BLUE}🇬🇧 ÁP LỰC LONDON GOLD FIX${NC}"
        curl -X POST "$API_BASE/api/world-gold/london-fix-pressure" \
            -H "Content-Type: application/json" \
            -d '{"intensity":"EXTREME","fix_time":"15:00","duration":900}'
        ;;
        
    "spot_gold_volatility"|"8")
        echo -e "${PURPLE}⚡ BIẾN ĐỘNG VÀNG SPOT${NC}"
        curl -X POST "$API_BASE/api/world-gold/volatility-injection" \
            -H "Content-Type: application/json" \
            -d '{"volatility_factor":4.0,"duration":1200}'
        ;;
        
    "sjc_premium_crusher"|"9")
        echo -e "${RED}💀 NGHIỀN NÁT PREMIUM SJC${NC}"
        ./scripts/vietnam-gold-liquidity-attack.sh high_premium_exploit
        ;;
        
    "sjc_liquidity_vacuum"|"10")
        echo -e "${BLUE}🌪️ HÚT CẠN THANH KHOẢN SJC${NC}"
        ./scripts/vietnam-gold-comprehensive-attack.sh execute_sjc_liquidity_drain 85 10
        ;;
        
    "sjc_spread_destroyer"|"11")
        echo -e "${YELLOW}⚔️ PHÁ HỦY SPREAD SJC${NC}"
        ./scripts/vietnam-gold-liquidity-attack.sh attack_sjc_pressure EXTREME 900
        ;;
        
    "sjc_monopoly_breaker"|"12")
        echo -e "${PURPLE}🔨 PHÁ ĐỘC QUYỀN SJC${NC}"
        ./scripts/vietnam-gold-liquidity-attack.sh multi_target_attack
        ./scripts/vietnam-gold-liquidity-attack.sh burst_attack 15 8
        ;;
        
    "triple_sync_attack"|"13")
        echo -e "${CYAN}⚡ TẤN CÔNG ĐỒNG BỘ 3 MẶT TRẬN${NC}"
        ./scripts/vietnam-gold-comprehensive-attack.sh execute_synchronized_triple_attack 1800
        ;;
        
    "maximum_devastation"|"14")
        echo -e "${RED}💥 TÀN PHÁ TỐI ĐA${NC}"
        ./scripts/vietnam-gold-destroyer.sh destroy &
        ./scripts/vietnam-gold-comprehensive-attack.sh execute_synchronized_triple_attack 2400 &
        ./scripts/vietnam-gold-liquidity-attack.sh burst_attack 20 5 &
        wait
        ;;
        
    "stealth_comprehensive"|"15")
        echo -e "${BLUE}👤 TẤN CÔNG TỔNG HỢP ÂM THẦM${NC}"
        ./scripts/vietnam-gold-destroyer.sh stealth &
        ./scripts/vietnam-gold-liquidity-attack.sh stealth_liquidity_attack 25 &
        python3 scripts/vietnam-gold-pressure-scanner.py quick &
        wait
        ;;
        
    "monitor_all_fronts"|"16")
        echo -e "${GREEN}📺 GIÁM SÁT TẤT CẢ MẶT TRẬN${NC}"
        ./scripts/vietnam-gold-comprehensive-attack.sh start_comprehensive_monitoring 20
        ;;
        
    "increase_usdvnd"|"17")
        echo -e "${RED}📈 TĂNG TỶ GIÁ USD/VND${NC}"
        curl -X POST "$API_BASE/api/forex/usdvnd-manipulation" \
            -H "Content-Type: application/json" \
            -d '{"direction":"INCREASE","intensity":"HIGH","target_rate":25600,"duration":1200}'
        echo "✅ Lệnh tăng tỷ giá USD/VND đã được thực thi"
        ;;
        
    "decrease_usdvnd"|"18")
        echo -e "${GREEN}📉 GIẢM TỶ GIÁ USD/VND${NC}"
        curl -X POST "$API_BASE/api/forex/usdvnd-manipulation" \
            -H "Content-Type: application/json" \
            -d '{"direction":"DECREASE","intensity":"HIGH","target_rate":24700,"duration":1200}'
        echo "✅ Lệnh giảm tỷ giá USD/VND đã được thực thi"
        ;;
        
    "volatile_usdvnd"|"19")
        echo -e "${PURPLE}⚡ TẠO BIẾN ĐỘNG MẠNH USD/VND${NC}"
        curl -X POST "$API_BASE/api/forex/usdvnd-volatility" \
            -H "Content-Type: application/json" \
            -d '{"pattern":"EXTREME_VOLATILITY","frequency":30,"amplitude":200,"duration":900}'
        echo "✅ Lệnh tạo biến động USD/VND đã được kích hoạt"
        ;;
        
    *)
        echo -e "${CYAN}Sử dụng: $0 [command_number|command_name]${NC}"
        echo -e "${CYAN}Ví dụ: $0 1 hoặc $0 quick_usdvnd_blast${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Lệnh đã hoàn thành!${NC}"
