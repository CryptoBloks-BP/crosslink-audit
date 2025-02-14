const axios = require('axios');

// API Configuration
const apiUrl = 'https://lb.libre.org';
const btcExplorerApi = 'https://blockchain.info/balance';

// Global tracking variables
let walletBalanceBTC = 0;
let walletCountBTC = 0;
let processedAddresses = [];
let nonZeroBalances = [];

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

// Function to fetch all Libre account data
async function fetchAllLibreAccounts() {
    try {
        const payload = {
            code: "x.libre",
            table: "accounts",
            scope: "x.libre",
            limit: 1000,
            json: true
        };

        let allAccounts = [];
        let hasMore = true;
        let nextKey = null;

        while (hasMore) {
            if (nextKey) {
                payload.lower_bound = nextKey;
            }
            const response = await axios.post(`${apiUrl}/v1/chain/get_table_rows`, payload);
            allAccounts = allAccounts.concat(response.data.rows);
            hasMore = response.data.more;
            nextKey = response.data.next_key;
        }

        return allAccounts;
    } catch (error) {
        console.error('Error fetching all Libre accounts:', error.message);
        return [];
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

    // Fetch all Libre accounts once
    const allLibreAccounts = await fetchAllLibreAccounts();

    // Process each address from the pre-fetched accounts
    for (const account of allLibreAccounts) {
        const balance = await getBTCBalance(account.btc_address);
        const username = account.account;
        const paddedUsername = (username + ',').padEnd(12, ' '); // Add comma and pad to 12 characters
        processedAddresses.push({
            address: account.btc_address,
            balance: balance,
            username: username
        });

        // Add to nonZeroBalances array if balance is greater than 0
        if (balance > 0) {
            nonZeroBalances.push({
                address: account.btc_address,
                balance: balance,
                username: username
            });
        }

        walletBalanceBTC += balance;
        walletCountBTC++;
        addressCount++;

        console.log(`Address: ${account.btc_address}, User: ${paddedUsername} Balance: ${balance} BTC`);

        // If in test mode and we've processed the specified number of addresses, break
        if (isTestMode && addressCount >= testQty) {
            break;
        }
    }

    // Get BTC supply
    const supplyBTC = await getBTCSupply();
    const diffBTC = walletBalanceBTC - supplyBTC;

    // Print final results
    console.log('\n            === Final Results ===');
    console.log(`                 Mode: ${isTestMode ? `Test (First ${testQty} addresses)` : 'Full Audit'}`);
    console.log(`   Addresses Verified: ${walletCountBTC}`);
    console.log(` BTC Balance (bridge): ${walletBalanceBTC.toFixed(8)} BTC`);
    console.log(`   BTC Minted (chain): ${supplyBTC.toFixed(8)} BTC`);
    console.log(`Diff (bridge - chain): ${diffBTC.toFixed(8)} BTC`);

    // Add this section to print non-zero balances
    console.log('\n=== Addresses with Non-Zero Balances ===');
    if (nonZeroBalances.length === 0) {
        console.log('No addresses found with non-zero balances');
    } else {
        nonZeroBalances.sort((a, b) => b.balance - a.balance); // Sort by balance descending
        nonZeroBalances.forEach(item => {
            const paddedUsername = (item.username + ',').padEnd(13, ' '); // Add comma and pad to 13 characters
            console.log(`Address: ${item.address}, User: ${paddedUsername} Balance: ${item.balance.toFixed(8)} BTC`);
        });
    }
}

// Start the process
console.log(`Starting BTC address verification in ${isTestMode ? `TEST mode (${testQty} addresses)` : 'FULL mode'}...\n`);
processAddresses().catch(error => {
    console.error('Fatal error:', error);
}); 