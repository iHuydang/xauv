const WebSocket = require("ws");

console.log("🥇 Khởi tạo kết nối Coinranking WebSocket cho thị trường vàng...");

const apiKey = "coinranking46318b67be4b6ae6bd776b982d0e9b852bc0776d6cee1174";
const wsUrl = `wss://api.coinranking.com/v2/real-time/rates?x-access-token=${apiKey}`;

console.log("🔗 Đang kết nối:", wsUrl.substring(0, 60) + "...");

const ws = new WebSocket(wsUrl);

// Định nghĩa các UUID vàng từ Coinranking
const goldAssets = {
  bitcoin: "Qwsogvtv82FCd", // BTC (vàng số)
  ethereum: "razxDUgYGNAdQ", // ETH
  goldToken: "Vuy-IUC7", // Gold-backed token
  tether: "HIVsRcGKkPFtW", // USDT
  goldCoin: "YRTkUcMi", // Gold asset khác
};

ws.onopen = () => {
  console.log("✅ WebSocket kết nối thành công!");

  // Đăng ký theo dõi các tài sản vàng
  const subscription = {
    throttle: "1s",
    uuids: Object.values(goldAssets),
  };

  console.log(
    "📡 Gửi đăng ký theo dõi:",
    JSON.stringify(subscription, null, 2),
  );
  ws.send(JSON.stringify(subscription));
};

ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    console.log("📨 Nhận dữ liệu thị trường vàng:");

    if (data.rates) {
      data.rates.forEach((rate) => {
        console.log(
          `💰 ${rate.symbol}: $${parseFloat(rate.price).toFixed(4)} (${rate.change > 0 ? "+" : ""}${rate.change}%)`,
        );
      });
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log("📨 Dữ liệu thô:", event.data);
  }
};

ws.onclose = (event) => {
  console.log("🔌 Kết nối đóng:", event.code, event.reason);
};

ws.onerror = (error) => {
  console.log("❌ Lỗi WebSocket:", error.message);
};

// Chạy trong 60 giây
setTimeout(() => {
  console.log("⏰ Kết thúc test, đóng kết nối");
  ws.close();
  process.exit(0);
}, 60000);
