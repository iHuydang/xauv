#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vietnam Gold Pressure Scanner với thuật toán áp lực USD/VND
Quét thanh khoản vàng Việt Nam và phân tích áp lực tỷ giá
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, List, Tuple, Optional

class VietnamGoldPressureScanner:
    def __init__(self):
        self.base_api = "http://localhost:5000"
        self.gold_api_key = "goldapi-a1omwe19mc2bnqkx-io"
        self.fed_api_url = "https://markets.newyorkfed.org/api/fxs/all/latest.json"
        self.fallback_usdvnd = 25100
        
        # Dữ liệu swap USD/VND qua đêm (termInDays = 1)
        self.fx_swaps_data = {
            "fxSwaps": {
                "operations": [
                    {
                        "operationType": "U.S. Dollar Liquidity Swap",
                        "counterparty": "European Central Bank",
                        "currency": "USD",
                        "tradeDate": "2025-06-26",
                        "settlementDate": "2025-06-26",
                        "maturityDate": "2025-06-27",
                        "termInDays": 1,
                        "amount": 150000000,   # 150 triệu USD
                        "interestRate": 5.5,
                        "isSmallValue": "N",
                        "lastUpdated": "2025-06-26 10:00:00"
                    },
                    {
                        "operationType": "Non-U.S. Dollar Liquidity Swap",
                        "counterparty": "Bank of Japan",
                        "currency": "JPY",
                        "tradeDate": "2025-06-26",
                        "termInDays": 1,
                        "amount": 7000000000,
                        "interestRate": 1.2,
                        "isSmallValue": "Y",
                        "lastUpdated": "2025-06-26 10:00:00"
                    },
                    {
                        "operationType": "Vietnamese Dong Liquidity Pressure",
                        "counterparty": "State Bank of Vietnam",
                        "currency": "VND",
                        "tradeDate": "2025-06-26",
                        "termInDays": 1,
                        "amount": 2500000000000,  # 2.5 nghìn tỷ VND
                        "interestRate": 4.8,
                        "isSmallValue": "N",
                        "lastUpdated": "2025-06-26 10:00:00"
                    }
                ]
            }
        }

    def get_usdvnd_rate(self) -> float:
        """Bước 1: Lấy tỷ giá USD/VND thời gian thực"""
        try:
            response = requests.get(self.fed_api_url, timeout=10)
            data = response.json()
            if "rates" in data and "VND" in data["rates"]:
                return float(data["rates"]["VND"])
        except Exception as e:
            print(f"⚠️  Lỗi lấy tỷ giá từ Fed: {e}")
        
        # Fallback API
        try:
            backup_url = "https://api.exchangerate-api.com/v4/latest/USD"
            response = requests.get(backup_url, timeout=10)
            data = response.json()
            if "rates" in data and "VND" in data["rates"]:
                return float(data["rates"]["VND"])
        except Exception as e:
            print(f"⚠️  Lỗi lấy tỷ giá backup: {e}")
        
        return self.fallback_usdvnd  # fallback nếu API lỗi

    def simulate_overnight_usd_pressure(self, fx_data: Dict, base_rate: float) -> Tuple[float, float]:
        """Bước 3: Mô phỏng áp lực USD qua đêm"""
        pressure = 0
        
        for op in fx_data["fxSwaps"]["operations"]:
            if (op["currency"] == "USD" and 
                op["operationType"] == "U.S. Dollar Liquidity Swap" and 
                op["termInDays"] == 1):
                
                amount = op["amount"]
                rate = op["interestRate"]
                # normalized pressure = USD x lãi suất %
                pressure += (amount / 1e6) * (rate / 100)
            
            # Thêm áp lực VND
            elif (op["currency"] == "VND" and 
                  op["operationType"] == "Vietnamese Dong Liquidity Pressure"):
                
                vnd_amount = op["amount"]
                vnd_rate = op["interestRate"]
                # VND pressure (nghịch đảo)
                pressure += (vnd_amount / 1e12) * (vnd_rate / 100) * -0.5

        # Giả định: mỗi điểm pressure tăng 0.005% tỷ giá
        delta = pressure * 0.00005
        adjusted_rate = base_rate * (1 + delta)
        return round(adjusted_rate, 2), round(pressure, 4)

    def get_vietnam_gold_prices(self) -> Dict:
        """Lấy giá vàng Việt Nam từ các nguồn"""
        try:
            response = requests.get(f"{self.base_api}/api/vietnam-gold/prices", timeout=15)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"⚠️  Lỗi lấy giá vàng VN: {e}")
        
        return {"success": False, "data": {"prices": []}}

    def get_world_gold_price(self) -> float:
        """Lấy giá vàng thế giới"""
        try:
            url = f"https://goldprice.org/api/json/{self.gold_api_key}"
            response = requests.get(url, timeout=10)
            data = response.json()
            return float(data["price"])
        except Exception as e:
            print(f"⚠️  Lỗi lấy giá vàng thế giới: {e}")
            return 3327.50  # fallback

    def calculate_pressure_metrics(self, world_gold: float, vn_gold_data: Dict, 
                                 base_usdvnd: float, adjusted_usdvnd: float) -> Dict:
        """Tính toán các chỉ số áp lực"""
        metrics = {
            "usd_pressure": round(((adjusted_usdvnd - base_usdvnd) / base_usdvnd) * 100, 4),
            "gold_arbitrage_opportunities": [],
            "vietnam_gold_pressure": [],
            "recommended_actions": []
        }
        
        # Tính giá vàng VN theo tỷ giá điều chỉnh
        tael_to_oz_ratio = 37.5 / 31.1035
        theoretical_vn_gold = world_gold * adjusted_usdvnd * tael_to_oz_ratio
        
        if vn_gold_data.get("success") and vn_gold_data["data"]["prices"]:
            for price in vn_gold_data["data"]["prices"]:
                actual_price = price.get("buy", 0)
                if actual_price > 0:
                    arbitrage = ((actual_price - theoretical_vn_gold) / theoretical_vn_gold) * 100
                    
                    metrics["gold_arbitrage_opportunities"].append({
                        "source": price["source"],
                        "actual_price": actual_price,
                        "theoretical_price": round(theoretical_vn_gold),
                        "arbitrage_percent": round(arbitrage, 2),
                        "pressure_level": "HIGH" if abs(arbitrage) > 2 else "MEDIUM" if abs(arbitrage) > 1 else "LOW"
                    })
                    
                    # Phân tích áp lực
                    if arbitrage > 2:
                        metrics["recommended_actions"].append(f"SELL {price['source']}: Overpriced by {arbitrage:.2f}%")
                    elif arbitrage < -2:
                        metrics["recommended_actions"].append(f"BUY {price['source']}: Underpriced by {abs(arbitrage):.2f}%")
        
        return metrics

    def execute_pressure_scan(self, scan_type: str = "full") -> Dict:
        """Thực hiện quét áp lực hoàn chỉnh"""
        print("🚀 BẮT ĐẦU QUÉT ÁP LỰC VÀNG VIỆT NAM")
        print("=" * 60)
        
        # Bước 1: Lấy tỷ giá USD/VND
        print("📊 Đang lấy tỷ giá USD/VND...")
        base_usdvnd = self.get_usdvnd_rate()
        
        # Bước 2: Mô phỏng áp lực qua đêm
        print("🌙 Đang tính áp lực swap USD qua đêm...")
        adjusted_usdvnd, pressure_score = self.simulate_overnight_usd_pressure(
            self.fx_swaps_data, base_usdvnd
        )
        
        # Bước 3: Lấy giá vàng
        print("💰 Đang lấy giá vàng thế giới và Việt Nam...")
        world_gold = self.get_world_gold_price()
        vn_gold_data = self.get_vietnam_gold_prices()
        
        # Bước 4: Phân tích áp lực
        print("📈 Đang phân tích áp lực thị trường...")
        pressure_metrics = self.calculate_pressure_metrics(
            world_gold, vn_gold_data, base_usdvnd, adjusted_usdvnd
        )
        
        # Kết quả
        result = {
            "timestamp": datetime.now().isoformat(),
            "scan_type": scan_type,
            "exchange_rates": {
                "base_usdvnd": base_usdvnd,
                "adjusted_usdvnd": adjusted_usdvnd,
                "pressure_score": pressure_score,
                "pressure_percent": pressure_metrics["usd_pressure"]
            },
            "gold_prices": {
                "world_gold_usd": world_gold,
                "vietnam_gold_sources": len(vn_gold_data.get("data", {}).get("prices", []))
            },
            "market_analysis": pressure_metrics,
            "scan_summary": {
                "total_arbitrage_opportunities": len(pressure_metrics["gold_arbitrage_opportunities"]),
                "high_pressure_sources": len([x for x in pressure_metrics["gold_arbitrage_opportunities"] 
                                            if x["pressure_level"] == "HIGH"]),
                "recommended_actions": len(pressure_metrics["recommended_actions"])
            }
        }
        
        return result

    def print_scan_results(self, result: Dict):
        """In kết quả quét ra màn hình"""
        print("\n" + "=" * 60)
        print("📊 KẾT QUẢ QUÉT ÁP LỰC VÀNG VIỆT NAM")
        print("=" * 60)
        
        # Thông tin tỷ giá
        rates = result["exchange_rates"]
        print(f"💵 Tỷ giá USD/VND hiện tại: {rates['base_usdvnd']:,.2f}")
        print(f"🌙 Áp lực swap USD qua đêm: {rates['pressure_score']}")
        print(f"📈 Tỷ giá sau khi điều chỉnh: {rates['adjusted_usdvnd']:,.2f}")
        print(f"📊 Áp lực tỷ giá: {rates['pressure_percent']:+.4f}%")
        
        # Thông tin vàng
        gold = result["gold_prices"]
        print(f"\n💰 Giá vàng thế giới: ${gold['world_gold_usd']:,.2f}/oz")
        print(f"🇻🇳 Nguồn giá vàng VN: {gold['vietnam_gold_sources']} nguồn")
        
        # Cơ hội arbitrage
        opportunities = result["market_analysis"]["gold_arbitrage_opportunities"]
        if opportunities:
            print(f"\n🎯 CƠ HỘI ARBITRAGE ({len(opportunities)} nguồn):")
            for opp in opportunities:
                color = "🔴" if opp["pressure_level"] == "HIGH" else "🟡" if opp["pressure_level"] == "MEDIUM" else "🟢"
                print(f"   {color} {opp['source']}: {opp['arbitrage_percent']:+.2f}% ({opp['pressure_level']})")
        
        # Khuyến nghị
        actions = result["market_analysis"]["recommended_actions"]
        if actions:
            print(f"\n💡 KHUYẾN NGHỊ HÀNH ĐỘNG:")
            for action in actions:
                print(f"   ➤ {action}")
        
        # Tóm tắt
        summary = result["scan_summary"]
        print(f"\n📋 TÓM TẮT:")
        print(f"   • Tổng cơ hội arbitrage: {summary['total_arbitrage_opportunities']}")
        print(f"   • Nguồn áp lực cao: {summary['high_pressure_sources']}")
        print(f"   • Khuyến nghị hành động: {summary['recommended_actions']}")
        print(f"   • Thời gian quét: {result['timestamp']}")

def main():
    scanner = VietnamGoldPressureScanner()
    
    # Xử lý tham số dòng lệnh
    scan_type = "full"
    if len(sys.argv) > 1:
        scan_type = sys.argv[1]
    
    try:
        # Thực hiện quét
        result = scanner.execute_pressure_scan(scan_type)
        
        # In kết quả
        scanner.print_scan_results(result)
        
        # Lưu kết quả vào file
        output_file = f"vietnam_gold_scan_{int(time.time())}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Kết quả đã lưu vào: {output_file}")
        
    except Exception as e:
        print(f"❌ Lỗi khi thực hiện quét: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()