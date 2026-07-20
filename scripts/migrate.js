import { initializeDatabase } from '../src/lib/server/db.js';

initializeDatabase();
console.log(`Database initialized at ${process.env.DATABASE_PATH || 'data/personal-finance.sqlite'}`);
