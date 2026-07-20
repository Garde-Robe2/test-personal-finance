// @ts-nocheck
import { json } from '@sveltejs/kit';
import { categoryFromRow, openDatabase, parseCategoryName } from '$lib/server/categories.js';

export function GET() {
  const db = openDatabase();
  try {
    const rows = db.prepare('SELECT id, name, created_at FROM categories ORDER BY id').all();
    return json(rows.map(categoryFromRow));
  } finally {
    db.close();
  }
}

export async function POST({ request }) {
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
    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(parsed.name);
    const row = db.prepare('SELECT id, name, created_at FROM categories WHERE id = ?').get(result.lastInsertRowid);
    return json(categoryFromRow(row), { status: 201 });
  } finally {
    db.close();
  }
}
