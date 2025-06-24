# XAUUSD Enhanced Liquidity Scanner - Demo Commands

## Enhanced Scanner Commands

### Quét một lần (Single Scan)
```bash
# Quét cả hai phía (buy + sell)
./scripts/xauusd-enhanced-scanner.sh single

# Chỉ quét phe mua
./scripts/xauusd-enhanced-scanner.sh buy

# Chỉ quét phe bán  
./scripts/xauusd-enhanced-scanner.sh sell
```

### Theo dõi liên tục (Monitor)
```bash
# Theo dõi cả hai phía
./scripts/xauusd-enhanced-scanner.sh monitor

# Theo dõi chỉ phe mua
./scripts/xauusd-enhanced-scanner.sh monitor buy

# Theo dõi chỉ phe bán
./scripts/xauusd-enhanced-scanner.sh monitor sell
```

### Phân tích depth chi tiết
```bash
# Phân tích depth cả hai phía
./scripts/xauusd-enhanced-scanner.sh depth

# Phân tích depth phe mua
./scripts/xauusd-enhanced-scanner.sh depth buy

# Phân tích depth phe bán
./scripts/xauusd-enhanced-scanner.sh depth sell
```

### Xem báo cáo
```bash
./scripts/xauusd-enhanced-scanner.sh report
```

## Sell Scanner Commands

### Quét thanh khoản bán
```bash
# Quét một lần
./scripts/xauusd-sell-scanner.sh single

# Theo dõi liên tục
./scripts/xauusd-sell-scanner.sh monitor

# Phân tích depth bán
./scripts/xauusd-sell-scanner.sh depth

# Báo cáo bán
./scripts/xauusd-sell-scanner.sh report
```

## API Endpoints

### REST API Calls
```bash
# Quét thanh khoản qua API
curl -X POST http://localhost:5000/api/liquidity/scan \
  -H "Content-Type: application/json" \
  -d '{"side":"buy"}'

# Bắt đầu monitor
curl -X POST http://localhost:5000/api/liquidity/monitor/start \
  -H "Content-Type: application/json" \
  -d '{"side":"both","interval":15}'

# Phân tích depth
curl -X POST http://localhost:5000/api/liquidity/depth \
  -H "Content-Type: application/json" \
  -d '{"side":"sell"}'

# Thống kê scanner
curl http://localhost:5000/api/liquidity/enhanced-stats
```

## Key Features Implemented

✓ **Hiển thị rõ ràng thời gian bắt đầu/kết thúc quét**
✓ **Giá bắt đầu và kết thúc quét với % thay đổi**
✓ **Phân tích thanh khoản % phe mua/bán**
✓ **Depth analysis chi tiết với volume levels**
✓ **Cơ hội thị trường và khuyến nghị**
✓ **Risk analysis cho selling**
✓ **Support/Resistance levels**
✓ **API integration hoàn chỉnh**
✓ **Monitoring liên tục với interval tùy chỉnh**

## Output Example
```
🚀 BẮT ĐẦU QUÉT THANH KHOẢN
⏰ Thời gian bắt đầu: 07:51:37
💰 Giá bắt đầu quét: $2686.92
📊 Loại quét: Single Scan - BUY

📊 PHÂN TÍCH THANH KHOẢN BUY
💚 Thanh khoản BUY: 5,950,963.922 lots (63.3%)
💔 Thanh khoản SELL: 3,457,574.674 lots (36.7%)
🔥 ÁP LỰC MUA MẠNH - Buy pressure dominates (63.3%)

🏁 KẾT THÚC QUÉT THANH KHOẢN
⏰ Thời gian kết thúc: 07:51:39
💰 Giá kết thúc quét: $2685.13
📊 Thay đổi giá: -0.07%
```