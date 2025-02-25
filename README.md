# crosslink-audit

Audit Libre Crosslink Bridge BTC, CBTC, and USDT Balances

# Environment Configuration

Before running the scripts, you need to set up a `.env` file in the root directory of this project. This file should contain the following environment variables:

```
# Alchemy API Key
ALCHEMY_API_KEY=your_alchemy_api_key

# USDT Token Addresses (Ethereum)
ETH_USDT_TOKEN_CONTRACT_MAINNET=0xdAC17F958D2ee523a2206206994597C13D831ec7
ETH_USDT_TOKEN_CONTRACT_TESTNET=0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0

# Ethereum Bridge Contract Addresses (Ethereum)
ETH_BRIDGE_CONTRACT_MAINNET=0xB7bBd4B494740EB374852b866eFAB2C1194A0e90
ETH_BRIDGE_CONTRACT_TESTNET=0x1e4A123a59c718EFa16F5240C34D8099f7B9F0A6

# Libre API URLs (Libre)
LIBRE_API_MAINNET=https://api.libre.cryptobloks.io
LIBRE_API_TESTNET=https://api.testnet.libre.cryptobloks.io

# Alchemy ETH RPC URLs (Ethereum)
ETH_RPC_MAINNET=https://eth-mainnet.g.alchemy.com/v2
ETH_RPC_TESTNET=https://eth-sepolia.g.alchemy.com/v2

# BTC Explorer API URLs (Bitcoin)
BTC_EXPLORER_API_MAINNET=https://mempool.space/api/address
BTC_EXPLORER_API_TESTNET=https://mempool.space/signet/api/address
```

You can use the `.env.example` file as a template to create your `.env` file. Ensure that you replace placeholder values with your actual configuration values.

The USDT audit scripts require active Alchemy API Keys. You can get one at https://www.alchemy.com/

# To install

Run the following command to install dependencies:

```
npm install
```

# To run

## Running the BTC Audit

You can run the BTC audit script in these ways:

- Audit on Mainnet: `node crosslink-audit-btc.js`
- Audit on Testnet: `node crosslink-audit-btc.js testnet`

## Running the CBTC Audit

You can run the CBTC audit script in these ways:

- Audit on Mainnet: `node crosslink-audit-cbtc.js`
- Audit on Testnet: `node crosslink-audit-cbtc.js testnet`

## Running the USDT Audit

You can run the USDT audit script in these ways:

- Audit on Mainnet: `node crosslink-audit-usdt.js`
- Audit on Testnet: `node crosslink-audit-usdt.js testnet`

# Recent Changes

- Updated environment variable names for clarity and consistency.
- Fixed the Alchemy API URL construction in the USDT audit script.
- Rounded totals in the USDT audit report to 6 decimal places (Match USDT precision).
- Corrected the API URL configuration in the CBTC audit script.
- Removed unused BTC bridge contract accounts from the `.env` files.
