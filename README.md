# crosslink-audit

Audit Libre Crosslink Bridge BTC Balances

# To install

npm install

# To run

You can run the script in these ways:

Full mode on Mainnet: `node crosslink-audit-btc.js`

Test mode on Mainnet with specific quantity: `node crosslink-audit-btc.js 25` (processes first 25 addresses)

Test mode on Mainnet with different quantity: `node crosslink-audit-btc.js 100` (processes first 100 addresses)

Test mode on Signet: `node crosslink-audit-btc.js testnet 25` (processes first 25 addresses on Signet)

If you provide an invalid number (0, negative, or non-numeric), it will run in full mode.

# Changes Made

- Added support for running the script on both Mainnet and Signet testnet.
- Updated API endpoints:
  - Mainnet: `https://mempool.space/api/address/<bitcoin_address>`
  - Signet: `https://mempool.space/signet/api/address/<bitcoin_address>`
- Balance calculation now uses `funded_txo_sum` and `spent_txo_sum` to derive the current balance.
