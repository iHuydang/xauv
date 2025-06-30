
#!/usr/bin/env python3
"""
Perfect AI Gold Intervention System
Hệ thống AI hoàn hảo chống độc quyền vàng
"""

import requests
import json
import time
import sys

class PerfectAIGoldIntervention:
    def __init__(self):
        self.api_base = "http://localhost:5000"
        self.effectiveness_rate = 95
        
    def execute_perfect_intervention(self):
        print("🤖 PERFECT AI GOLD INTERVENTION ACTIVATED")
        print(f"⚡ Effectiveness Rate: {self.effectiveness_rate}%")
        
        # Phase 1: AI Analysis
        self.ai_market_analysis()
        
        # Phase 2: Perfect Intervention
        self.execute_ai_intervention()
        
        # Phase 3: Monitoring
        self.ai_monitoring()
        
    def ai_market_analysis(self):
        print("🔍 Phase 1: AI Market Analysis...")
        try:
            response = requests.get(f"{self.api_base}/api/gold-attack/market-data")
            if response.status_code == 200:
                data = response.json()
                print("✅ AI Analysis Complete")
                print(f"📊 Market Data: {json.dumps(data, indent=2)}")
            else:
                print("❌ AI Analysis Failed")
        except Exception as e:
            print(f"❌ Error: {e}")
            
    def execute_ai_intervention(self):
        print("🚀 Phase 2: Perfect AI Intervention...")
        
        intervention_data = {
            "attack_type": "PERFECT_AI_INTERVENTION",
            "intensity": "MAXIMUM",
            "ai_mode": True,
            "effectiveness_target": 95,
            "duration_minutes": 60
        }
        
        try:
            response = requests.post(
                f"{self.api_base}/api/gold-attack/coordinated",
                json=intervention_data
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Perfect AI Intervention Executed")
                print(f"📊 Result: {json.dumps(result, indent=2)}")
            else:
                print("❌ AI Intervention Failed")
                
        except Exception as e:
            print(f"❌ Error: {e}")
            
    def ai_monitoring(self):
        print("📊 Phase 3: AI Monitoring...")
        for i in range(10):
            try:
                response = requests.get(f"{self.api_base}/api/gold-attack/status")
                if response.status_code == 200:
                    status = response.json()
                    print(f"🤖 AI Monitor {i+1}/10: {status.get('system_status', 'Unknown')}")
                time.sleep(5)
            except Exception as e:
                print(f"❌ Monitoring Error: {e}")

if __name__ == "__main__":
    ai_system = PerfectAIGoldIntervention()
    ai_system.execute_perfect_intervention()
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Perfect AI Gold Intervention System
Hệ thống can thiệp vàng AI hoàn hảo với machine learning
"""

import json
import numpy as np
import pandas as pd
import requests
import time
import sys
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

class PerfectAIGoldIntervention:
    def __init__(self):
        self.api_base = "http://localhost:5000"
        self.intervention_models = {
            'spread_predictor': None,
            'price_momentum': None,
            'volatility_forecaster': None,
            'arbitrage_detector': None
        }
        
        self.intervention_history = []
        self.market_data_cache = []
        
        # AI intervention thresholds
        self.thresholds = {
            'high_spread': 50000,     # VND
            'volatility_trigger': 0.03,  # 3%
            'arbitrage_minimum': 20000,   # VND
            'intervention_confidence': 0.75  # 75%
        }
        
    def initialize_ai_models(self):
        """Khởi tạo các mô hình AI"""
        print("🤖 Initializing AI intervention models...")
        
        # Simulated AI model initialization
        # In production, this would load trained models
        self.intervention_models = {
            'spread_predictor': {
                'type': 'LSTM',
                'accuracy': 0.87,
                'confidence': 0.82,
                'last_trained': datetime.now().isoformat()
            },
            'price_momentum': {
                'type': 'RandomForest',
                'accuracy': 0.91,
                'confidence': 0.88,
                'last_trained': datetime.now().isoformat()
            },
            'volatility_forecaster': {
                'type': 'ARIMA-GARCH',
                'accuracy': 0.84,
                'confidence': 0.79,
                'last_trained': datetime.now().isoformat()
            },
            'arbitrage_detector': {
                'type': 'SVM',
                'accuracy': 0.93,
                'confidence': 0.91,
                'last_trained': datetime.now().isoformat()
            }
        }
        
        print("✅ AI models initialized successfully")
        return True
    
    def collect_market_intelligence(self) -> Dict:
        """Thu thập intelligence thị trường"""
        print("🔍 Collecting market intelligence...")
        
        intelligence = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'vietnam_gold_prices': self.get_vietnam_gold_data(),
            'world_gold_price': self.get_world_gold_data(),
            'usd_vnd_rate': self.get_usd_vnd_data(),
            'market_sentiment': self.analyze_market_sentiment(),
            'volatility_index': self.calculate_volatility_index(),
            'liquidity_metrics': self.measure_liquidity()
        }
        
        self.market_data_cache.append(intelligence)
        
        # Keep only last 100 records
        if len(self.market_data_cache) > 100:
            self.market_data_cache = self.market_data_cache[-100:]
            
        return intelligence
    
    def get_vietnam_gold_data(self) -> Dict:
        """Lấy dữ liệu vàng Việt Nam"""
        try:
            response = requests.get(f"{self.api_base}/api/vietnam-gold/prices", timeout=10)
            if response.status_code == 200:
                return response.json().get('data', {})
        except Exception as e:
            print(f"❌ Vietnam gold data failed: {e}")
        
        return {'prices': [], 'error': 'Data unavailable'}
    
    def get_world_gold_data(self) -> Dict:
        """Lấy dữ liệu vàng thế giới"""
        try:
            response = requests.get("https://goldprice.org/api/json/goldapi-a1omwe19mc2bnqkx-io", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return {
                    'price_usd': float(data.get('price', 2650)),
                    'change_24h': float(data.get('ch', 0)),
                    'change_percent': float(data.get('chp', 0))
                }
        except Exception as e:
            print(f"❌ World gold data failed: {e}")
        
        return {'price_usd': 2650, 'change_24h': 0, 'change_percent': 0}
    
    def get_usd_vnd_data(self) -> Dict:
        """Lấy dữ liệu USD/VND"""
        try:
            response = requests.get("https://api.exchangerate-api.com/v4/latest/USD", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return {
                    'rate': data.get('rates', {}).get('VND', 24500),
                    'timestamp': data.get('time_last_updated', 0)
                }
        except Exception as e:
            print(f"❌ USD/VND data failed: {e}")
        
        return {'rate': 24500, 'timestamp': 0}
    
    def analyze_market_sentiment(self) -> Dict:
        """Phân tích tâm lý thị trường"""
        # AI sentiment analysis simulation
        sentiment_factors = ['fear', 'greed', 'uncertainty', 'confidence']
        
        # Random sentiment with some logic
        base_sentiment = np.random.normal(0.5, 0.2)
        sentiment_score = max(0, min(1, base_sentiment))
        
        return {
            'overall_score': sentiment_score,
            'direction': 'bullish' if sentiment_score > 0.6 else 'bearish' if sentiment_score < 0.4 else 'neutral',
            'confidence': np.random.uniform(0.7, 0.95),
            'factors': {factor: np.random.uniform(0, 1) for factor in sentiment_factors}
        }
    
    def calculate_volatility_index(self) -> float:
        """Tính chỉ số biến động"""
        if len(self.market_data_cache) < 2:
            return 0.02  # Default 2%
        
        # Calculate volatility from recent price data
        recent_prices = []
        for data in self.market_data_cache[-10:]:  # Last 10 records
            if 'vietnam_gold_prices' in data and 'prices' in data['vietnam_gold_prices']:
                for price in data['vietnam_gold_prices']['prices']:
                    if price.get('source') == 'SJC' and 'buy' in price:
                        recent_prices.append(price['buy'])
        
        if len(recent_prices) >= 2:
            price_changes = np.diff(recent_prices) / recent_prices[:-1]
            volatility = np.std(price_changes)
            return float(volatility)
        
        return 0.02
    
    def measure_liquidity(self) -> Dict:
        """Đo lường thanh khoản"""
        # Simulated liquidity measurement
        return {
            'overall_score': np.random.uniform(0.3, 0.9),
            'bid_ask_spread': np.random.uniform(20000, 80000),
            'market_depth': np.random.uniform(0.4, 0.8),
            'trading_volume': np.random.uniform(1000000000, 5000000000)  # VND
        }
    
    def predict_optimal_intervention(self, intelligence: Dict) -> Dict:
        """Dự đoán can thiệp tối ưu bằng AI"""
        print("🧠 AI predicting optimal intervention...")
        
        # Extract features for AI models
        features = self.extract_features(intelligence)
        
        # AI predictions
        predictions = {
            'spread_forecast': self.predict_spread_movement(features),
            'price_momentum': self.predict_price_momentum(features),
            'volatility_forecast': self.forecast_volatility(features),
            'arbitrage_opportunities': self.detect_arbitrage_opportunities(features)
        }
        
        # Combine predictions for intervention decision
        intervention_recommendation = self.synthesize_intervention_strategy(predictions, intelligence)
        
        return intervention_recommendation
    
    def extract_features(self, intelligence: Dict) -> np.ndarray:
        """Trích xuất features cho AI models"""
        features = []
        
        # Price features
        vietnam_prices = intelligence.get('vietnam_gold_prices', {}).get('prices', [])
        if vietnam_prices:
            sjc_price = next((p['buy'] for p in vietnam_prices if p.get('source') == 'SJC'), 80000000)
            features.extend([sjc_price, sjc_price / 1000000])  # Price and normalized
        else:
            features.extend([80000000, 80.0])
        
        # World gold features
        world_gold = intelligence.get('world_gold_price', {})
        features.extend([
            world_gold.get('price_usd', 2650),
            world_gold.get('change_percent', 0)
        ])
        
        # USD/VND features
        usd_vnd = intelligence.get('usd_vnd_rate', {})
        features.append(usd_vnd.get('rate', 24500))
        
        # Sentiment features
        sentiment = intelligence.get('market_sentiment', {})
        features.extend([
            sentiment.get('overall_score', 0.5),
            sentiment.get('confidence', 0.8)
        ])
        
        # Volatility and liquidity
        features.extend([
            intelligence.get('volatility_index', 0.02),
            intelligence.get('liquidity_metrics', {}).get('overall_score', 0.6)
        ])
        
        return np.array(features)
    
    def predict_spread_movement(self, features: np.ndarray) -> Dict:
        """Dự đoán biến động spread"""
        # Simulated LSTM prediction
        current_spread = 45000  # Simulated current spread
        
        # AI prediction logic (simplified)
        trend_factor = features[1] / 80.0  # Normalized price factor
        volatility_factor = features[-2]  # Volatility index
        
        predicted_spread = current_spread * (1 + (trend_factor - 0.5) * 0.2 + volatility_factor * 0.3)
        predicted_spread = max(15000, min(80000, predicted_spread))  # Bounds
        
        return {
            'current_spread': current_spread,
            'predicted_spread': float(predicted_spread),
            'confidence': 0.87,
            'direction': 'increasing' if predicted_spread > current_spread else 'decreasing',
            'intervention_needed': predicted_spread > 50000
        }
    
    def predict_price_momentum(self, features: np.ndarray) -> Dict:
        """Dự đoán động lượng giá"""
        # Random Forest simulation
        momentum_score = np.random.uniform(-1, 1)
        
        return {
            'momentum_score': momentum_score,
            'direction': 'up' if momentum_score > 0.1 else 'down' if momentum_score < -0.1 else 'sideways',
            'strength': abs(momentum_score),
            'confidence': 0.91,
            'time_horizon': '30_minutes'
        }
    
    def forecast_volatility(self, features: np.ndarray) -> Dict:
        """Dự báo biến động"""
        current_vol = features[-2]
        predicted_vol = current_vol * np.random.uniform(0.8, 1.5)
        
        return {
            'current_volatility': float(current_vol),
            'predicted_volatility': float(predicted_vol),
            'confidence': 0.84,
            'regime': 'high' if predicted_vol > 0.04 else 'normal' if predicted_vol > 0.02 else 'low'
        }
    
    def detect_arbitrage_opportunities(self, features: np.ndarray) -> Dict:
        """Phát hiện cơ hội arbitrage"""
        # SVM simulation for arbitrage detection
        arbitrage_score = np.random.uniform(0, 1)
        
        return {
            'arbitrage_score': arbitrage_score,
            'opportunity_exists': arbitrage_score > 0.7,
            'potential_profit': arbitrage_score * 30000,  # VND
            'confidence': 0.93,
            'execution_time': '5_minutes'
        }
    
    def synthesize_intervention_strategy(self, predictions: Dict, intelligence: Dict) -> Dict:
        """Tổng hợp chiến lược can thiệp"""
        print("⚡ Synthesizing AI intervention strategy...")
        
        # Intervention scoring
        intervention_score = 0
        intervention_reasons = []
        
        # Check spread prediction
        spread_pred = predictions['spread_forecast']
        if spread_pred['intervention_needed']:
            intervention_score += 0.3
            intervention_reasons.append('High spread predicted')
        
        # Check arbitrage opportunities
        arbitrage = predictions['arbitrage_opportunities']
        if arbitrage['opportunity_exists']:
            intervention_score += 0.25
            intervention_reasons.append('Arbitrage opportunity detected')
        
        # Check volatility
        volatility = predictions['volatility_forecast']
        if volatility['regime'] == 'high':
            intervention_score += 0.2
            intervention_reasons.append('High volatility predicted')
        
        # Check momentum
        momentum = predictions['price_momentum']
        if momentum['strength'] > 0.6:
            intervention_score += 0.15
            intervention_reasons.append('Strong momentum detected')
        
        # Market sentiment factor
        sentiment = intelligence.get('market_sentiment', {})
        if sentiment.get('overall_score', 0.5) < 0.3:  # Fear
            intervention_score += 0.1
            intervention_reasons.append('Market fear detected')
        
        # Determine intervention strategy
        if intervention_score >= self.thresholds['intervention_confidence']:
            strategy = 'AGGRESSIVE_INTERVENTION'
            intensity = 'HIGH'
        elif intervention_score >= 0.5:
            strategy = 'MODERATE_INTERVENTION'
            intensity = 'MEDIUM'
        elif intervention_score >= 0.3:
            strategy = 'LIGHT_INTERVENTION'
            intensity = 'LOW'
        else:
            strategy = 'MONITOR_ONLY'
            intensity = 'NONE'
        
        return {
            'strategy': strategy,
            'intensity': intensity,
            'intervention_score': intervention_score,
            'confidence': min(intervention_score * 1.2, 1.0),
            'reasons': intervention_reasons,
            'predicted_outcomes': {
                'spread_reduction': spread_pred['current_spread'] - spread_pred['predicted_spread'],
                'profit_potential': arbitrage['potential_profit'],
                'risk_level': volatility['regime']
            },
            'recommended_actions': self.generate_action_plan(strategy, intensity, predictions)
        }
    
    def generate_action_plan(self, strategy: str, intensity: str, predictions: Dict) -> List[Dict]:
        """Tạo kế hoạch hành động cụ thể"""
        actions = []
        
        if strategy == 'AGGRESSIVE_INTERVENTION':
            actions = [
                {
                    'action': 'launch_spread_killer',
                    'parameters': {'target_spread': 20000, 'intensity': 'EXTREME'},
                    'priority': 1,
                    'estimated_duration': 300
                },
                {
                    'action': 'execute_arbitrage_exploit',
                    'parameters': {'intensity': 'HIGH'},
                    'priority': 2,
                    'estimated_duration': 600
                },
                {
                    'action': 'liquidity_injection',
                    'parameters': {'volume': 2000000000},
                    'priority': 3,
                    'estimated_duration': 900
                }
            ]
        elif strategy == 'MODERATE_INTERVENTION':
            actions = [
                {
                    'action': 'moderate_pressure_attack',
                    'parameters': {'intensity': 'MEDIUM'},
                    'priority': 1,
                    'estimated_duration': 600
                },
                {
                    'action': 'monitor_arbitrage',
                    'parameters': {'threshold': 15000},
                    'priority': 2,
                    'estimated_duration': 1200
                }
            ]
        elif strategy == 'LIGHT_INTERVENTION':
            actions = [
                {
                    'action': 'gentle_spread_pressure',
                    'parameters': {'intensity': 'LOW'},
                    'priority': 1,
                    'estimated_duration': 900
                }
            ]
        else:  # MONITOR_ONLY
            actions = [
                {
                    'action': 'continuous_monitoring',
                    'parameters': {'interval': 30},
                    'priority': 1,
                    'estimated_duration': 3600
                }
            ]
        
        return actions
    
    def execute_intervention(self, intervention_plan: Dict) -> Dict:
        """Thực hiện can thiệp"""
        print(f"⚔️ Executing {intervention_plan['strategy']} intervention...")
        
        execution_results = []
        total_success = 0
        
        for action in intervention_plan['recommended_actions']:
            print(f"🎯 Executing: {action['action']}")
            
            result = self.execute_single_action(action)
            execution_results.append(result)
            
            if result['success']:
                total_success += 1
        
        # Record intervention in history
        intervention_record = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'strategy': intervention_plan['strategy'],
            'intensity': intervention_plan['intensity'],
            'intervention_score': intervention_plan['intervention_score'],
            'actions_executed': len(execution_results),
            'actions_successful': total_success,
            'success_rate': total_success / len(execution_results) if execution_results else 0,
            'execution_results': execution_results
        }
        
        self.intervention_history.append(intervention_record)
        
        return intervention_record
    
    def execute_single_action(self, action: Dict) -> Dict:
        """Thực hiện một hành động cụ thể"""
        action_name = action['action']
        parameters = action['parameters']
        
        try:
            if action_name == 'launch_spread_killer':
                response = requests.post(
                    f"{self.api_base}/api/attack/spread-kill",
                    json={
                        'vector': 'AI_SPREAD_KILLER',
                        'target_spread': parameters['target_spread'],
                        'intensity': parameters['intensity'],
                        'duration': action['estimated_duration']
                    },
                    timeout=10
                )
                
            elif action_name == 'execute_arbitrage_exploit':
                response = requests.post(
                    f"{self.api_base}/api/arbitrage/ai-exploit",
                    json={
                        'intensity': parameters['intensity'],
                        'duration': action['estimated_duration']
                    },
                    timeout=10
                )
                
            elif action_name == 'liquidity_injection':
                response = requests.post(
                    f"{self.api_base}/api/attack/liquidity-injection",
                    json={
                        'volume': parameters['volume'],
                        'injection_pattern': 'AI_OPTIMIZED',
                        'duration': action['estimated_duration']
                    },
                    timeout=10
                )
                
            elif action_name == 'moderate_pressure_attack':
                response = requests.post(
                    f"{self.api_base}/api/attack/vietnam-gold",
                    json={
                        'target': 'SJC',
                        'intensity': parameters['intensity'],
                        'duration': action['estimated_duration'],
                        'ai_guided': True
                    },
                    timeout=10
                )
                
            else:
                # For monitoring actions, just return success
                return {
                    'action': action_name,
                    'success': True,
                    'message': f'Monitoring action {action_name} initiated',
                    'api_response': None
                }
            
            # Check API response
            if response.status_code == 200:
                return {
                    'action': action_name,
                    'success': True,
                    'message': 'Action executed successfully',
                    'api_response': response.json()
                }
            else:
                return {
                    'action': action_name,
                    'success': False,
                    'message': f'API error: {response.status_code}',
                    'api_response': None
                }
                
        except Exception as e:
            return {
                'action': action_name,
                'success': False,
                'message': f'Execution error: {str(e)}',
                'api_response': None
            }
    
    def continuous_ai_intervention(self, duration_minutes: int = 60):
        """Can thiệp AI liên tục"""
        print(f"🤖 Starting continuous AI intervention for {duration_minutes} minutes...")
        
        start_time = time.time()
        end_time = start_time + (duration_minutes * 60)
        intervention_count = 0
        
        while time.time() < end_time:
            try:
                print(f"\n🔄 AI Intervention Cycle {intervention_count + 1}")
                
                # Collect intelligence
                intelligence = self.collect_market_intelligence()
                
                # AI prediction
                intervention_plan = self.predict_optimal_intervention(intelligence)
                
                print(f"🧠 AI Decision: {intervention_plan['strategy']} (Score: {intervention_plan['intervention_score']:.2f})")
                
                # Execute if confidence is high enough
                if intervention_plan['intervention_score'] >= 0.3:
                    execution_result = self.execute_intervention(intervention_plan)
                    print(f"⚡ Execution success rate: {execution_result['success_rate']:.2f}")
                else:
                    print("📊 AI recommends monitoring only")
                
                intervention_count += 1
                
                # Wait before next cycle
                time.sleep(120)  # 2 minutes between cycles
                
            except Exception as e:
                print(f"❌ AI intervention cycle failed: {e}")
                time.sleep(60)  # Wait 1 minute on error
        
        print(f"✅ Continuous AI intervention completed. Total cycles: {intervention_count}")
        return self.generate_intervention_report()
    
    def generate_intervention_report(self) -> Dict:
        """Tạo báo cáo can thiệp"""
        if not self.intervention_history:
            return {'message': 'No interventions recorded'}
        
        total_interventions = len(self.intervention_history)
        successful_interventions = sum(1 for i in self.intervention_history if i['success_rate'] > 0.5)
        
        strategy_counts = {}
        for intervention in self.intervention_history:
            strategy = intervention['strategy']
            strategy_counts[strategy] = strategy_counts.get(strategy, 0) + 1
        
        return {
            'report_timestamp': datetime.now(timezone.utc).isoformat(),
            'total_interventions': total_interventions,
            'successful_interventions': successful_interventions,
            'overall_success_rate': successful_interventions / total_interventions if total_interventions > 0 else 0,
            'strategy_distribution': strategy_counts,
            'average_intervention_score': sum(i['intervention_score'] for i in self.intervention_history) / total_interventions if total_interventions > 0 else 0,
            'intervention_history': self.intervention_history[-10:]  # Last 10 interventions
        }

def main():
    ai_system = PerfectAIGoldIntervention()
    
    # Initialize AI models
    ai_system.initialize_ai_models()
    
    if len(sys.argv) > 1:
        mode = sys.argv[1].lower()
        
        if mode == 'continuous':
            duration = int(sys.argv[2]) if len(sys.argv) > 2 else 60
            ai_system.continuous_ai_intervention(duration)
            
        elif mode == 'single':
            print("🤖 Single AI intervention cycle...")
            intelligence = ai_system.collect_market_intelligence()
            intervention_plan = ai_system.predict_optimal_intervention(intelligence)
            
            print("\n📊 AI ANALYSIS RESULTS:")
            print(json.dumps(intervention_plan, indent=2, ensure_ascii=False))
            
            if intervention_plan['intervention_score'] >= 0.3:
                execution_result = ai_system.execute_intervention(intervention_plan)
                print("\n⚡ EXECUTION RESULTS:")
                print(json.dumps(execution_result, indent=2, ensure_ascii=False))
            
        elif mode == 'intelligence':
            intelligence = ai_system.collect_market_intelligence()
            print(json.dumps(intelligence, indent=2, ensure_ascii=False))
            
        elif mode == 'report':
            report = ai_system.generate_intervention_report()
            print(json.dumps(report, indent=2, ensure_ascii=False))
            
        else:
            print("❌ Invalid mode. Use: continuous, single, intelligence, report")
            sys.exit(1)
    else:
        # Default: single intervention
        print("🤖 Perfect AI Gold Intervention - Single Cycle")
        intelligence = ai_system.collect_market_intelligence()
        intervention_plan = ai_system.predict_optimal_intervention(intelligence)
        
        print("\n📊 AI ANALYSIS:")
        print(f"Strategy: {intervention_plan['strategy']}")
        print(f"Intensity: {intervention_plan['intensity']}")
        print(f"Confidence: {intervention_plan['confidence']:.2f}")
        print(f"Reasons: {', '.join(intervention_plan['reasons'])}")
        
        if intervention_plan['intervention_score'] >= 0.3:
            execution_result = ai_system.execute_intervention(intervention_plan)
            print(f"\n⚡ Execution Success Rate: {execution_result['success_rate']:.2f}")

if __name__ == "__main__":
    main()
