# Development Scripts & Utilities

This folder contains development tools, test scripts, and database utilities for the Fashion Query API. These files are not part of the production application.

## Testing Scripts

### `test-brand-similarity.js`
Tests brand similarity search functionality.
```bash
node scripts/test-brand-similarity.js
```

### `test-brand-integration.js`
Full integration test for brand-related features.
```bash
node scripts/test-brand-integration.js
```

### `test-api.sh`
Shell script for testing API endpoints.
```bash
./scripts/test-api.sh
```

## Database Utilities

### `check_db.js`
Checks database connectivity and table structure.
```bash
node scripts/check_db.js
```

### `check_stores.js` / `check_stores.mjs`
Verifies store data in the database.
```bash
node scripts/check_stores.js
# or
node scripts/check_stores.mjs
```

### `check-function.js`
Checks Postgres RPC functions.
```bash
node scripts/check-function.js
```

## Setup & Migration Scripts

### `setup-rpc.js`
Sets up Postgres RPC functions for vector similarity search.
```bash
node scripts/setup-rpc.js
```

### `create-rpc.js`
Creates specific RPC functions in the database.
```bash
node scripts/create-rpc.js
```

### `execute_sql.py`
Python utility for executing SQL commands against the database.
```bash
python scripts/execute_sql.py
```

## Usage

All scripts should be run from the `fashion_query_api` root directory:

```bash
# Example
cd fashion_query_api
node scripts/test-brand-similarity.js
```

## Notes

- These scripts require `.env.local` to be configured with database credentials
- They are for development and testing only
- Not included in production builds
- Safe to modify for debugging purposes
