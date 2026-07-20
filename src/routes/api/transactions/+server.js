// @ts-nocheck
import { json } from '@sveltejs/kit';
import { openDatabase } from '$lib/server/db.js';
import { parseId, parseTransactionAmount, transactionFromRow, validateTransactionDate, TRANSACTION_SELECT } from '$lib/server/transactions.js';

const SELECT = TRANSACTION_SELECT;

function error(message, status = 400) { return json({ error: message }, { status }); }
function parseMinorAmount(value) {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || !/^\d+$/.test(text) || !Number.isSafeInteger(Number(text)) || Number(text) < 1) {
    return { error: 'amount must be a positive monetary amount with at most 2 decimal places' };
  }
  return { value: Number(text) };
}
function readPayload(body) {
  const account = parseId(body?.accountId ?? body?.account_id, 'accountId');
  if (account.error) return { error: account.error };
  const category = parseId(body?.categoryId ?? body?.category_id, 'categoryId');
  if (category.error) return { error: category.error };
  const amount = body?.amount !== undefined
    ? parseTransactionAmount(body.amount)
    : parseMinorAmount(body?.amountMinor);
  if (amount.error) return { error: amount.error };
  if (body?.direction !== 'income' && body?.direction !== 'expense') return { error: 'direction must be income or expense' };
  const date = body?.date ?? body?.occurredOn ?? body?.occurred_on;
  const dateError = validateTransactionDate(date);
  if (dateError) return { error: dateError };
  if (body?.memo !== undefined && body.memo !== null && typeof body.memo !== 'string') return { error: 'memo must be a string or null' };
  if (typeof body?.memo === 'string' && body.memo.length > 500) return { error: 'memo must be at most 500 characters' };
  return { value: { accountId: account.value, categoryId: category.value, amountMinor: amount.value, direction: body.direction, date, memo: body.memo ?? null } };
}
function getRow(db, id) { return db.prepare(`${SELECT} WHERE t.id = ?`).get(id); }
function ensureReferences(db, value) {
  if (!db.prepare('SELECT 1 FROM accounts WHERE id = ?').get(value.accountId)) return 'account not found';
  if (!db.prepare('SELECT 1 FROM categories WHERE id = ?').get(value.categoryId)) return 'category not found';
  return null;
}

export function GET() {
  const db = openDatabase();
  try { return json(db.prepare(`${SELECT} ORDER BY t.occurred_on DESC, t.id DESC`).all().map(transactionFromRow)); }
  finally { db.close(); }
}

export async function POST({ request }) {
  let body; try { body = await request.json(); } catch { return error('request body must be valid JSON'); }
  const payload = readPayload(body); if (payload.error) return error(payload.error);
  const db = openDatabase();
  try {
    const referenceError = ensureReferences(db, payload.value); if (referenceError) return error(referenceError, 404);
    const result = db.prepare('INSERT INTO transactions (account_id, category_id, amount_minor, direction, occurred_on, memo) VALUES (?, ?, ?, ?, ?, ?)').run(payload.value.accountId, payload.value.categoryId, payload.value.amountMinor, payload.value.direction, payload.value.date, payload.value.memo);
    return json(transactionFromRow(getRow(db, result.lastInsertRowid)), { status: 201 });
  } finally { db.close(); }
}

