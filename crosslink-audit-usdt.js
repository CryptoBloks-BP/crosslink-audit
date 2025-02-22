const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const usdtTokenAddressMainnet = process.env.USDT_TOKEN_ADDRESS_MAINNET;
const usdtTokenAddressSepolia = process.env.USDT_TOKEN_ADDRESS_SEPOLIA;
const ethereumContractMainnet = process.env.ETHEREUM_CONTRACT_MAINNET;
const ethereumContractSepolia = process.env.ETHEREUM_CONTRACT_SEPOLIA;
const libreApiUrlMainnet = process.env.LIBRE_API_URL_MAINNET;
const libreApiUrlTestnet = process.env.LIBRE_API_URL_TESTNET;

const isTestnet = process.argv.slice(2).includes('testnet');
const config = {
    ethereumContract: isTestnet ? ethereumContractSepolia : ethereumContractMainnet,
    libreApiUrl: isTestnet ? libreApiUrlTestnet : libreApiUrlMainnet,
    usdtTokenAddress: isTestnet ? usdtTokenAddressSepolia : usdtTokenAddressMainnet,
};

async function getEthereumBalance(contractAddress) {
    console.log(``);
    console.log(`Fetching USDT balance for Ethereum bridge contract: ${contractAddress}`);
    try {
        const url = isTestnet
            ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
            : `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        const body = JSON.stringify({
            id: 1,
            jsonrpc: "2.0",
            method: "alchemy_getTokenBalances",
            params: [
                contractAddress,
                "erc20"
            ]
        });

        const response = await axios.post(url, body, { headers });
        const data = response.data;
        const usdtBalanceHex = data.result.tokenBalances.find(token => token.contractAddress.toLowerCase() === config.usdtTokenAddress.toLowerCase()).tokenBalance;
        const usdtBalance = parseFloat(ethers.utils.formatUnits(usdtBalanceHex, 6));

        return usdtBalance;
    } catch (error) {
        console.error(`Error fetching USDT balance for Ethereum bridge contract: ${contractAddress}: ${error.message}`);
        return 0;
    }
}

async function getLibreAccounts() {
    console.log(``);
    console.log(`Fetching Libre accounts registered with the USDT contract: usdt.libre`);
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
        console.error(`Error fetching Libre accounts registered with the USDT contract: usdt.libre: ${error.message}`);
        return 0;
    }
}

async function getAllAccountNames() {
    console.log(``);
    console.log('Fetching USDT balances for Libre accounts registered with the USDT contract: usdt.libre');
    console.log(``);
    console.log(`=== USDT Balances for Libre Users ===`);
    console.log(``);
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
        console.error(`Error USDT balances for Libre accounts registered with the USDT contract: ${error.message}`);
        return [];
    }
}

async function getCirculatingSupply() {
    console.log(``);
    console.log('Fetching circulating supply of USDT on Libre');
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
    console.log(`Starting USDT audit on ${isTestnet ? 'TESTNET' : 'MAINNET'}`);

    const ethereumBalance = await getEthereumBalance(config.ethereumContract);
    const totalUSDTInAccounts = await getLibreAccounts();
    const circulatingSupply = await getCirculatingSupply();

    console.log('\n=== USDT Audit Report ===');
    console.log(``);
    console.log(`Ethereum Contract Balance: ${ethereumBalance} USDT`);
    console.log(`Total USDT in Libre Accounts: ${totalUSDTInAccounts} USDT`);
    console.log(`Circulating Supply on Libre: ${circulatingSupply} USDT`);
    console.log(``);
}

auditUSDT().catch(error => {
    console.error('Fatal error during USDT audit:', error);
});
