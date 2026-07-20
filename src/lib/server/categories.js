// @ts-nocheck
import { openDatabase } from './db.js';

export { openDatabase };

/** @param {unknown} value */
export function validateCategoryName(value) {
  if (typeof value !== 'string') return 'name must be a string';
  const name = value.trim();
  if (!name) return 'name is required';
  if (name.length > 100) return 'name must be 100 characters or fewer';
  if ([...name].some((character) => character.charCodeAt(0) < 32)) return 'name contains invalid characters';
  return null;
}

/** @param {any} row */
export function categoryFromRow(row) {
  return { id: Number(row.id), name: row.name, createdAt: row.created_at };
}

/** @param {unknown} body */
export function parseCategoryName(/** @type {any} */ body) {
  const error = validateCategoryName(body?.name);
  if (error) return { error };
  return { name: body.name.trim() };
}
