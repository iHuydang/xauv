
#!/bin/bash

# Rapid Vietnam Gold Strike - Tấn công nhanh tất cả mặt trận
# Lệnh 30 giây để khởi chạy toàn bộ áp lực

API_BASE="http://localhost:5000"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║               RAPID VIETNAM GOLD STRIKE                     ║"
echo "║          🚨 TẤN CÔNG NHANH 30 GIÂY TẤT CẢ MẶT TRẬN 🚨      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}⚡ Khởi chạy tất cả mặt trận trong 30 giây...${NC}"

# 1. USD/VND Pressure (5 giây)
echo -e "${BLUE}1/6 💱 USD/VND Pressure...${NC}"
python3 scripts/vietnam-gold-pressure-scanner.py quick &
curl -X POST "$API_BASE/api/forex/usdvnd-pressure" \
    -H "Content-Type: application/json" \
    -d '{"action":"RAPID_STRIKE","intensity":"EXTREME","duration":900}' &

sleep 5

# 2. World Gold Pressure (5 giây)
echo -e "${PURPLE}2/6 🌍 World Gold Pressure...${NC}"
curl -X POST "$API_BASE/api/world-gold/pressure-attack" \
    -H "Content-Type: application/json" \
    -d '{"vector":"RAPID_PUMP","target_price":2720,"intensity":"MAXIMUM"}' &

sleep 5

# 3. SJC Direct Attack (5 giây)
echo -e "${RED}3/6 🥇 SJC Direct Attack...${NC}"
curl -X POST "$API_BASE/api/attack/sjc-pressure" \
    -H "Content-Type: application/json" \
    -d '{"intensity":"EXTREME","duration":600,"vector":"RAPID_ASSAULT"}' &

sleep 5

# 4. Liquidity Drainage (5 giây)
echo -e "${CYAN}4/6 💧 Liquidity Drainage...${NC}"
curl -X POST "$API_BASE/api/attack/vietnam-gold" \
    -H "Content-Type: application/json" \
    -d '{"target":"ALL","intensity":"MAXIMUM","volume_multiplier":8.0}' &

sleep 5

# 5. Multi-Target Strike (5 giây)
echo -e "${YELLOW}5/6 🎯 Multi-Target Strike...${NC}"
./scripts/vietnam-gold-liquidity-attack.sh multi_target_attack &
./scripts/vietnam-gold-liquidity-attack.sh burst_attack 10 3 &

sleep 5

# 6. Coordinated Destroyer (5 giây)
echo -e "${RED}6/6 💥 Coordinated Destroyer...${NC}"
./scripts/vietnam-gold-destroyer.sh coordinated &

sleep 5

echo -e "${GREEN}✅ TẤT CẢ MẶT TRẬN ĐÃ KHỞI CHẠY TRONG 30 GIÂY!${NC}"
echo -e "${CYAN}📊 Kiểm tra trạng thái:${NC}"

# Status check
curl -s "$API_BASE/api/attack/status" | jq '.data.active_attacks | length' | while read count; do
    echo -e "${GREEN}🔥 Có $count cuộc tấn công đang hoạt động${NC}"
done

echo -e "${YELLOW}💡 Sử dụng lệnh sau để giám sát:${NC}"
echo "./scripts/vietnam-gold-comprehensive-attack.sh start_comprehensive_monitoring 15"
