import { openDatabase } from '$lib/server/db.js';
import { accountFromRow } from '$lib/server/accounts.js';
import { transactionFromRow, TRANSACTION_SELECT } from '$lib/server/transactions.js';

/** Load the summary from the same derived reads used by the JSON APIs. */
export function load() {
  const db = openDatabase();
  try {
    const accounts = db.prepare(`
      SELECT a.id, a.name, a.opening_balance_minor, a.created_at,
        a.opening_balance_minor + COALESCE(SUM(CASE WHEN t.direction = 'income' THEN t.amount_minor ELSE -t.amount_minor END), 0) AS balance_minor
      FROM accounts a
      LEFT JOIN transactions t ON t.account_id = a.id
      GROUP BY a.id
      ORDER BY a.id
    `).all().map(accountFromRow);
    const transactions = db.prepare(`${TRANSACTION_SELECT} ORDER BY t.occurred_on DESC, t.id DESC LIMIT 10`)
      .all().map(transactionFromRow);
    return { accounts, transactions };
  } finally {
    db.close();
  }
}
