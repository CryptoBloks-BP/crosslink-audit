# crosslink-audit

Audit Libre Crosslink Bridge BTC and CBTC Balances

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

You can run the BTC audit script in these ways:

Full mode on Mainnet: `node crosslink-audit-btc.js`

Test mode on Mainnet with specific quantity: `node crosslink-audit-btc.js 25` (processes first 25 addresses)

Test mode on Mainnet with different quantity: `node crosslink-audit-btc.js 100` (processes first 100 addresses)

Test mode on Signet: `node crosslink-audit-btc.js testnet 25` (processes first 25 addresses on Signet)

If you provide an invalid number (0, negative, or non-numeric), it will run in full mode.

## Running the CBTC Audit

To run the CBTC audit script, use the following command:

`node crosslink-audit-cbtc.js`

This will execute the audit process for CBTC balances.

## Running the USDT Audit

To run the USDT audit script, use the following command:

`node crosslink-audit-usdt.js`

This will execute the audit process for USDT balances on both Mainnet and Sepolia testnet, depending on the presence of the 'testnet' flag.

Example:
- Mainnet: `node crosslink-audit-usdt.js`
- Testnet: `node crosslink-audit-usdt.js testnet`

The script will output the Ethereum contract balance, total USDT in Libre accounts, and the circulating supply on Libre.

# Changes Made

- Added support for running the script on both Mainnet and Signet testnet.
- Updated API endpoints:
  - Mainnet: `https://mempool.space/api/address/<bitcoin_address>`
  - Signet: `https://mempool.space/signet/api/address/<bitcoin_address>`
- Balance calculation now uses `funded_txo_sum` and `spent_txo_sum` to derive the current balance.
- New script `crosslink-audit-cbtc.js` added for CBTC audit.
