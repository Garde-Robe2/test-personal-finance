// @ts-nocheck
import { json } from '@sveltejs/kit';
import { openDatabase } from '$lib/server/db.js';
import { accountFromRow, parseOpeningBalance, validateAccountName } from '$lib/server/accounts.js';

/** @param {string} message */
function validationError(message) {
  return json({ error: message }, { status: 400 });
}

/** @param {{id: string}} params */
function getId(params) {
  return /^\d+$/.test(params.id) ? Number(params.id) : null;
}

export function GET({ params }) {
  const id = getId(params);
  if (id === null) return json({ error: 'invalid account id' }, { status: 400 });
  const db = openDatabase();
  try {
    const row = db.prepare(`
      SELECT a.id, a.name, a.opening_balance_minor, a.created_at,
        a.opening_balance_minor + COALESCE(SUM(CASE WHEN t.direction = 'income' THEN t.amount_minor ELSE -t.amount_minor END), 0) AS balance_minor
      FROM accounts a LEFT JOIN transactions t ON t.account_id = a.id
      WHERE a.id = ? GROUP BY a.id
    `).get(id);
    return row ? json(accountFromRow(row)) : json({ error: 'account not found' }, { status: 404 });
  } finally { db.close(); }
}

async function updateAccount(params, request) {
  const id = getId(params);
  if (id === null) return json({ error: 'invalid account id' }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { return validationError('request body must be valid JSON'); }
  const nameError = validateAccountName(body?.name);
  if (nameError) return validationError(nameError);
  const balance = parseOpeningBalance(body?.openingBalance ?? body?.opening_balance);
  if (balance.error) return validationError(balance.error);

  const db = openDatabase();
  try {
    const result = db.prepare('UPDATE accounts SET name = ?, opening_balance_minor = ? WHERE id = ?').run(body.name.trim(), balance.minor ?? 0, id);
    if (!result.changes) return json({ error: 'account not found' }, { status: 404 });
    const row = db.prepare(`
      SELECT a.id, a.name, a.opening_balance_minor, a.created_at,
        a.opening_balance_minor + COALESCE(SUM(CASE WHEN t.direction = 'income' THEN t.amount_minor ELSE -t.amount_minor END), 0) AS balance_minor
      FROM accounts a LEFT JOIN transactions t ON t.account_id = a.id
      WHERE a.id = ? GROUP BY a.id
    `).get(id);
    return json(accountFromRow(row));
  } finally { db.close(); }
}

export async function PUT({ params, request }) {
  return updateAccount(params, request);
}

export async function PATCH({ params, request }) {
  return updateAccount(params, request);
}

export function DELETE({ params }) {
  const id = getId(params);
  if (id === null) return json({ error: 'invalid account id' }, { status: 400 });
  const db = openDatabase();
  try {
    if (!db.prepare('SELECT 1 FROM accounts WHERE id = ?').get(id)) return json({ error: 'account not found' }, { status: 404 });
    if (db.prepare('SELECT 1 FROM transactions WHERE account_id = ? LIMIT 1').get(id)) {
      return json({ error: 'account is referenced by transactions' }, { status: 409 });
    }
    db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
    return new Response(null, { status: 204 });
  } finally { db.close(); }
}
