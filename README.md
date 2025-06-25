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

## Running the Transaction Analysis Scripts

The transaction analysis scripts identify Bitcoin transactions that have multiple outputs to the same wallet address. This can be useful for detecting potential issues or unusual patterns in bridge wallet transactions.

### BTC Transaction Analysis

Analyzes transactions for BTC bridge wallet addresses (x.libre contract):

```bash
# Full audit on mainnet
node crosslink-audit-btc-transactions.js

# Full audit on testnet
node crosslink-audit-btc-transactions.js testnet

# Test mode (first 5 addresses) on mainnet
node crosslink-audit-btc-transactions.js testnet 5

# Test with specific wallet address
node crosslink-audit-btc-transactions.js --address=bc1qqxll86lflpq7hnhrjrv96hjjemeswvec4932p2
```

### CBTC Transaction Analysis

Analyzes transactions for CBTC bridge wallet addresses (v.libre contract):

```bash
# Full audit on mainnet
node crosslink-audit-cbtc-transactions.js

# Full audit on testnet
node crosslink-audit-cbtc-transactions.js testnet

# Test mode (first 5 addresses) on mainnet
node crosslink-audit-cbtc-transactions.js testnet 5

# Test with specific wallet address
node crosslink-audit-cbtc-transactions.js --address=bc1qqxll86lflpq7hnhrjrv96hjjemeswvec4932p2
```

### Transaction Analysis Output

The scripts provide detailed reports including:

- **Progress tracking**: Shows which addresses are being processed
- **Transaction counts**: Number of transactions found per address
- **Multiple outputs detection**: Real-time alerts when found
- **Detailed report**: Timestamp, block number, transaction hash, wallet address, BTC amount, output index, and Libre account name

Example output:
```
Processing address 1/344: bc1qqxll86lflpq7hnhrjrv96hjjemeswvec4932p2 (account1)
  Found 3 transaction(s)

  *** FOUND MULTIPLE OUTPUTS ***
  Transaction: 81a80daf22d39862b6bd5d60fab4bf9f2e123d47194048b416d53ec81a822955
  Block: 895067, Time: 2024-01-15T10:30:45.000Z
  Outputs to bc1qqxll86lflpq7hnhrjrv96hjjemeswvec4932p2: 2
    Output 0: 0.00320051 BTC
    Output 1: 0.00026253 BTC
  Total outputs found for this address: 2
```

## Running the Account Balance Checker

The account balance checker is a utility script that checks Bitcoin balances for a list of Libre accounts. To use it:

1. Create a text file with one Libre account name per line
2. Run the script:
```bash
node account-balance-checker.js <input_file> <output_file>
```

The script will generate a CSV file containing:
- Account names
- Associated Bitcoin addresses (or "none" if not found)
- Current Bitcoin balances

## Fetching All Accounts

To download a list of all accounts from the x.libre contract:

1. Make the script executable:
```bash
chmod +x fetch-accounts.sh
```

2. Run the script:
- For mainnet (default):
```bash
./fetch-accounts.sh
```
- For testnet:
```bash
./fetch-accounts.sh testnet
```

The script will create an `accounts.txt` file containing all account names, one per line.

Requirements:
- `curl` for making HTTP requests
- `jq` for JSON processing

# Recent Changes

- Updated environment variable names for clarity and consistency.
- Fixed the Alchemy API URL construction in the USDT audit script.
- Rounded totals in the USDT audit report to 6 decimal places (Match USDT precision).
- Corrected the API URL configuration in the CBTC audit script.
- Removed unused BTC bridge contract accounts from the `.env` files.
- Added new account-balance-checker.js utility script for checking Bitcoin balances of Libre accounts.
- Added fetch-accounts.sh script to download all accounts from the x.libre contract.
- Added transaction analysis scripts for detecting multiple outputs to the same address in BTC and CBTC bridge transactions.
- Enhanced transaction analysis with real-time detection and detailed reporting capabilities.
