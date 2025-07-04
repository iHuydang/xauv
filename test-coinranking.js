const WebSocket = require("ws");

console.log("🔬 Testing Coinranking API Connection...");

const apiKey = "coinranking46318b67be4b6ae6bd776b982d0e9b852bc0776d6cee1174";
const wsUrl = `wss://api.coinranking.com/v2/real-time/rates?x-access-token=${apiKey}`;

console.log("🔗 Connecting to:", wsUrl.substring(0, 60) + "...");

const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  console.log("✅ WebSocket connected successfully!");

  // Subscribe to BTC and Gold tokens
  const subscription = {
    throttle: "1s",
    uuids: ["Qwsogvtv82FCd", "razxDUgYGNAdQ"], // BTC and ETH
  };

  console.log("📡 Sending subscription:", JSON.stringify(subscription));
  ws.send(JSON.stringify(subscription));
};

ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    console.log("📨 Received data:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.log("📨 Raw message:", event.data);
  }
};

ws.onclose = (event) => {
  console.log("🔌 Connection closed:", event.code, event.reason);
};

ws.onerror = (error) => {
  console.log("❌ WebSocket error:", error.message);
};

// Test for 30 seconds
setTimeout(() => {
  console.log("⏰ Test timeout, closing connection");
  ws.close();
  process.exit(0);
}, 30000);
