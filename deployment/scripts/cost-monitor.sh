#!/bin/bash
# Radicle Cost Monitoring Script
# Tracks resource usage and estimates monthly costs

set -euo pipefail

# Cost constants (GCP us-central1 pricing)
E2_MICRO_HOURLY=0.00508
HDD_STORAGE_PER_GB=0.04
EGRESS_PER_GB=0.12

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Radicle Node - Resource Usage & Cost Monitor${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

get_uptime() {
    uptime -p
}

get_cpu_usage() {
    top -bn1 | grep "radicle-node" | awk '{print $9"%"}' || echo "0%"
}

get_memory_usage() {
    ps aux | grep radicle-node | grep -v grep | awk '{print $4"%"}' | head -1 || echo "0%"
}

get_disk_usage() {
    df -h /var/lib/radicle 2>/dev/null | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}'
}

get_disk_usage_gb() {
    df -BG /var/lib/radicle 2>/dev/null | tail -1 | awk '{print $3}' | tr -d 'G'
}

get_network_stats() {
    if [ -f /var/lib/radicle/network-stats.txt ]; then
        cat /var/lib/radicle/network-stats.txt
    else
        echo "RX: 0 GB | TX: 0 GB"
    fi
}

calculate_monthly_costs() {
    local hours_up=$(awk '{print int($1/3600)}' /proc/uptime)
    local days=$(date +%d)
    local monthly_hours=$((hours_up * 30 / days))

    # Compute cost (e2-micro)
    local compute_cost=$(echo "$monthly_hours * $E2_MICRO_HOURLY" | bc -l)

    # Storage cost
    local storage_gb=$(get_disk_usage_gb)
    local storage_cost=$(echo "$storage_gb * $HDD_STORAGE_PER_GB" | bc -l)

    # Estimate egress (simplified - would need actual monitoring)
    local egress_gb=10  # Conservative estimate
    local egress_cost=$(echo "$egress_gb * $EGRESS_PER_GB" | bc -l)

    # Total
    local total=$(echo "$compute_cost + $storage_cost + $egress_cost" | bc -l)

    echo "$compute_cost $storage_cost $egress_cost $total"
}

print_resource_usage() {
    echo -e "${GREEN}System Resources:${NC}"
    echo "  Uptime:     $(get_uptime)"
    echo "  CPU:        $(get_cpu_usage)"
    echo "  Memory:     $(get_memory_usage)"
    echo "  Disk:       $(get_disk_usage)"
    echo "  Network:    $(get_network_stats)"
    echo ""
}

print_cost_estimate() {
    read compute storage egress total <<< $(calculate_monthly_costs)

    echo -e "${YELLOW}Estimated Monthly Costs:${NC}"
    printf "  Compute (e2-micro): \$%.2f\n" $compute
    printf "  Storage (HDD):      \$%.2f\n" $storage
    printf "  Egress (estimated): \$%.2f\n" $egress
    printf "  ${YELLOW}Total:              \$%.2f${NC}\n" $total
    echo ""
}

print_optimization_tips() {
    echo -e "${GREEN}Cost Optimization Tips:${NC}"

    # Check if node is running idle
    local cpu=$(get_cpu_usage | tr -d '%')
    if (( $(echo "$cpu < 5" | bc -l) )); then
        echo "  ✓ Node is idle - idle shutdown is working"
    else
        echo "  ⚠ Node is active - monitor for unnecessary uptime"
    fi

    # Check disk usage
    local disk_percent=$(get_disk_usage | grep -oP '\(\K[^%]+')
    if (( disk_percent > 80 )); then
        echo "  ⚠ Disk usage >80% - consider archiving old data"
    else
        echo "  ✓ Disk usage healthy"
    fi

    echo ""
}

print_peer_stats() {
    if command -v rad &> /dev/null; then
        echo -e "${GREEN}Radicle Stats:${NC}"
        echo "  Peers:      $(rad node peers 2>/dev/null | wc -l || echo '0')"
        echo "  Repos:      $(rad node ls 2>/dev/null | wc -l || echo '0')"
        echo ""
    fi
}

save_metrics() {
    local timestamp=$(date +%s)
    local metrics_file="/var/lib/radicle/metrics.log"

    if [ -w "$(dirname "$metrics_file")" ]; then
        read compute storage egress total <<< $(calculate_monthly_costs)
        echo "$timestamp,$(get_cpu_usage),$compute,$storage,$egress,$total" >> "$metrics_file"
    fi
}

# Main
main() {
    print_header
    print_resource_usage
    print_cost_estimate
    print_peer_stats
    print_optimization_tips

    # Save metrics for historical tracking
    save_metrics
}

main "$@"
