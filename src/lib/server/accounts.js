// @ts-nocheck
const MAX_MINOR = Number.MAX_SAFE_INTEGER;

/** @param {unknown} value */
export function validateAccountName(value) {
  if (typeof value !== 'string') return 'name must be a string';
  if (!value.trim()) return 'name is required';
  if (value.trim().length > 200) return 'name must be 200 characters or fewer';
  return null;
}

/** Parse a decimal monetary value without floating-point arithmetic. */
/** @param {unknown} value */
export function parseOpeningBalance(value) {
  if (value === undefined || value === null || value === '') return { minor: 0 };
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || !/^-?\d+(?:\.\d{1,2})?$/.test(text.trim())) {
    return { error: 'openingBalance must be a valid monetary amount with at most 2 decimal places' };
  }
  const match = text.trim().match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return { error: 'openingBalance must be a valid monetary amount with at most 2 decimal places' };
  const whole = Number(match[2]);
  const fraction = Number((match[3] || '').padEnd(2, '0'));
  const minor = (match[1] === '-' ? -1 : 1) * (whole * 100 + fraction);
  if (!Number.isSafeInteger(minor) || Math.abs(minor) > MAX_MINOR) {
    return { error: 'openingBalance is outside the supported monetary range' };
  }
  return { minor };
}

/** @param {Record<string, any>} row */
export function accountFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    openingBalanceMinor: row.opening_balance_minor,
    createdAt: row.created_at
  };
}
