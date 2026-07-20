import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const port = 4179;
const baseUrl = `http://127.0.0.1:${port}`;
const databaseDirectory = await mkdtemp(join(tmpdir(), 'personal-finance-verify-'));
const databasePath = join(databaseDirectory, 'verification.sqlite');
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'dev', '--host', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, DATABASE_PATH: databasePath },
  stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
server.stdout.on('data', (chunk) => { output += chunk; });
server.stderr.on('data', (chunk) => { output += chunk; });

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { response, body };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const result = await request('/api/accounts');
      if (result.response.ok) return;
    } catch {
      // The dev server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`server did not start\n${output}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function jsonOptions(body) {
  return { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}

try {
  await waitForServer();

  const page = await request('/');
  assert(page.response.ok, 'the application home page did not load');

  const accountResult = await request('/api/accounts', jsonOptions({ name: 'Verification checking', openingBalance: '100.00' }));
  assert(accountResult.response.status === 201, `account creation failed: ${JSON.stringify(accountResult.body)}`);
  const account = accountResult.body;

  const categoryResult = await request('/api/categories', jsonOptions({ name: 'Verification income and expense' }));
  assert(categoryResult.response.status === 201, `category creation failed: ${JSON.stringify(categoryResult.body)}`);
  const category = categoryResult.body;

  const transaction = (direction, amount) => request('/api/transactions', jsonOptions({
    accountId: account.id,
    categoryId: category.id,
    direction,
    amount,
    occurredOn: '2026-07-20',
    memo: 'local workflow verification'
  }));
  const incomeResult = await transaction('income', '25.00');
  assert(incomeResult.response.status === 201, `income creation failed: ${JSON.stringify(incomeResult.body)}`);
  const expenseResult = await transaction('expense', '10.00');
  assert(expenseResult.response.status === 201, `expense creation failed: ${JSON.stringify(expenseResult.body)}`);

  const balanceResult = await request(`/api/accounts/${account.id}`);
  assert(balanceResult.response.ok, `account balance read failed: ${JSON.stringify(balanceResult.body)}`);
  assert(balanceResult.body.balanceMinor === 11500, `expected displayed balance 115.00, got ${balanceResult.body.balance}`);
  assert(balanceResult.body.balance === '115.00', 'balance formatting is not exact');

  const accountDelete = await request(`/api/accounts/${account.id}`, { method: 'DELETE' });
  assert(accountDelete.response.status === 409, `referenced account deletion did not conflict: ${JSON.stringify(accountDelete.body)}`);
  assert(accountDelete.body.error === 'account is referenced by transactions', 'account conflict feedback was not returned');

  const categoryDelete = await request(`/api/categories/${category.id}`, { method: 'DELETE' });
  assert(categoryDelete.response.status === 409, `referenced category deletion did not conflict: ${JSON.stringify(categoryDelete.body)}`);
  assert(categoryDelete.body.error === 'category is referenced by transactions', 'category conflict feedback was not returned');

  console.log('PASS local workflow: account, category, income, expense, derived balance 100.00 + 25.00 - 10.00 = 115.00, and reference-delete conflicts.');
} catch (error) {
  console.error(`FAIL local workflow: ${error.message}`);
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
  await Promise.race([once(server, 'exit'), new Promise((resolve) => setTimeout(resolve, 2000))]);
  await rm(databaseDirectory, { recursive: true, force: true });
}
