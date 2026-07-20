// @ts-nocheck
import { json } from '@sveltejs/kit';
import { openDatabase } from '$lib/server/db.js';
import { accountFromRow, parseOpeningBalance, validateAccountName } from '$lib/server/accounts.js';

/** @param {string} message */
function validationError(message) {
  return json({ error: message }, { status: 400 });
}

export function GET() {
  const db = openDatabase();
  try {
    const rows = db.prepare(`
      SELECT a.id, a.name, a.opening_balance_minor, a.created_at,
        a.opening_balance_minor + COALESCE(SUM(CASE WHEN t.direction = 'income' THEN t.amount_minor ELSE -t.amount_minor END), 0) AS balance_minor
      FROM accounts a
      LEFT JOIN transactions t ON t.account_id = a.id
      GROUP BY a.id
      ORDER BY a.id
    `).all();
    return json(rows.map(accountFromRow));
  } finally {
    db.close();
  }
}

export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return validationError('request body must be valid JSON');
  }
  const nameError = validateAccountName(body?.name);
  if (nameError) return validationError(nameError);
  const balance = parseOpeningBalance(body?.openingBalance ?? body?.opening_balance);
  if (balance.error) return validationError(balance.error);

  const db = openDatabase();
  try {
    const result = db.prepare('INSERT INTO accounts (name, opening_balance_minor) VALUES (?, ?)').run(body.name.trim(), balance.minor ?? 0);
    const row = db.prepare('SELECT id, name, opening_balance_minor, created_at FROM accounts WHERE id = ?').get(result.lastInsertRowid);
    return json(accountFromRow(row), { status: 201 });
  } finally {
    db.close();
  }
}
