// @ts-nocheck
const MAX_MINOR = Number.MAX_SAFE_INTEGER;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const TRANSACTION_SELECT = `SELECT t.id, t.account_id, a.name AS account_name, t.category_id,
  c.name AS category_name, t.occurred_on, t.direction, t.amount_minor, t.memo, t.created_at
  FROM transactions t JOIN accounts a ON a.id = t.account_id
  JOIN categories c ON c.id = t.category_id`;

export function parseId(value, field) {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || !/^\d+$/.test(text) || Number(text) < 1) {
    return { error: `${field} must reference an existing record` };
  }
  return { value: Number(text) };
}

/** Parse a positive decimal amount exactly into minor units. */
export function parseTransactionAmount(value) {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(text.trim())) {
    return { error: 'amount must be a positive monetary amount with at most 2 decimal places' };
  }
  const match = text.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
  const minor = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
  if (!Number.isSafeInteger(minor) || minor < 1 || minor > MAX_MINOR) {
    return { error: 'amount must be a positive monetary amount within the supported range' };
  }
  return { value: minor };
}

export function validateTransactionDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return 'date must be a valid date in YYYY-MM-DD format';
  const [year, month, day] = value.split('-').map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) {
    return 'date must be a valid date in YYYY-MM-DD format';
  }
  return null;
}

export function transactionFromRow(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    accountName: row.account_name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    date: row.occurred_on,
    occurredOn: row.occurred_on,
    direction: row.direction,
    amountMinor: row.amount_minor,
    amount: `${Math.floor(row.amount_minor / 100)}.${String(row.amount_minor % 100).padStart(2, '0')}`,
    memo: row.memo,
    createdAt: row.created_at
  };
}
