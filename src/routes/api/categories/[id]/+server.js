// @ts-nocheck
import { json } from '@sveltejs/kit';
import { categoryFromRow, openDatabase, parseCategoryName } from '$lib/server/categories.js';

/** @param {string} value */
function numericId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** @param {import('node:sqlite').DatabaseSync} db @param {number} id */
function findCategory(db, id) {
  return db.prepare('SELECT id, name, created_at FROM categories WHERE id = ?').get(id);
}

export function GET({ params }) {
  const id = numericId(params.id);
  if (!id) return json({ error: 'category id must be a positive integer' }, { status: 400 });

  const db = openDatabase();
  try {
    const row = findCategory(db, id);
    return row ? json(categoryFromRow(row)) : json({ error: 'category not found' }, { status: 404 });
  } finally {
    db.close();
  }
}

export async function PUT({ params, request }) {
  return updateCategory(params, request);
}

export async function PATCH({ params, request }) {
  return updateCategory(params, request);
}

/** @param {{ id: string }} params @param {Request} request */
async function updateCategory(params, request) {
  const id = numericId(params.id);
  if (!id) return json({ error: 'category id must be a positive integer' }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'request body must be valid JSON' }, { status: 400 });
  }
  const parsed = parseCategoryName(body);
  if (parsed.error) return json({ error: parsed.error }, { status: 400 });

  const db = openDatabase();
  try {
    if (!findCategory(db, id)) return json({ error: 'category not found' }, { status: 404 });
    db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(parsed.name, id);
    return json(categoryFromRow(findCategory(db, id)));
  } finally {
    db.close();
  }
}

export function DELETE({ params }) {
  const id = numericId(params.id);
  if (!id) return json({ error: 'category id must be a positive integer' }, { status: 400 });

  const db = openDatabase();
  try {
    if (!findCategory(db, id)) return json({ error: 'category not found' }, { status: 404 });
    if (db.prepare('SELECT 1 FROM transactions WHERE category_id = ? LIMIT 1').get(id)) {
      return json({ error: 'category is referenced by transactions' }, { status: 409 });
    }
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return new Response(null, { status: 204 });
  } finally {
    db.close();
  }
}
