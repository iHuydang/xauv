import { useEffect, useRef, useState } from 'react';

export interface PriceUpdate {
  [symbol: string]: {
    bid: string;
    ask: string;
    change: string;
    changePercent: string;
  };
}

export function useWebSocket() {
  const [prices, setPrices] = useState<PriceUpdate>({});
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
    };
    
    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'priceUpdate') {
          setPrices(message.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return { prices, connectionStatus };
}
