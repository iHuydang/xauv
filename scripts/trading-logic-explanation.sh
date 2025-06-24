#!/bin/bash

# Giải thích logic trading cho scanner
echo "📚 GIẢI THÍCH LOGIC TRADING SCANNER"
echo "=================================="

cat << 'EOF'

🔍 QUÉ PHE MUA (BUY SIDE SCAN):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Tìm SUPPORT LEVELS (các mức giá có nhiều lệnh mua chờ)
• Phát hiện DEMAND ZONES (vùng có áp lực mua mạnh)
• Xác định LIQUIDITY POOLS của phe mua
• Mục đích: Tìm nơi giá có thể BOUNCE UP khi xuống

📊 Ý nghĩa kết quả:
  ✅ Nhiều buy orders tại level → Support mạnh → Giá khó giảm
  ❌ Ít buy orders tại level → Support yếu → Giá dễ breakdown

🔍 QUÉ PHE BÁN (SELL SIDE SCAN):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Tìm RESISTANCE LEVELS (các mức giá có nhiều lệnh bán chờ)
• Phát hiện SUPPLY ZONES (vùng có áp lực bán mạnh)
• Xác định SELL WALLS và STOP CLUSTERS
• Mục đích: Tìm nơi giá có thể GẶP CẢN TRỞ khi lên

📊 Ý nghĩa kết quả:
  ❌ Nhiều sell orders tại level → Resistance mạnh → Giá khó tăng
  ✅ Ít sell orders tại level → Resistance yếu → Giá dễ breakthrough

💡 TRADING STRATEGY:
━━━━━━━━━━━━━━━━━━━━━━
🎯 Khi quét BUY SIDE:
  • Nếu support mạnh → Có thể mua gần level đó
  • Nếu support yếu → Tránh mua, chờ breakdown

🎯 Khi quét SELL SIDE:
  • Nếu resistance mạnh → Có thể bán gần level đó
  • Nếu resistance yếu → Đợi breakthrough rồi mua

⚠️ LƯU Ý QUAN TRỌNG:
━━━━━━━━━━━━━━━━━━━━━━
• Quét sell side ≠ Dự đoán giá tăng
• Quét sell side = Tìm hiểu áp lực bán để đưa ra quyết định
• Market maker thường "hunt" liquidity ở các level này

🚀 CHIẾN THUẬT NÂNG CAO:
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Liquidity Hunt: MM thường đẩy giá đến level có nhiều stop loss
• Stop Hunt: Sweep các level có stop clusters trước khi reverse
• Absorption: MM absorb all sell orders rồi pump mạnh

EOF

echo ""
echo "💼 Áp dụng vào XAUUSD:"
echo "• Buy side scan: Tìm support để long"
echo "• Sell side scan: Tìm resistance để short hoặc đợi breakthrough"
echo "• Range scan: Phân tích cả hai phe trong khoảng giá"