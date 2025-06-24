#!/bin/bash

# Test gold price APIs to verify they work correctly
echo "🧪 Testing Gold Price APIs"
echo "=========================="

# Test GoldAPI
echo "📊 Testing GoldAPI.io..."
GOLD_DATA=$(curl -s -X GET "https://www.goldapi.io/api/XAU/USD" \
    -H "x-access-token: goldapi-a1omwe19mc2bnqkx-io")

if [ $? -eq 0 ] && [ -n "$GOLD_DATA" ]; then
    GOLD_PRICE=$(echo "$GOLD_DATA" | node -p "
    try {
        const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        data.price || '0';
    } catch(e) {
        '0';
    }
    ")
    echo "✅ Gold Price: \$${GOLD_PRICE}/oz"
else
    echo "❌ GoldAPI failed"
fi

# Test Exchange Rate API
echo "💱 Testing Exchange Rate API..."
RATE_DATA=$(curl -s "https://api.apilayer.com/exchangerates_data/latest?base=USD&symbols=VND&apikey=AFj8naQ2z4ouXlP6gluOHGrn3LqZpV3e")

if [ $? -eq 0 ] && [ -n "$RATE_DATA" ]; then
    USD_VND=$(echo "$RATE_DATA" | node -p "
    try {
        const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
        data.rates?.VND || '0';
    } catch(e) {
        '0';
    }
    ")
    echo "✅ USD/VND Rate: ${USD_VND}"
else
    echo "❌ Exchange Rate API failed"
fi

# Calculate Vietnam Gold Price
if [ "$GOLD_PRICE" != "0" ] && [ "$USD_VND" != "0" ]; then
    VN_GOLD=$(node -p "
    const priceUsd = parseFloat('$GOLD_PRICE');
    const usdVnd = parseFloat('$USD_VND');
    const taelRatio = 37.5 / 31.1035;
    const vnPrice = priceUsd * usdVnd * taelRatio;
    Math.round(vnPrice).toLocaleString();
    ")
    echo "🏆 Vietnam Gold Equivalent: ${VN_GOLD} VND/tael"
fi

echo "✅ API test completed"