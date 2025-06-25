require('dotenv').config();

const axios = require('axios');

// API Configuration
const testnetApiUrl = process.env.LIBRE_API_TESTNET;
const mainnetApiUrl = process.env.LIBRE_API_MAINNET;
const mainnetBtcExplorerApi = process.env.BTC_EXPLORER_API_MAINNET;
const testnetBtcExplorerApi = process.env.BTC_EXPLORER_API_TESTNET;

// Global tracking variables
let processedAddresses = [];
let allTransactions = [];
let duplicateBlockTransactions = [];

// Get command line arguments
const args = process.argv.slice(2);
const isTestnet = args.includes('testnet');
const testQtyIndex = isTestnet ? args.indexOf('testnet') + 1 : 0;
const testQty = parseInt(args[testQtyIndex]);
const isTestMode = !isNaN(testQty) && testQty > 0;

// Check for specific wallet address parameter
const walletAddressIndex = args.findIndex(arg => arg.startsWith('--address='));
const specificWalletAddress = walletAddressIndex !== -1 ? args[walletAddressIndex].split('=')[1] : null;

// Choose the correct API URL based on the network
const apiUrl = isTestnet ? testnetApiUrl : mainnetApiUrl;
const btcExplorerApi = isTestnet ? testnetBtcExplorerApi : mainnetBtcExplorerApi;

// Function to fetch all Libre account data from the BTC bridge contract
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

// Function to fetch all transactions for a Bitcoin address
async function getAddressTransactions(address) {
    try {
        // Try the correct mempool.space API endpoint
        const apiUrl = `${btcExplorerApi}/${address}/txs`;
        
        const transactionsResponse = await axios.get(apiUrl);
        
        if (transactionsResponse.data && Array.isArray(transactionsResponse.data)) {
            return transactionsResponse.data;
        }
        return [];
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log(`  Address ${address} not found or has no transactions`);
        } else {
            console.error(`Error fetching transactions for ${address}:`, error.message);
        }
        return [];
    }
}

// Function to analyze transactions for duplicate outputs to same address
function analyzeDuplicateOutputTransactions(transactions, walletAddress, libreAccount) {
    let foundInThisAddress = 0;
    
    transactions.forEach((tx, index) => {
        if (tx.vout && Array.isArray(tx.vout)) {
            // Count outputs to this specific wallet address
            const outputsToAddress = tx.vout.filter(output => output.scriptpubkey_address === walletAddress);
            
            if (outputsToAddress.length > 1) {
                // This transaction has multiple outputs to the same address
                console.log(`\n  *** FOUND MULTIPLE OUTPUTS ***`);
                console.log(`  Transaction: ${tx.txid}`);
                console.log(`  Block: ${tx.status.block_height}, Time: ${new Date(tx.status.block_time * 1000).toISOString()}`);
                console.log(`  Outputs to ${walletAddress}: ${outputsToAddress.length}`);
                
                outputsToAddress.forEach(output => {
                    const amount = output.value / 100000000;
                    console.log(`    Output ${output.n}: ${amount.toFixed(8)} BTC`);
                    
                    duplicateBlockTransactions.push({
                        timestamp: tx.status.block_time,
                        blockNumber: tx.status.block_height,
                        transactionHash: tx.txid,
                        walletAddress: walletAddress,
                        amount: amount,
                        libreAccount: libreAccount,
                        outputIndex: output.n || 0
                    });
                    foundInThisAddress++;
                });
            }
        }
    });
    
    if (foundInThisAddress > 0) {
        console.log(`  Total outputs found for this address: ${foundInThisAddress}`);
    }
    
    return foundInThisAddress;
}

// Helper function to add delay between API calls
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main processing function
async function processAddresses() {
    let addressCount = 0;

    if (specificWalletAddress) {
        // Test mode with specific wallet address
        console.log(`Testing with specific wallet address: ${specificWalletAddress}`);
        
        console.log(`Processing specific address: ${specificWalletAddress}`);
        
        // Fetch all transactions for this address
        const transactions = await getAddressTransactions(specificWalletAddress);
        
        console.log(`  Found ${transactions.length} transaction(s)`);
        
        if (transactions.length > 0) {
            // Analyze for duplicate block transactions
            const foundOutputs = analyzeDuplicateOutputTransactions(transactions, specificWalletAddress, 'TEST_ADDRESS');
            
            processedAddresses.push({
                address: specificWalletAddress,
                account: 'TEST_ADDRESS',
                transactionCount: transactions.length,
                foundOutputs: foundOutputs
            });
        }
    } else {
        // Fetch all Libre accounts once
        const allLibreAccounts = await fetchAllLibreAccounts();
        console.log(`Found ${allLibreAccounts.length} bridge wallet addresses to analyze...\n`);

        // Process each address from the pre-fetched accounts
        for (const account of allLibreAccounts) {
            const walletAddress = account.btc_address;
            const libreAccount = account.account;
            
            console.log(`Processing address ${addressCount + 1}/${allLibreAccounts.length}: ${walletAddress} (${libreAccount})`);
            
            // Fetch all transactions for this address
            const transactions = await getAddressTransactions(walletAddress);
            
            console.log(`  Found ${transactions.length} transaction(s)`);
            
            // Always add the address to processed addresses, regardless of transaction count
            let foundOutputs = 0;
            if (transactions.length > 0) {
                // Analyze for duplicate block transactions
                foundOutputs = analyzeDuplicateOutputTransactions(transactions, walletAddress, libreAccount);
            }
            
            processedAddresses.push({
                address: walletAddress,
                account: libreAccount,
                transactionCount: transactions.length,
                foundOutputs: foundOutputs
            });

            addressCount++;

            // Add a small delay to avoid overwhelming the API
            await delay(100);

            // If in test mode and we've processed the specified number of addresses, break
            if (isTestMode && addressCount >= testQty) {
                break;
            }
        }
    }

    // Sort duplicate transactions by timestamp
    duplicateBlockTransactions.sort((a, b) => a.timestamp - b.timestamp);

    // Print final results
    console.log('\n              === Final Results ===');
    console.log(`                   Mode: ${specificWalletAddress ? 'Specific Address Test' : (isTestMode ? `Test (First ${testQty} addresses)` : 'Full Audit')}`);
    console.log(`    Addresses Processed: ${processedAddresses.length}`);
    console.log(`    Total Outputs Found: ${duplicateBlockTransactions.length}`);
    console.log(`TXs w/ Multiple Outputs: ${new Set(duplicateBlockTransactions.map(tx => tx.transactionHash)).size}`);

    // Print detailed report
    if (duplicateBlockTransactions.length > 0) {
        console.log('\n=== Transactions with Multiple Outputs to Same Address ===');
        console.log('Timestamp           | Block  | Transaction Hash                                                 | Wallet Address                             | Amount (BTC)   | Output # | Libre Account');
        console.log('--------------------|--------|------------------------------------------------------------------|--------------------------------------------|----------------|----------|--------------');
        
        duplicateBlockTransactions.forEach(tx => {
            const timestamp = new Date(tx.timestamp * 1000).toISOString().replace('T', ' ').substring(0, 19);
            const paddedAmount = tx.amount.toFixed(8).padStart(16, ' ');
            const paddedOutputIndex = tx.outputIndex.toString().padStart(8, ' ');
            const paddedAccount = tx.libreAccount.padEnd(14, ' ');
            
            console.log(`${timestamp} | ${tx.blockNumber.toString().padStart(6, ' ')} | ${tx.transactionHash.padEnd(64, ' ')} | ${tx.walletAddress.padEnd(42, ' ')} |${paddedAmount} | ${paddedOutputIndex} | ${paddedAccount}`);
        });
    } else {
        console.log('\nNo transactions found with multiple outputs to the same address.');
    }
}

// Start the process
console.log(`Starting BTC transaction analysis in ${isTestMode ? `TEST mode (${testQty} addresses)` : 'FULL mode'} on ${isTestnet ? 'TESTNET' : 'MAINNET'}...`);
console.log(`Using Bitcoin API: ${btcExplorerApi}`);
console.log(`Using Libre API: ${apiUrl}\n`);
processAddresses().catch(error => {
    console.error('Fatal error:', error);
}); 