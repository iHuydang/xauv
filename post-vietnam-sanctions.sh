
#!/bin/bash

# Import functions từ complete-market-commands.sh
source scripts/complete-market-commands.sh

echo "🚨 Đăng tin tức cấm vận Việt Nam..."

post_economic_news \
    "Hoa Kỳ áp lệnh cấm vận toàn diện Việt Nam" \
    "Mỹ tuyên bố cắt đứt hoàn toàn quan hệ thương mại, tài chính và công nghệ với Việt Nam, khiến nền kinh tế Việt Nam rơi vào tình trạng khủng hoảng nghiêm trọng." \
    "very_high" \
    "VNINDEX,VND,USDVND"

echo "✅ Tin tức đã được đăng thành công!"
