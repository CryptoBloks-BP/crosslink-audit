#!/bin/bash

# Default to mainnet if not specified
NETWORK=${1:-mainnet}

# Set API URL based on network
if [ "$NETWORK" = "testnet" ]; then
    API_URL="https://api.testnet.libre.cryptobloks.io"
else
    API_URL="https://api.libre.cryptobloks.io"
fi

echo "Fetching accounts from $NETWORK..."

# Create temporary file for the JSON payload
cat > /tmp/payload.json << EOF
{
    "code": "x.libre",
    "table": "accounts",
    "scope": "x.libre",
    "limit": 1000,
    "json": true
}
EOF

# Initialize output file
echo "" > accounts.txt

# Function to fetch accounts
fetch_accounts() {
    local lower_bound=$1
    local payload_file="/tmp/payload.json"
    
    # Update lower_bound if provided
    if [ ! -z "$lower_bound" ]; then
        jq --arg lb "$lower_bound" '.lower_bound = $lb' "$payload_file" > /tmp/temp.json
        mv /tmp/temp.json "$payload_file"
    fi
    
    # Make the API call
    curl -s -X POST "$API_URL/v1/chain/get_table_rows" \
        -H "Content-Type: application/json" \
        -d @"$payload_file"
}

# Initial fetch
response=$(fetch_accounts)
next_key=$(echo "$response" | jq -r '.next_key')

# Process initial response
echo "$response" | jq -r '.rows[].account' >> accounts.txt

# Continue fetching while there are more results
while [ "$next_key" != "null" ] && [ ! -z "$next_key" ]; do
    echo "Fetching more accounts..."
    response=$(fetch_accounts "$next_key")
    next_key=$(echo "$response" | jq -r '.next_key')
    echo "$response" | jq -r '.rows[].account' >> accounts.txt
done

# Clean up
rm /tmp/payload.json

# Count total accounts
total_accounts=$(wc -l < accounts.txt)
echo "Done! Fetched $total_accounts accounts to accounts.txt" 