const axios = require('axios');
const { ethers } = require('ethers');

// Configuration
const mainnetConfig = {
    ethereumContract: '0xB7bBd4B494740EB374852b866eFAB2C1194A0e90',
    libreApiUrl: 'https://api.libre.cryptobloks.io',
};

const testnetConfig = {
    ethereumContract: '0x1e4A123a59c718EFa16F5240C34D8099f7B9F0A6',
    libreApiUrl: 'https://api.testnet.libre.cryptobloks.io',
};

// Determine network
const args = process.argv.slice(2);
const isTestnet = args.includes('testnet');
const config = isTestnet ? testnetConfig : mainnetConfig;

// Add your Infura or Alchemy API key here
const INFURA_PROJECT_ID = 'your_infura_project_id';

// USDT token addresses on Ethereum mainnet and Sepolia
const usdtTokenAddressMainnet = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const usdtTokenAddressSepolia = '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0';

async function getEthereumBalance(contractAddress) {
    console.log(`Fetching Ethereum balance for contract: ${contractAddress}`);
    try {
        const tokenAddress = isTestnet ? usdtTokenAddressSepolia : usdtTokenAddressMainnet;
        const apiUrl = isTestnet
            ? `https://test.tokenbalance.com/token/${tokenAddress}/${contractAddress}`
            : `https://api.tokenbalance.com/token/${tokenAddress}/${contractAddress}`;

        const response = await axios.get(apiUrl);
        const balance = parseFloat(response.data.balance) / 1e18; // Convert from Wei to Ether

        return balance;
    } catch (error) {
        console.error(`Error fetching Ethereum balance: ${error.message}`);
        return 0;
    }
}

async function getLibreAccounts() {
    console.log('Fetching Libre accounts with USDT balances...');
    let totalUSDT = 0;
    try {
        const accountNames = await getAllAccountNames();

        for (const account of accountNames) {
            const response = await axios.post(`${config.libreApiUrl}/v1/chain/get_table_rows`, {
                code: 'usdt.libre',
                table: 'accounts',
                scope: account,
                limit: 100,
                json: true
            });

            for (const row of response.data.rows) {
                const balance = parseFloat(row.balance.split(' ')[0]);
                totalUSDT += balance;
                const paddedAccount = account.padEnd(14, ' ');
                console.log(`Account: ${paddedAccount} Balance: ${balance} USDT`);
            }
        }

        return totalUSDT;
    } catch (error) {
        console.error(`Error fetching Libre accounts: ${error.message}`);
        return 0;
    }
}

async function getAllAccountNames() {
    console.log('Retrieving all account names from usdt.libre contract...');
    const accountNames = [];
    let more = true;
    let nextKey = '';

    try {
        while (more) {
            const response = await axios.post(`${config.libreApiUrl}/v1/chain/get_table_by_scope`, {
                code: 'usdt.libre',
                table: 'accounts',
                limit: 100,
                lower_bound: nextKey,
                json: true
            });

            for (const row of response.data.rows) {
                accountNames.push(row.scope);
            }

            more = response.data.more;
            nextKey = response.data.next_key;
        }

        return accountNames;
    } catch (error) {
        console.error(`Error retrieving account names: ${error.message}`);
        return [];
    }
}

async function getCirculatingSupply() {
    console.log('Fetching circulating supply of USDT on Libre...');
    try {
        const response = await axios.post(`${config.libreApiUrl}/v1/chain/get_currency_stats`, {
            code: 'usdt.libre',
            symbol: 'USDT'
        });

        const circulatingSupply = parseFloat(response.data.USDT.supply.split(' ')[0]);
        return circulatingSupply;
    } catch (error) {
        console.error(`Error fetching circulating supply: ${error.message}`);
        return 0;
    }
}

async function auditUSDT() {
    console.log(`Starting USDT audit on ${isTestnet ? 'TESTNET' : 'MAINNET'}...`);

    const ethereumBalance = await getEthereumBalance(config.ethereumContract);
    const totalUSDTInAccounts = await getLibreAccounts();
    const circulatingSupply = await getCirculatingSupply();

    console.log('\n=== USDT Audit Report ===');
    console.log(`Ethereum Contract Balance: ${ethereumBalance} USDT`);
    console.log(`Total USDT in Libre Accounts: ${totalUSDTInAccounts} USDT`);
    console.log(`Circulating Supply on Libre: ${circulatingSupply} USDT`);
}

auditUSDT().catch(error => {
    console.error('Fatal error during USDT audit:', error);
});
