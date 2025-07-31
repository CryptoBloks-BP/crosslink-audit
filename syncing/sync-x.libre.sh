#!/bin/bash

# Check if sync.txt exists
if [ ! -f "sync-x.libre.txt" ]; then
    echo "Error: sync.txt not found"
    exit 1
fi

# Handle error.log file
if [ -f "error-x.libre.log" ]; then
    read -p "error-x.libre.log already exists. Clear it before proceeding? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        > error-x.libre.log
        echo "error-x.libre.log cleared"
    else
        echo "Appending to existing error-x.libre.log"
    fi
else
    > error-x.libre.log
    echo "Created new error-x.libre.log"
fi

# Read each line from sync.txt
while IFS= read -r line; do
    account_name=$(echo "$line")
    
    # Make the curl request and capture the response
    echo "Processing account: $account_name"
    response=$(curl -s -X POST http://localhost:8090/resharing \
        -H 'Content-Type: application/json' \
        -d "{\"btcAccount\": \"$account_name\"}")
    
    # Check if response contains error
    if echo "$response" | grep -q '"error"'; then
        timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        echo "[$timestamp] Account: $account_name - $response" >> error-x.libre.log
        
        # Check for timeout error
        if echo "$response" | grep -q '"error":"resharing failed: parties setup timed out"'; then
            echo "Timeout detected. Pausing for 2 minutes..."
            sleep 120
        fi
    fi
    
    # Add a small delay between requests
    sleep 2
done < "sync-x.libre.txt"