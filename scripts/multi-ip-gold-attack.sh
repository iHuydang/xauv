
#!/bin/bash

# Multi-IP Gold Attack System
# Coordinated attack using multiple IP addresses

set -e

# Configuration
API_BASE="http://localhost:5000"
TARGET_IPS=("171.159.228.150" "172.64.154.7" "104.18.33.249" "202.219.44.68")
ATTACK_PORTS=(8080 8443 9000 9443 3000 5000)
LOG_FILE="multi_ip_gold_attack.log"
ATTACK_ID=$(date +%s)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_attack() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

show_banner() {
    echo -e "${RED}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║          MULTI-IP GOLD ATTACK SYSTEM v3.0             ║"
    echo "║        🚨 COORDINATED IP ASSAULT NETWORK 🚨           ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${YELLOW}Target IPs: ${TARGET_IPS[*]}${NC}"
    echo -e "${BLUE}Attack Ports: ${ATTACK_PORTS[*]}${NC}"
}

# Execute attack from specific IP and port
execute_ip_attack() {
    local source_ip="$1"
    local target_port="$2"
    local attack_type="$3"
    local intensity="$4"
    
    echo -e "${RED}🚨 ATTACKING FROM IP: $source_ip:$target_port${NC}"
    log_attack "🚨 Launching attack from $source_ip:$target_port"
    
    local attack_payload='{
        "sourceIP": "'$source_ip'",
        "targetPort": '$target_port',
        "attackType": "'$attack_type'",
        "intensity": "'$intensity'",
        "duration": 600,
        "volume_multiplier": 5.0,
        "spread_threshold": 15000
    }'
    
    # Execute SJC pressure attack
    echo -e "${PURPLE}⚔️ SJC Pressure Attack from $source_ip${NC}"
    curl -s -X POST "$API_BASE/api/attack/sjc-pressure" \
        -H "Content-Type: application/json" \
        -d "$attack_payload" &
    
    # Execute Vietnam gold attack
    echo -e "${PURPLE}💥 Vietnam Gold Attack from $source_ip${NC}"
    curl -s -X POST "$API_BASE/api/attack/vietnam-gold" \
        -H "Content-Type: application/json" \
        -d '{
            "target": "ALL",
            "sourceIP": "'$source_ip'",
            "port": '$target_port',
            "intensity": "'$intensity'",
            "duration": 450,
            "spread_threshold": 20000,
            "volume_multiplier": 4.5
        }' &
    
    # Execute world gold attack
    echo -e "${PURPLE}🌍 World Gold Attack from $source_ip${NC}"
    curl -s -X POST "$API_BASE/api/world-gold/attack" \
        -H "Content-Type: application/json" \
        -d '{
            "vector": "COORDINATED_MULTI_IP",
            "sourceIP": "'$source_ip'",
            "port": '$target_port',
            "intensity": "'$intensity'"
        }' &
}

# Coordinated multi-IP assault
coordinated_multi_ip_attack() {
    echo -e "${RED}🎯 INITIATING COORDINATED MULTI-IP ASSAULT${NC}"
    log_attack "🎯 Starting coordinated multi-IP attack"
    
    local attack_count=0
    
    # Phase 1: Simultaneous attacks from all IPs
    for ip in "${TARGET_IPS[@]}"; do
        for port in "${ATTACK_PORTS[@]}"; do
            local intensity_options=("HIGH" "EXTREME" "MAXIMUM")
            local intensity=${intensity_options[$((attack_count % 3))]}
            
            echo -e "${YELLOW}🚀 Launching attack $((attack_count + 1)) from $ip:$port${NC}"
            execute_ip_attack "$ip" "$port" "COORDINATED" "$intensity"
            
            attack_count=$((attack_count + 1))
            sleep 2  # Brief delay between launches
        done
    done
    
    echo -e "${GREEN}✅ Launched $attack_count coordinated attacks${NC}"
    log_attack "✅ Launched $attack_count coordinated attacks"
    
    # Wait for initial wave to complete
    echo -e "${BLUE}⏱️ Waiting for initial attack wave...${NC}"
    sleep 30
    
    # Phase 2: Sustained pressure
    echo -e "${RED}🔥 Phase 2: Sustained Multi-IP Pressure${NC}"
    sustained_pressure_attack
}

# Sustained pressure with IP rotation
sustained_pressure_attack() {
    local cycles=10
    
    for ((i=1; i<=cycles; i++)); do
        echo -e "${RED}🔄 Pressure Cycle $i/$cycles${NC}"
        
        # Rotate through IPs for unpredictability
        local ip_index=$((i % ${#TARGET_IPS[@]}))
        local port_index=$((i % ${#ATTACK_PORTS[@]}))
        local current_ip="${TARGET_IPS[$ip_index]}"
        local current_port="${ATTACK_PORTS[$port_index]}"
        
        echo -e "${PURPLE}⚡ Cycle attack from $current_ip:$current_port${NC}"
        
        # Quick burst attack
        curl -s -X POST "$API_BASE/api/attack/quick-burst" \
            -H "Content-Type: application/json" \
            -d '{
                "sourceIP": "'$current_ip'",
                "port": '$current_port',
                "intensity": "EXTREME",
                "duration": 120,
                "burst_mode": true
            }' &
        
        # Random delay between cycles
        local delay=$((10 + $RANDOM % 20))
        echo -e "${BLUE}⏱️ Cooldown: $delay seconds${NC}"
        sleep "$delay"
    done
}

# Stealth multi-IP attack
stealth_multi_ip_attack() {
    echo -e "${BLUE}👤 INITIATING STEALTH MULTI-IP ATTACK${NC}"
    log_attack "👤 Starting stealth multi-IP attack"
    
    for ((i=1; i<=20; i++)); do
        # Random IP and port selection
        local random_ip_index=$((RANDOM % ${#TARGET_IPS[@]}))
        local random_port_index=$((RANDOM % ${#ATTACK_PORTS[@]}))
        local stealth_ip="${TARGET_IPS[$random_ip_index]}"
        local stealth_port="${ATTACK_PORTS[$random_port_index]}"
        
        echo -e "${BLUE}👤 Stealth Strike $i/20 from $stealth_ip:$stealth_port${NC}"
        
        # Low-profile attack
        curl -s -X POST "$API_BASE/api/attack/stealth" \
            -H "Content-Type: application/json" \
            -d '{
                "sourceIP": "'$stealth_ip'",
                "port": '$stealth_port',
                "intensity": "LOW",
                "duration": 90,
                "stealth_mode": true,
                "detection_avoidance": true
            }' > /dev/null 2>&1 &
        
        # Random stealth interval
        local stealth_delay=$((60 + RANDOM % 180))
        echo -e "${BLUE}👤 Next strike in: $stealth_delay seconds${NC}"
        sleep "$stealth_delay"
    done
}

# Maximum devastation mode
devastation_mode() {
    echo -e "${RED}💀 INITIATING MAXIMUM DEVASTATION MODE${NC}"
    log_attack "💀 Starting devastation mode with all IPs"
    
    echo -e "${RED}⚠️  WARNING: MAXIMUM DEVASTATION WITH ALL IP ADDRESSES${NC}"
    echo -e "${RED}⚠️  THIS WILL CAUSE SEVERE MARKET DISRUPTION${NC}"
    
    # Phase 1: Overload with all IPs simultaneously
    echo -e "${RED}💀 Phase 1: Multi-IP System Overload${NC}"
    for ip in "${TARGET_IPS[@]}"; do
        for port in "${ATTACK_PORTS[@]}"; do
            curl -s -X POST "$API_BASE/api/attack/devastation" \
                -H "Content-Type: application/json" \
                -d '{
                    "sourceIP": "'$ip'",
                    "port": '$port',
                    "mode": "OVERLOAD",
                    "intensity": "MAXIMUM",
                    "duration": 300,
                    "volume_multiplier": 10.0
                }' &
        done
    done
    
    sleep 10
    
    # Phase 2: Coordinated liquidity drain
    echo -e "${RED}💀 Phase 2: Multi-IP Liquidity Drainage${NC}"
    for ip in "${TARGET_IPS[@]}"; do
        curl -s -X POST "$API_BASE/api/attack/liquidity-drain" \
            -H "Content-Type: application/json" \
            -d '{
                "sourceIP": "'$ip'",
                "mode": "DRAIN_ALL",
                "intensity": "EXTREME",
                "targets": ["SJC", "PNJ", "DOJI", "MIHONG"],
                "duration": 600
            }' &
    done
    
    sleep 15
    
    # Phase 3: Final devastation wave
    echo -e "${RED}💀 Phase 3: Final Devastation Wave${NC}"
    coordinated_multi_ip_attack
}

# Port scan and attack optimization
optimize_ports() {
    echo -e "${YELLOW}🔍 Optimizing attack ports...${NC}"
    
    for ip in "${TARGET_IPS[@]}"; do
        echo -e "${BLUE}📊 Testing ports for $ip${NC}"
        
        for port in "${ATTACK_PORTS[@]}"; do
            # Test port responsiveness
            if timeout 3 bash -c "echo >/dev/tcp/$ip/$port" 2>/dev/null; then
                echo -e "${GREEN}✅ Port $port on $ip is responsive${NC}"
                
                # Execute optimized attack on responsive port
                curl -s -X POST "$API_BASE/api/attack/optimized" \
                    -H "Content-Type: application/json" \
                    -d '{
                        "sourceIP": "'$ip'",
                        "port": '$port',
                        "intensity": "HIGH",
                        "optimized": true
                    }' > /dev/null 2>&1 &
            else
                echo -e "${YELLOW}⚠️ Port $port on $ip not responsive${NC}"
            fi
        done
    done
}

# Help function
show_help() {
    echo "Usage: $0 [MODE]"
    echo ""
    echo "Available multi-IP attack modes:"
    echo "  coordinated  - Tấn công phối hợp từ tất cả IP"
    echo "  sustained    - Tấn công áp lực liên tục với IP luân phiên"
    echo "  stealth      - Tấn công tàng hình với IP ngẫu nhiên"
    echo "  devastation  - Chế độ tàn phá tối đa với tất cả IP"
    echo "  optimize     - Tối ưu hóa port và thực hiện tấn công"
    echo "  help         - Show this help"
    echo ""
    echo "Target IPs: ${TARGET_IPS[*]}"
    echo "Attack Ports: ${ATTACK_PORTS[*]}"
}

# Main execution
main() {
    show_banner
    
    case "${1:-}" in
        "coordinated")
            coordinated_multi_ip_attack
            ;;
        "sustained")
            sustained_pressure_attack
            ;;
        "stealth")
            stealth_multi_ip_attack
            ;;
        "devastation")
            devastation_mode
            ;;
        "optimize")
            optimize_ports
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        "")
            echo -e "${YELLOW}No mode specified. Use 'help' for available options.${NC}"
            show_help
            ;;
        *)
            echo -e "${RED}Invalid mode: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Check if server is running
if ! curl -s "$API_BASE/api/positions" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server not running on $API_BASE${NC}"
    echo -e "${YELLOW}Please start the Market Trading System first${NC}"
    exit 1
fi

# Execute main function
main "$@"
