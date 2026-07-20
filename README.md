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
