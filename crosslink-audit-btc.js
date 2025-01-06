const axios = require('axios');

// API Configuration
const apiUrl = 'https://lb.libre.org';
const btcExplorerApi = 'https://blockchain.info/balance';

// Global tracking variables
let walletBalanceBTC = 0;
let walletCountBTC = 0;
let processedAddresses = [];

// Get command line arguments
const args = process.argv.slice(2);
const testQty = parseInt(args[0]);
const isTestMode = !isNaN(testQty) && testQty > 0;

// Function to fetch BTC balance for an address
async function getBTCBalance(address) {
    try {
        const response = await axios.get(`${btcExplorerApi}?active=${address}`);
        const balance = response.data[address].final_balance / 100000000; // Convert satoshis to BTC
        return balance;
    } catch (error) {
        console.error(`Error fetching BTC balance for ${address}:`, error.message);
        return 0;
    }
}

// Function to fetch accounts from EOSIO blockchain
async function fetchAccounts(nextKey = null) {
    try {
        const payload = {
            code: "x.libre",
            table: "accounts",
            scope: "x.libre",
            limit: 1000,
            json: true,
            reverse: false
        };

        if (nextKey) {
            payload.lower_bound = nextKey;
        }

        const response = await axios.post(`${apiUrl}/v1/chain/get_table_rows`, payload);
        return response.data;
    } catch (error) {
        console.error('Error fetching accounts:', error.message);
        return null;
    }
}

// Function to fetch BTC circulating supply from the Libre Chain
async function getBTCSupply() {
    try {
        const response = await axios.post(`${apiUrl}/v1/chain/get_currency_stats`, {
            code: "btc.libre",
            symbol: "BTC"
        });
        return parseFloat(response.data.BTC.supply);
    } catch (error) {
        console.error('Error fetching BTC supply:', error.message);
        return 0;
    }
}

// Main processing function
async function processAddresses() {
    let hasMore = true;
    let nextKey = null;
    let addressCount = 0;

    while (hasMore) {
        const data = await fetchAccounts(nextKey);
        if (!data) break;

        // Process each address in the current batch
        for (const row of data.rows) {
            if (row.btc_address) {
                const balance = await getBTCBalance(row.btc_address);
                processedAddresses.push({
                    address: row.btc_address,
                    balance: balance
                });

                walletBalanceBTC += balance;
                walletCountBTC++;
                addressCount++;

                console.log(`Address: ${row.btc_address}, Balance: ${balance} BTC`);

                // If in test mode and we've processed the specified number of addresses, break
                if (isTestMode && addressCount >= testQty) {
                    hasMore = false;
                    break;
                }
            }
        }

        if (!isTestMode) {
            hasMore = data.more;
            nextKey = data.next_key;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Get BTC supply
    const supplyBTC = await getBTCSupply();
    const diffBTC = walletBalanceBTC - supplyBTC;

    // Print final results
    console.log('\n=== Final Results ===');
    console.log(`Mode: ${isTestMode ? `Test (First ${testQty} addresses)` : 'Full Audit'}`);
    console.log(`Addresses Verified: ${walletCountBTC}`);
    console.log(`BTC Balance (bridge): ${walletBalanceBTC.toFixed(8)} BTC`);
    console.log(`BTC Minted (chain): ${supplyBTC.toFixed(8)} BTC`);
    console.log(`BTC Difference (bridge - chain): ${diffBTC.toFixed(8)} BTC`);
}

// Start the process
console.log(`Starting BTC address verification in ${isTestMode ? `TEST mode (${testQty} addresses)` : 'FULL mode'}...\n`);
processAddresses().catch(error => {
    console.error('Fatal error:', error);
}); 