
#!/bin/bash

# Vietnam Gold Attack Arsenal
# Kho vũ khí tấn công vàng Việt Nam

chmod +x scripts/vietnam-gold-liquidity-attack.sh
chmod +x scripts/quick-vietnam-attack.sh

echo "🚨 KHO VŨ KHÍ TẤN CÔNG VÀNG VIỆT NAM 🚨"
echo "========================================"

echo "📋 MENU LỆNH TẤIN CÔNG:"
echo "1. quick          - Tấn công nhanh tổng hợp"
echo "2. sjc_pressure   - Tấn công áp lực SJC"
echo "3. multi_target   - Tấn công đa mục tiêu"
echo "4. world_arb      - Tấn công chênh lệch giá thế giới"
echo "5. stealth        - Tấn công stealth"
echo "6. burst          - Tấn công burst"
echo "7. auto_monitor   - Giám sát tự động"
echo "8. status         - Kiểm tra trạng thái"
echo "9. stop_all       - Dừng tất cả"

case "${1:-}" in
    "quick")
        ./scripts/quick-vietnam-attack.sh
        ;;
    "sjc_pressure")
        ./scripts/vietnam-gold-liquidity-attack.sh attack_sjc_pressure EXTREME 600
        ;;
    "multi_target")
        ./scripts/vietnam-gold-liquidity-attack.sh multi_target_attack
        ;;
    "world_arb")
        ./scripts/vietnam-gold-liquidity-attack.sh world_price_arbitrage_attack
        ;;
    "stealth")
        ./scripts/vietnam-gold-liquidity-attack.sh stealth_liquidity_attack 15
        ;;
    "burst")
        ./scripts/vietnam-gold-liquidity-attack.sh burst_attack 8 12
        ;;
    "auto_monitor")
        ./scripts/vietnam-gold-liquidity-attack.sh auto_monitor_attack 30 35000
        ;;
    "status")
        ./scripts/vietnam-gold-liquidity-attack.sh check_attack_status
        ;;
    "stop_all")
        ./scripts/vietnam-gold-liquidity-attack.sh stop_all_attacks
        ;;
    *)
        echo "Sử dụng: $0 [lệnh]"
        echo "Ví dụ: $0 quick"
        ;;
esac
