# crosslink-audit

Audit Libre Crosslink Bridge BTC, CBTC, and USDT Balances

# Environment Configuration

Before running the scripts, you need to set up a `.env` file in the root directory of this project. This file should contain the following environment variables:

```
ALCHEMY_API_KEY=your_alchemy_api_key
USDT_TOKEN_ADDRESS_MAINNET=your_usdt_token_address_mainnet
USDT_TOKEN_ADDRESS_SEPOLIA=your_usdt_token_address_sepolia
ETHEREUM_CONTRACT_MAINNET=your_ethereum_contract_mainnet
ETHEREUM_CONTRACT_SEPOLIA=your_ethereum_contract_sepolia
LIBRE_API_URL_MAINNET=your_libre_api_url_mainnet
LIBRE_API_URL_TESTNET=your_libre_api_url_testnet
```

You can use the `.env.example` file as a template to create your `.env` file. Ensure that you replace placeholder values with your actual configuration values.

# To install

npm install

# To run

## Running the BTC Audit

You can run the BTC audit script in these ways:

Audit on Mainnet: `node crosslink-audit-btc.js`

Audit on Testnet: `node crosslink-audit-btc.js testnet`

## Running the CBTC Audit

You can run the CBTC audit script in these ways:

Audit on Mainnet: `node crosslink-audit-cbtc.js`

Audit on Testnet: `node crosslink-audit-cbtc.js testnet`

## Running the USDT Audit

You can run the USDT audit script in these ways:

Audit on Mainnet: `node crosslink-audit-usdt.js`

Audit on Testnet: `node crosslink-audit-usdt.js testnet`
