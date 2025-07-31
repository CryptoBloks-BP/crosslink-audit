# Account Fetching Scripts

## fetch-accounts.sh

This script fetches **all** accounts from a specified Libre contract, retrieves their associated Bitcoin addresses, and looks up the current BTC balance for each address. Results are saved in CSV format.

**Note**: This script processes ALL accounts, which could be hundreds or thousands. Use the limited version for testing or partial runs.

### Usage

```bash
./fetch-accounts.sh [network] [contract]
```

### Parameters

- `network`: `mainnet` (default) or `testnet`
- `contract`: `x.libre` (default) or `v.libre`

### Examples

```bash
# Fetch all accounts from x.libre on mainnet (default)
./fetch-accounts.sh

# Fetch all accounts from v.libre on mainnet
./fetch-accounts.sh mainnet v.libre

# Fetch all accounts from x.libre on testnet
./fetch-accounts.sh testnet x.libre

# Fetch all accounts from v.libre on testnet
./fetch-accounts.sh testnet v.libre
```

### Output

The script creates a CSV file named `{contract}_{network}_accounts_with_balances.csv` containing:

- Account name
- Bitcoin address (or "none" if not found)
- Current BTC balance

### Features

- **Error Handling**: Gracefully handles API errors and invalid responses
- **Rate Limiting**: Includes delays to avoid overwhelming the mempool.space API
- **Progress Tracking**: Shows progress as accounts are processed
- **Flexible Output**: Different output files for different contracts/networks
- **Validation**: Validates contract and network parameters

### Requirements

- `curl` for making HTTP requests
- `jq` for JSON processing
- `bc` for floating-point arithmetic

## fetch-accounts-limited.sh

A version of the script that allows you to limit the number of accounts processed. Useful for testing or when you only want to process a subset of accounts.

### Usage

```bash
./fetch-accounts-limited.sh [network] [contract] [limit]
```

### Parameters

- `network`: `mainnet` (default) or `testnet`
- `contract`: `x.libre` (default) or `v.libre`
- `limit`: maximum number of accounts to process (default: 1000)

### Examples

```bash
# Process first 10 accounts from x.libre on mainnet
./fetch-accounts-limited.sh mainnet x.libre 10

# Process first 50 accounts from v.libre on testnet
./fetch-accounts-limited.sh testnet v.libre 50

# Process first 1000 accounts (default limit)
./fetch-accounts-limited.sh mainnet x.libre
```

### Output

Creates `{contract}_{network}_accounts_with_balances_limited.csv` with the same format as the main script.

## test-fetch-accounts.sh

A test version of the script that only processes the first 5 accounts for quick testing and validation.

### Usage

```bash
./test-fetch-accounts.sh [network] [contract]
```

Same parameters as the main script, but processes only 5 accounts for testing purposes.

### Output

Creates `test_accounts_with_balances.csv` with the same format as the main script.

## Which Script to Use?

- **test-fetch-accounts.sh**: For quick testing (5 accounts)
- **fetch-accounts-limited.sh**: For testing or partial runs (customizable limit)
- **fetch-accounts.sh**: For full production runs (all accounts)
