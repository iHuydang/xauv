# Hướng Dẫn Sử Dụng XAUUSD Scanner Nâng Cao

## Scripts Có Sẵn:

### 1. Scanner Cơ Bản (Đã Fix)

```bash
# Quét một lần
./scripts/xauusd-scanner-fixed.sh single

# Quét phe mua/bán
./scripts/xauusd-scanner-fixed.sh buy
./scripts/xauusd-scanner-fixed.sh sell

# Theo dõi liên tục
./scripts/xauusd-scanner-fixed.sh monitor
```

### 2. Scanner Nâng Cao Với Khoảng Giá (MỚI)

```bash
# Cú pháp: [mode] [side] [giá_min] [giá_max]

# Quét phe mua từ $3300-$3350
./scripts/xauusd-advanced-scanner.sh buy 3300 3350

# Quét phe bán từ $3320-$3380
./scripts/xauusd-advanced-scanner.sh sell 3320 3380

# Quét toàn khoảng $3250-$3400
./scripts/xauusd-advanced-scanner.sh range 3250 3400

# Theo dõi liên tục phe mua trong khoảng
./scripts/xauusd-advanced-scanner.sh monitor buy 3300 3350

# Phân tích độ sâu theo khoảng
./scripts/xauusd-advanced-scanner.sh depth sell 3320 3380
```

### 3. Scanner Nhanh (Không Bị Timeout)

```bash
# Quét nhanh khoảng $3300-$3350
./scripts/quick-range-scan.sh range 3300 3350
```

## Tính Năng Mới:

### ✅ Tùy Chọn Khoảng Giá

- Có thể chỉ định giá min và max để quét
- Hệ thống sẽ tạo các level trong khoảng đó
- Kiểm tra giá hiện tại có nằm trong khoảng không

### ✅ Tích Hợp Nhiều Nguồn Dữ Liệu

- GoldAPI.io (nguồn chính)
- buying-gold.goldprice.org
- selling-gold.goldprice.org
- api2.goldprice.org
- Subdomain đặc biệt becaz-zcum-rizes-to-the-top-oph-the-cezzpool.goldprice.org

### ✅ Bảo Mật Goldprice.org

- Sử dụng header spoofing để bypass security
- Rotation User-Agent
- Fallback graceful khi bị block

## Ví Dụ Thực Tế:

### Quét Mua Ở Vùng Support

```bash
# Quét cơ hội mua từ $3280-$3320 (vùng support)
./scripts/xauusd-advanced-scanner.sh buy 3280 3320
```

### Quét Bán Ở Vùng Resistance

```bash
# Quét cơ hội bán từ $3350-$3400 (vùng resistance)
./scripts/xauusd-advanced-scanner.sh sell 3350 3400
```

### Theo Dõi Breakout

```bash
# Theo dõi liên tục breakout trên $3350
./scripts/xauusd-advanced-scanner.sh monitor both 3350 3400
```

## Kết Quả Scanner:

Hệ thống sẽ hiển thị:

- ✅ Giá vàng thời gian thực từ API chính xác
- ✅ Tỷ giá USD/VND cập nhật
- ✅ Giá vàng VN tương đương
- ✅ Vị trí giá hiện tại trong khoảng quét (%)
- ✅ Các level mua/bán đề xuất trong khoảng
- ✅ Support/Resistance levels
- ✅ Lưu log chi tiết

## Test Nguồn Dữ Liệu:

```bash
# Test tất cả subdomain goldprice.org
./scripts/goldprice-integration-test.sh
```

Hệ thống giờ hoạt động ổn định với dữ liệu thật và không còn bị treo kết nối.
