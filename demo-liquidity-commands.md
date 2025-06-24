# Demo Commands - XAUUSD Liquidity Scanner

## 1. Test Scanner Cơ Bản
```bash
# Giá hiện tại: ~$3320/oz
./scripts/quick-range-scan.sh range 3300 3350
```

## 2. Demo Quét Phe Mua (Support Analysis)
```bash
# Tìm support levels từ $3280-$3320
./scripts/xauusd-advanced-scanner.sh buy 3280 3320
```
**Ý nghĩa:** Tìm vùng có nhiều buy orders để xác định support. Nhiều buy orders = support mạnh.

## 3. Demo Quét Phe Bán (Resistance Analysis)  
```bash
# Tìm resistance levels từ $3340-$3380
./scripts/xauusd-advanced-scanner.sh sell 3340 3380
```
**Ý nghĩa:** Tìm vùng có nhiều sell orders = resistance. KHÔNG có nghĩa giá sẽ tăng!

## 4. Demo Range Scan Toàn Diện
```bash
# Phân tích toàn bộ range $3300-$3400
./scripts/xauusd-advanced-scanner.sh range 3300 3400
```

## 5. Demo Monitoring Liên Tục
```bash
# Theo dõi breakthrough resistance
./scripts/xauusd-advanced-scanner.sh monitor sell 3350 3400
```

## 6. Xem Logic Giải Thích
```bash
./scripts/trading-logic-explanation.sh
```

## Test Real-time với Multiple Sources
Script sẽ tự động fallback giữa:
- GoldAPI.io (primary)
- buying-gold.goldprice.org  
- selling-gold.goldprice.org
- api2.goldprice.org
- XTB xAPI (real-time WebSocket data)

## 7. Demo XTB xAPI Integration (MỚI)
```bash
# Check XTB connection status
./scripts/xtb-gold-scanner.sh status

# Connect to XTB xAPI
./scripts/xtb-gold-scanner.sh connect

# XTB liquidity scan với range
./scripts/xtb-gold-scanner.sh scan 3300 3350

# So sánh XTB vs các nguồn khác
./scripts/xtb-gold-scanner.sh compare

# Lấy giá XTB real-time
./scripts/xtb-gold-scanner.sh price
```

## Kết Quả Mong Đợi:
- Giá vàng thời gian thực: ~$3320-3330/oz
- Tỷ giá USD/VND: ~26,000-27,000
- Giá VN: ~105M VND/chỉ
- Levels được tạo tự động trong khoảng
- Logic explanation rõ ràng