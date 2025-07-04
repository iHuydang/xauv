const WebSocket = require("ws");

class MarketNewsClient {
  constructor(url = "ws://localhost:5000") {
    this.url = url;
    this.ws = null;
    this.connected = false;
    this.subscriptions = [];
  }

  connect() {
    console.log("🔗 Kết nối WebSocket tới:", this.url);

    this.ws = new WebSocket(this.url);

    this.ws.on("open", () => {
      console.log("✅ Kết nối thành công!");
      this.connected = true;
      this.sendPing();
    });

    this.ws.on("message", (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(message);
      } catch (error) {
        console.log("📨 Raw message:", data.toString());
      }
    });

    this.ws.on("close", (code, reason) => {
      console.log(`🔌 Kết nối đóng: ${code} - ${reason}`);
      this.connected = false;
    });

    this.ws.on("error", (error) => {
      console.error("❌ Lỗi WebSocket:", error.message);
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case "welcome":
        console.log("👋", message.message);
        break;

      case "market_news":
        console.log("\n📰 TIN TỨC MỚI:");
        console.log("📌 Tiêu đề:", message.data.title);
        console.log("📝 Nội dung:", message.data.content);
        console.log("🏷️ Loại:", message.data.category);
        console.log("⚡ Tác động:", message.data.impact);
        console.log("📊 Symbols:", message.data.symbols.join(", "));
        console.log(
          "⏰ Thời gian:",
          new Date(message.data.timestamp).toLocaleString(),
        );
        console.log("═".repeat(60));
        break;

      case "pong":
        console.log("🏓 Pong nhận được");
        break;

      default:
        console.log("📨 Tin nhắn:", message);
    }
  }

  sendPing() {
    if (this.connected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "ping" }));
    }
  }

  subscribe(symbols) {
    if (this.connected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "subscribe",
          symbols: symbols,
        }),
      );
      this.subscriptions = symbols;
      console.log("📡 Đã đăng ký theo dõi:", symbols.join(", "));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Test client
const client = new MarketNewsClient();
client.connect();

// Đăng ký theo dõi một số symbols
setTimeout(() => {
  client.subscribe(["EURUSD", "XAUUSD", "BTCUSD"]);
}, 1000);

// Gửi ping mỗi 30 giây
setInterval(() => {
  client.sendPing();
}, 30000);

// Giữ process chạy
process.on("SIGINT", () => {
  console.log("\n👋 Đang ngắt kết nối...");
  client.disconnect();
  process.exit(0);
});

module.exports = MarketNewsClient;
