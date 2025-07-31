#!/bin/bash

# Debug version of fetch-accounts.sh with additional logging
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

echo "DEBUG: Starting fetch accounts from $CONTRACT on $NETWORK..."

# Create temporary file for the JSON payload
cat > /tmp/payload.json << EOF
{
    "code": "$CONTRACT",
    "table": "accounts",
    "scope": "$CONTRACT",
    "limit": 1000,
    "json": true
}
EOF

# Initialize output file with CSV header
OUTPUT_FILE="${CONTRACT}_${NETWORK}_accounts_with_balances_debug.csv"
echo "Account,BTC Address,Balance (BTC)" > "$OUTPUT_FILE"

# Initialize counter for progress tracking
total_processed=0

# Function to fetch BTC balance for an address
get_btc_balance() {
    local address=$1
    if [ -z "$address" ] || [ "$address" = "null" ]; then
        echo "0"
        return
    fi
    
    echo "DEBUG: Fetching BTC balance for $address" >&2
    
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
            echo "DEBUG: Balance for $address = $balance" >&2
            echo "$balance"
        else
            # Invalid JSON or unexpected response structure
            echo "DEBUG: Invalid JSON response for $address" >&2
            echo "0"
        fi
    else
        echo "DEBUG: Failed to fetch balance for $address" >&2
        echo "0"
    fi
}

# Function to fetch accounts
fetch_accounts() {
    local lower_bound=$1
    local payload_file="/tmp/payload.json"
    
    echo "DEBUG: Fetching accounts with lower_bound: $lower_bound" >&2
    
    # Update lower_bound if provided
    if [ ! -z "$lower_bound" ]; then
        jq --arg lb "$lower_bound" '.lower_bound = $lb' "$payload_file" > /tmp/temp.json
        mv /tmp/temp.json "$payload_file"
    fi
    
    # Make the API call
    local response=$(curl -s -X POST "$API_URL/v1/chain/get_table_rows" \
        -H "Content-Type: application/json" \
        -d @"$payload_file")
    
    echo "DEBUG: API response received, rows count: $(echo "$response" | jq -r '.rows | length')" >&2
    echo "$response"
}

# Function to process account data
process_accounts() {
    local response=$1
    local count=0
    
    echo "DEBUG: Processing accounts from response" >&2
    
    # Extract account data using jq
    echo "$response" | jq -r '.rows[] | [.account, .btc_address // "none"] | @csv' | while IFS=',' read -r account btc_address; do
        # Remove quotes from CSV values
        account=$(echo "$account" | tr -d '"')
        btc_address=$(echo "$btc_address" | tr -d '"')
        
        echo "DEBUG: Processing account: $account" >&2
        
        # Skip if no BTC address
        if [ "$btc_address" = "none" ] || [ -z "$btc_address" ]; then
            echo "\"$account\",\"$btc_address\",0.00000000" >> "$OUTPUT_FILE"
            continue
        fi
        
        # Get BTC balance
        echo "Processing account: $account (BTC address: $btc_address)" >&2
        local balance=$(get_btc_balance "$btc_address")
        
        # Add to CSV
        echo "\"$account\",\"$btc_address\",$balance" >> "$OUTPUT_FILE"
        
        # Add small delay to avoid overwhelming the API
        sleep 0.2
        
        count=$((count + 1))
    done
    
    echo "DEBUG: Processed $count accounts" >&2
    echo "$count"
}

# Initial fetch
echo "DEBUG: Starting initial fetch" >&2
response=$(fetch_accounts)
next_key=$(echo "$response" | jq -r '.next_key')
echo "DEBUG: Initial next_key: $next_key" >&2

# Process initial response
echo "DEBUG: Processing initial response" >&2
processed_count=$(process_accounts "$response")
total_processed=$((total_processed + processed_count))
echo "DEBUG: Total processed after initial: $total_processed" >&2

# Continue fetching while there are more results
while [ "$next_key" != "null" ] && [ ! -z "$next_key" ]; do
    echo "DEBUG: Fetching more accounts with next_key: $next_key" >&2
    response=$(fetch_accounts "$next_key")
    next_key=$(echo "$response" | jq -r '.next_key')
    echo "DEBUG: New next_key: $next_key" >&2
    additional_count=$(process_accounts "$response")
    total_processed=$((total_processed + additional_count))
    echo "DEBUG: Total processed: $total_processed" >&2
done

# Clean up
rm /tmp/payload.json

# Count total accounts (subtract 1 for header)
total_accounts=$(($(wc -l < "$OUTPUT_FILE") - 1))
echo "Done! Processed $total_accounts accounts from $CONTRACT on $NETWORK"
echo "Results saved to $OUTPUT_FILE" 