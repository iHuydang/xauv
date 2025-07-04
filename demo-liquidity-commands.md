# Demo Commands - XAUUSD Liquidity Scanner

## 1. Working Gold Scanner (RECOMMENDED)

```bash
# Support analysis (buy side)
./scripts/working-gold-scanner.sh buy 3300 3340

# Resistance analysis (sell side)
./scripts/working-gold-scanner.sh sell 3340 3380

# Custom range scan
./scripts/working-gold-scanner.sh range 3250 3400

# Continuous monitoring (30s intervals)
./scripts/working-gold-scanner.sh monitor 3300 3350 30
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

## 7. Enhanced Multi-Source Scanner (WORKING)

```bash
# Enhanced scanner với multi-source validation
./scripts/enhanced-multi-source-scanner.sh scan 3300 3350 buy

# Buy side analysis với support levels
./scripts/enhanced-multi-source-scanner.sh buy 3300 3340

# Sell side analysis với resistance levels
./scripts/enhanced-multi-source-scanner.sh sell 3340 3380

# Continuous monitoring
./scripts/enhanced-multi-source-scanner.sh monitor 3250 3400
```

## 8. XTB xAPI Integration (REQUIRES CREDENTIALS)

```bash
# XTB requires real account credentials to work
# Current status: Fallback to multi-source scanner
./scripts/xtb-gold-scanner.sh status
```

## Kết Quả Mong Đợi:

- Giá vàng thời gian thực: ~$3320-3330/oz
- Tỷ giá USD/VND: ~26,000-27,000
- Giá VN: ~105M VND/chỉ
- Levels được tạo tự động trong khoảng
- Logic explanation rõ ràng
