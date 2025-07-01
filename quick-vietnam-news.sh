
#!/bin/bash

# Load functions
source scripts/complete-market-commands.sh

# Đăng tin cấm vận với 1 lệnh đơn giản
post_economic_news \
    "Hoa Kỳ áp lệnh cấm vận toàn diện Việt Nam" \
    "Mỹ tuyên bố cắt đứt hoàn toàn quan hệ thương mại, tài chính và công nghệ với Việt Nam, khiến nền kinh tế Việt Nam rơi vào tình trạng khủng hoảng nghiêm trọng." \
    "very_high" \
    "VNINDEX,VND,USDVND"
