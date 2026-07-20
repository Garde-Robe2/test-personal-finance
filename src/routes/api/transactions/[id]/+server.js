// @ts-nocheck
import { json } from '@sveltejs/kit';
import { openDatabase } from '$lib/server/db.js';
import { parseId, parseTransactionAmount, transactionFromRow, validateTransactionDate, TRANSACTION_SELECT } from '$lib/server/transactions.js';
const SELECT = TRANSACTION_SELECT;

function parseMinorAmount(value) {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || !/^\d+$/.test(text) || !Number.isSafeInteger(Number(text)) || Number(text) < 1) {
    return { error: 'amount must be a positive monetary amount with at most 2 decimal places' };
  }
  return { value: Number(text) };
}
function error(message, status = 400) { return json({ error: message }, { status }); }
function idOf(params) { return parseId(params.id, 'transactionId'); }
async function update({ params, request }) {
  const id = idOf(params); if (id.error) return error('invalid transaction id');
  let body; try { body = await request.json(); } catch { return error('request body must be valid JSON'); }
  const account = parseId(body?.accountId ?? body?.account_id, 'accountId');
  const category = parseId(body?.categoryId ?? body?.category_id, 'categoryId');
  const amount = body?.amount !== undefined
    ? parseTransactionAmount(body.amount)
    : parseMinorAmount(body?.amountMinor);
  const date = body?.date ?? body?.occurredOn ?? body?.occurred_on;
  const dateError = validateTransactionDate(date);
  if (account.error) return error(account.error);
  if (category.error) return error(category.error);
  if (amount.error) return error(amount.error);
  if (body?.direction !== 'income' && body?.direction !== 'expense') return error('direction must be income or expense');
  if (dateError) return error(dateError);
  if (body?.memo !== undefined && body.memo !== null && typeof body.memo !== 'string') return error('memo must be a string or null');
  if (typeof body?.memo === 'string' && body.memo.length > 500) return error('memo must be at most 500 characters');
  const db = openDatabase();
  try {
    if (!db.prepare('SELECT 1 FROM transactions WHERE id = ?').get(id.value)) return error('transaction not found', 404);
    if (!db.prepare('SELECT 1 FROM accounts WHERE id = ?').get(account.value)) return error('account not found', 404);
    if (!db.prepare('SELECT 1 FROM categories WHERE id = ?').get(category.value)) return error('category not found', 404);
    db.prepare('UPDATE transactions SET account_id = ?, category_id = ?, amount_minor = ?, direction = ?, occurred_on = ?, memo = ? WHERE id = ?').run(account.value, category.value, amount.value, body.direction, date, body.memo ?? null, id.value);
    const row = db.prepare(`${SELECT} WHERE t.id = ?`).get(id.value);
    return json(transactionFromRow(row));
  } finally { db.close(); }
}
export function GET({ params }) {
  const id = idOf(params); if (id.error) return error('invalid transaction id');
  const db = openDatabase(); try { const row = db.prepare(`${SELECT} WHERE t.id = ?`).get(id.value); return row ? json(transactionFromRow(row)) : error('transaction not found', 404); } finally { db.close(); }
}
export async function PUT(event) { return update(event); }
export async function PATCH(event) { return update(event); }
export function DELETE({ params }) {
  const id = idOf(params); if (id.error) return error('invalid transaction id');
  const db = openDatabase(); try { const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(id.value); return result.changes ? new Response(null, { status: 204 }) : error('transaction not found', 404); } finally { db.close(); }
}
