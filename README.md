# Personal Finance

A local-first SvelteKit application backed by SQLite. The v1 runtime is single-user and localhost-only; no authentication or external services are required. The app rejects non-loopback `Host` headers and cross-site API mutations, and the Vite/dev server binds to `127.0.0.1` only. Do not deploy a public adapter or expose this process beyond loopback.

## Local development

Requirements: Node.js 22 or newer (the runtime uses the built-in `node:sqlite` module).

```sh
npm install

# Optional: choose another SQLite file (defaults to data/personal-finance.sqlite)
export DATABASE_PATH="$PWD/data/dev.sqlite"

npm run dev
```

Open the URL printed by Vite (normally <http://localhost:5173>). The server initializes the configured database and applies pending files in `migrations/` on startup. To run migrations without starting the server, use `npm run db:migrate`.

The generated database is local runtime state and is ignored by git. `DATABASE_PATH` may be absolute or relative to the project directory.

## Verify the local operator workflow

Run the focused end-to-end local verification from the project directory:

```sh
npm run verify:local
```

The command starts the SvelteKit dev server on loopback with a temporary SQLite database, then uses the same HTTP API as the UI to create an account with a `$100.00` opening balance, a category, a `$25.00` income, and a `$10.00` expense. It reads the displayed account balance and verifies the exact ledger calculation:

`$100.00 + $25.00 - $10.00 = $115.00`

It also attempts to delete the transaction-referenced account and category and verifies the HTTP `409` conflict responses and their operator-facing error messages. The temporary database is removed when the command finishes.

For a manual UI check, run `npm run dev`, open the printed localhost URL, create the same records in the Account, Category, and Ledger entry forms, and confirm the account card shows `Current balance` as `$115.00`. Use the Delete buttons after saving a transaction to confirm the red conflict feedback is shown for both the account and category.
