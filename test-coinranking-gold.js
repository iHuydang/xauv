
const WebSocket = require('ws');

console.log('🥇 Testing Coinranking Gold Market WebSocket...');

const apiKey = 'coinranking46318b67be4b6ae6bd776b982d0e9b852bc0776d6cee1174';
const wsUrl = `wss://api.coinranking.com/v2/real-time/rates?x-access-token=${apiKey}`;

console.log('🔗 Connecting to Coinranking Gold API...');

const ws = new WebSocket(wsUrl);

let connectionTimeout = setTimeout(() => {
  console.log('⏰ Connection timeout after 10 seconds');
  ws.close();
}, 10000);

ws.onopen = () => {
  console.log('✅ Coinranking WebSocket connected successfully!');
  clearTimeout(connectionTimeout);
  
  // Subscribe to gold assets as you specified
  const subscription = {
    throttle: '1s',
    uuids: ['Vuy-IUC7', 'YRTkUcMi'] // Gold tokens
  };
  
  console.log('📡 Subscribing to gold assets:', subscription.uuids);
  ws.send(JSON.stringify(subscription));
  
  // Also try subscribing to popular assets for comparison
  setTimeout(() => {
    const btcSubscription = {
      throttle: '1s', 
      uuids: ['Qwsogvtv82FCd'] // Bitcoin
    };
    console.log('📡 Also subscribing to BTC for comparison');
    ws.send(JSON.stringify(btcSubscription));
  }, 2000);
};

ws.onmessage = (msg) => {
  try {
    const data = JSON.parse(msg.data);
    console.log('📊 Received gold market data:');
    console.log(JSON.stringify(data, null, 2));
    
    // Process the data as you would in your application
    if (data && data.rates) {
      data.rates.forEach(rate => {
        console.log(`💰 ${rate.symbol || rate.uuid}: $${rate.price} (${rate.change || 0}%)`);
      });
    }
  } catch (error) {
    console.log('📨 Raw message (non-JSON):', msg.data);
  }
};

ws.onclose = (event) => {
  console.log(`🔌 Connection closed: ${event.code} - ${event.reason || 'No reason provided'}`);
  clearTimeout(connectionTimeout);
};

ws.onerror = (error) => {
  console.log('❌ WebSocket error:', error.message || error);
  clearTimeout(connectionTimeout);
};

// Test for 30 seconds
setTimeout(() => {
  console.log('⏰ Test completed, closing connection');
  ws.close();
  process.exit(0);
}, 30000);

console.log('🔄 Test will run for 30 seconds...');
