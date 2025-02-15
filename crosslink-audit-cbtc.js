require('dotenv').config();

const axios = require('axios');

// API Configuration
const testnetApiUrl = process.env.LIBRE_API_URL_TESTNET;
const mainnetApiUrl = process.env.LIBRE_API_URL_MAINNET;
const mainnetBtcExplorerApi = 'https://mempool.space/api/address';
const signetBtcExplorerApi = 'https://mempool.space/signet/api/address';

// Global tracking variables
let walletBalanceBTC = 0;
let walletCountBTC = 0;
let processedAddresses = [];
let nonZeroBalances = [];

// Get command line arguments
const args = process.argv.slice(2);
const isTestnet = args.includes('testnet');
const testQtyIndex = isTestnet ? args.indexOf('testnet') + 1 : 0;
const testQty = parseInt(args[testQtyIndex]);
const isTestMode = !isNaN(testQty) && testQty > 0;

// Choose the correct API URL based on the network
const apiUrl = isTestnet ? testnetApiUrl : mainnetApiUrl;
const btcExplorerApi = isTestnet ? signetBtcExplorerApi : mainnetBtcExplorerApi;

// Function to fetch BTC balance for an address
async function getBTCBalance(address) {
    try {
        const response = await axios.get(`${btcExplorerApi}/${address}`);
        const fundedSum = response.data.chain_stats.funded_txo_sum;
        const spentSum = response.data.chain_stats.spent_txo_sum;
        const balance = (fundedSum - spentSum) / 100000000; // Convert satoshis to BTC
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
            code: "v.libre",
            table: "accounts",
            scope: "v.libre",
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
            code: "v.libre",
            table: "accounts",
            scope: "v.libre",
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

// Function to fetch CBTC circulating supply from the Libre Chain
async function getBTCSupply() {
    try {
        const response = await axios.post(`${apiUrl}/v1/chain/get_currency_stats`, {
            code: "cbtc.libre",
            symbol: "CBTC"
        });
        return parseFloat(response.data.CBTC.supply);
    } catch (error) {
        console.error('Error fetching CBTC supply:', error.message);
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
        const paddedUsername = (username + ',').padEnd(14, ' '); // Add comma and pad to 14 characters
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
    console.log(`  CBTC Minted (chain): ${supplyBTC.toFixed(8)} BTC`);
    console.log(`Diff (bridge - chain): ${diffBTC.toFixed(8)} BTC`);

    // Add this section to print non-zero balances
    console.log('\n=== Addresses with Non-Zero Balances ===');
    if (nonZeroBalances.length === 0) {
        console.log('No addresses found with non-zero balances');
    } else {
        nonZeroBalances.sort((a, b) => b.balance - a.balance); // Sort by balance descending
        nonZeroBalances.forEach(item => {
            const paddedUsername = (item.username + ',').padEnd(14, ' '); // Add comma and pad to 14 characters
            console.log(`Address: ${item.address}, User: ${paddedUsername} Balance: ${item.balance.toFixed(8)} BTC`);
        });
    }
}

// Start the process
console.log(`Starting BTC address verification in ${isTestMode ? `TEST mode (${testQty} addresses)` : 'FULL mode'} on ${isTestnet ? 'TESTNET' : 'MAINNET'}...\n`);
processAddresses().catch(error => {
    console.error('Fatal error:', error);
}); 