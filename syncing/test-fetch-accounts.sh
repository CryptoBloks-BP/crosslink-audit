#!/bin/bash

# Test version of fetch-accounts.sh that only processes a few accounts
# Default to mainnet if not specified
NETWORK=${1:-mainnet}
CONTRACT=${2:-x.libre}

# Validate contract parameter
if [ "$CONTRACT" != "x.libre" ] && [ "$CONTRACT" != "v.libre" ]; then
    echo "Error: Contract must be either 'x.libre' or 'v.libre'"
    echo "Usage: $0 [network] [contract]"
    echo "  network: mainnet (default) or testnet"
    echo "  contract: x.libre (default) or v.libre"
    exit 1
fi

# Set API URL based on network
if [ "$NETWORK" = "testnet" ]; then
    API_URL="https://api.testnet.libre.cryptobloks.io"
    BTC_EXPLORER_API="https://mempool.space/signet/api/address"
else
    API_URL="https://api.libre.cryptobloks.io"
    BTC_EXPLORER_API="https://mempool.space/api/address"
fi

echo "Testing fetch accounts from $CONTRACT on $NETWORK..."

# Create temporary file for the JSON payload with limit 5 for testing
cat > /tmp/payload.json << EOF
{
    "code": "$CONTRACT",
    "table": "accounts",
    "scope": "$CONTRACT",
    "limit": 5,
    "json": true
}
EOF

# Initialize output file with CSV header
echo "Account,BTC Address,Balance (BTC)" > test_accounts_with_balances.csv

# Function to fetch BTC balance for an address
get_btc_balance() {
    local address=$1
    if [ -z "$address" ] || [ "$address" = "null" ]; then
        echo "0"
        return
    fi
    
    # Fetch balance from mempool.space API
    local response=$(curl -s "${BTC_EXPLORER_API}/${address}")
    if [ $? -eq 0 ] && [ ! -z "$response" ]; then
        # Check if response is valid JSON and has the expected structure
        if echo "$response" | jq -e '.chain_stats' >/dev/null 2>&1; then
            # Extract funded and spent amounts using jq
            local funded_sum=$(echo "$response" | jq -r '.chain_stats.funded_txo_sum // 0')
            local spent_sum=$(echo "$response" | jq -r '.chain_stats.spent_txo_sum // 0')
            
            # Calculate balance in BTC (convert from satoshis)
            local balance=$(echo "scale=8; ($funded_sum - $spent_sum) / 100000000" | bc -l 2>/dev/null || echo "0")
            echo "$balance"
        else
            # Invalid JSON or unexpected response structure
            echo "0"
        fi
    else
        echo "0"
    fi
}

# Function to fetch accounts
fetch_accounts() {
    local payload_file="/tmp/payload.json"
    
    # Make the API call
    curl -s -X POST "$API_URL/v1/chain/get_table_rows" \
        -H "Content-Type: application/json" \
        -d @"$payload_file"
}

# Function to process account data
process_accounts() {
    local response=$1
    local count=0
    
    # Extract account data using jq
    echo "$response" | jq -r '.rows[] | [.account, .btc_address // "none"] | @csv' | while IFS=',' read -r account btc_address; do
        # Remove quotes from CSV values
        account=$(echo "$account" | tr -d '"')
        btc_address=$(echo "$btc_address" | tr -d '"')
        
        # Skip if no BTC address
        if [ "$btc_address" = "none" ] || [ -z "$btc_address" ]; then
            echo "\"$account\",\"$btc_address\",0.00000000" >> test_accounts_with_balances.csv
            continue
        fi
        
        # Get BTC balance
        echo "Processing account: $account (BTC address: $btc_address)" >&2
        local balance=$(get_btc_balance "$btc_address")
        
        # Add to CSV
        echo "\"$account\",\"$btc_address\",$balance" >> test_accounts_with_balances.csv
        
        # Add small delay to avoid overwhelming the API
        sleep 0.2
        
        count=$((count + 1))
    done
    
    echo "$count"
}

# Fetch and process accounts
response=$(fetch_accounts)
processed_count=$(process_accounts "$response")

# Clean up
rm /tmp/payload.json

echo "Test completed! Processed $processed_count accounts from $CONTRACT on $NETWORK"
echo "Results saved to test_accounts_with_balances.csv"
echo ""
echo "Sample output:"
cat test_accounts_with_balances.csv 