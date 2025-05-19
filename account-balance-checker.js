const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// API Configuration
const mainnetApiUrl = process.env.LIBRE_API_MAINNET || 'https://lb.libre.org';
const mainnetBtcExplorerApi = process.env.BTC_EXPLORER_API_MAINNET;

// Function to fetch BTC balance for an address
async function getBTCBalance(address) {
    try {
        const response = await axios.get(`${mainnetBtcExplorerApi}/${address}`);
        const fundedSum = response.data.chain_stats.funded_txo_sum;
        const spentSum = response.data.chain_stats.spent_txo_sum;
        const balance = (fundedSum - spentSum) / 100000000; // Convert satoshis to BTC
        return balance;
    } catch (error) {
        console.error(`Error fetching BTC balance for ${address}:`, error.message);
        return 0;
    }
}

// Function to fetch account data from Libre blockchain
async function fetchAccountData(account) {
    try {
        const payload = {
            code: "x.libre",
            table: "accounts",
            scope: "x.libre",
            limit: 100,
            json: true,
            lower_bound: account,
            upper_bound: account
        };

        const response = await axios.post(`${mainnetApiUrl}/v1/chain/get_table_rows`, payload);
        return response.data.rows[0] || null;
    } catch (error) {
        console.error(`Error fetching account data for ${account}:`, error.message);
        return null;
    }
}

// Function to read accounts from file
function readAccountsFromFile(filename) {
    try {
        const data = fs.readFileSync(filename, 'utf8');
        return data.split('\n').filter(line => line.trim() !== '');
    } catch (error) {
        console.error('Error reading accounts file:', error.message);
        return [];
    }
}

// Function to write results to CSV
function writeResultsToCSV(results, filename) {
    const header = 'Account,BTC Address,Balance (BTC)\n';
    const rows = results.map(result => {
        const balance = result.balance !== null ? result.balance.toFixed(8) : '0.00000000';
        return `${result.account},${result.btc_address || 'none'},${balance}`;
    });
    
    const csvContent = header + rows.join('\n');
    fs.writeFileSync(filename, csvContent);
    console.log(`Results written to ${filename}`);
}

// Main processing function
async function processAccounts(inputFile, outputFile) {
    const accounts = readAccountsFromFile(inputFile);
    const results = [];

    console.log(`Processing ${accounts.length} accounts...`);

    for (const account of accounts) {
        console.log(`Processing account: ${account}`);
        
        // Fetch account data
        const accountData = await fetchAccountData(account);
        
        let balance = null;
        if (accountData && accountData.btc_address) {
            balance = await getBTCBalance(accountData.btc_address);
        }

        results.push({
            account: account,
            btc_address: accountData?.btc_address || 'none',
            balance: balance
        });
    }

    // Write results to CSV
    writeResultsToCSV(results, outputFile);
}

// Check command line arguments
if (process.argv.length < 4) {
    console.log('Usage: node account-balance-checker.js <input_file> <output_file>');
    process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

console.log(`Starting account balance check...`);
console.log(`Input file: ${inputFile}`);
console.log(`Output file: ${outputFile}\n`);

processAccounts(inputFile, outputFile).catch(error => {
    console.error('Fatal error:', error);
}); 