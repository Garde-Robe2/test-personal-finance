<script>
  // @ts-nocheck
  import { onMount } from 'svelte';

  let accounts = [];
  let categories = [];
  let transactions = [];
  let name = '';
  let openingBalance = '0.00';
  let editingAccountId = null;
  let newCategoryName = '';
  let editingCategoryId = null;
  let editingCategoryName = '';
  let form = {
    direction: 'expense',
    amount: '',
    accountId: '',
    categoryId: '',
    occurredOn: new Date().toISOString().slice(0, 10),
    memo: ''
  };
  let editingTxnId = null;
  let error = '';
  let notice = '';
  let loading = true;
  let saving = false;

  const money = (minor) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(minor || 0) / 100);

  async function message(response, fallback) {
    try {
      return (await response.json()).error || fallback;
    } catch {
      return fallback;
    }
  }

  function defaultForm() {
    return {
      direction: 'expense',
      amount: '',
      accountId: accounts[0] ? String(accounts[0].id) : '',
      categoryId: categories[0] ? String(categories[0].id) : '',
      occurredOn: new Date().toISOString().slice(0, 10),
      memo: ''
    };
  }

  async function load() {
    loading = true;
    try {
      const [accountsResponse, categoriesResponse, transactionsResponse] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/categories'),
        fetch('/api/transactions')
      ]);
      if (!accountsResponse.ok) throw Error(await message(accountsResponse, 'Unable to load accounts.'));
      if (!categoriesResponse.ok) throw Error(await message(categoriesResponse, 'Unable to load categories.'));
      if (!transactionsResponse.ok) throw Error(await message(transactionsResponse, 'Unable to load transactions.'));
      accounts = await accountsResponse.json();
      categories = await categoriesResponse.json();
      transactions = await transactionsResponse.json();
      if (!form.accountId && accounts[0]) form.accountId = String(accounts[0].id);
      if (!form.categoryId && categories[0]) form.categoryId = String(categories[0].id);
      error = '';
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function resetAccount() {
    editingAccountId = null;
    name = '';
    openingBalance = '0.00';
  }

  function editAccount(account) {
    editingAccountId = account.id;
    name = account.name;
    openingBalance = (Number(account.openingBalanceMinor) / 100).toFixed(2);
    error = '';
    notice = '';
  }

  async function saveAccount() {
    saving = true;
    error = '';
    notice = '';
    try {
      const response = await fetch(
        editingAccountId === null ? '/api/accounts' : `/api/accounts/${editingAccountId}`,
        {
          method: editingAccountId === null ? 'POST' : 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, openingBalance })
        }
      );
      if (!response.ok) throw Error(await message(response, 'Unable to save account.'));
      notice = editingAccountId === null ? 'Account created.' : 'Account updated.';
      resetAccount();
      await load();
    } catch (e) {
      error = e.message;
    } finally {
      saving = false;
    }
  }

  async function removeAccount(account) {
    if (!window.confirm(`Delete “${account.name}”?`)) return;
    error = '';
    notice = '';
    try {
      const response = await fetch(`/api/accounts/${account.id}`, { method: 'DELETE' });
      if (!response.ok) throw Error(await message(response, 'Unable to delete account.'));
      notice = 'Account deleted.';
      await load();
    } catch (e) {
      error = e.message;
    }
  }

  async function createCategory() {
    saving = true;
    error = '';
    notice = '';
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      if (!response.ok) throw Error(await message(response, 'Unable to create category.'));
      const category = await response.json();
      newCategoryName = '';
      notice = `Category “${category.name}” created.`;
      await load();
    } catch (e) {
      error = e.message;
    } finally {
      saving = false;
    }
  }

  function beginEditCategory(category) {
    editingCategoryId = category.id;
    editingCategoryName = category.name;
    error = '';
    notice = '';
  }

  function cancelEditCategory() {
    editingCategoryId = null;
    editingCategoryName = '';
  }

  async function saveCategory(id) {
    saving = true;
    error = '';
    notice = '';
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: editingCategoryName })
      });
      if (!response.ok) throw Error(await message(response, 'Unable to update category.'));
      const updated = await response.json();
      cancelEditCategory();
      notice = `Category “${updated.name}” updated.`;
      await load();
    } catch (e) {
      error = e.message;
    } finally {
      saving = false;
    }
  }

  async function deleteCategory(category) {
    if (!window.confirm(`Delete “${category.name}”?`)) return;
    error = '';
    notice = '';
    try {
      const response = await fetch(`/api/categories/${category.id}`, { method: 'DELETE' });
      if (!response.ok) throw Error(await message(response, 'Unable to delete category.'));
      notice = `Category “${category.name}” deleted.`;
      await load();
    } catch (e) {
      error = e.message;
    }
  }

  function editTransaction(transaction) {
    editingTxnId = transaction.id;
    form = {
      direction: transaction.direction,
      amount: transaction.amount,
      accountId: String(transaction.accountId),
      categoryId: String(transaction.categoryId),
      occurredOn: transaction.occurredOn,
      memo: transaction.memo || ''
    };
    error = '';
    notice = '';
    document.querySelector('#transaction-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  function resetTransaction() {
    editingTxnId = null;
    form = defaultForm();
  }

  async function saveTransaction() {
    saving = true;
    error = '';
    notice = '';
    try {
      const response = await fetch(
        editingTxnId ? `/api/transactions/${editingTxnId}` : '/api/transactions',
        {
          method: editingTxnId ? 'PUT' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(form)
        }
      );
      if (!response.ok) throw Error(await message(response, 'Unable to save transaction.'));
      notice = editingTxnId ? 'Transaction updated.' : 'Transaction saved.';
      resetTransaction();
      await load();
    } catch (e) {
      error = e.message;
    } finally {
      saving = false;
    }
  }

  async function removeTransaction(id) {
    if (!window.confirm('Delete this transaction?')) return;
    error = '';
    notice = '';
    try {
      const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!response.ok) throw Error(await message(response, 'Unable to delete transaction.'));
      notice = 'Transaction deleted.';
      await load();
    } catch (e) {
      error = e.message;
    }
  }

  onMount(load);
</script>

<svelte:head>
  <title>Personal Finance</title>
  <meta name="description" content="Local accounts, categories, and transaction ledger" />
</svelte:head>

<main>
  <header class="hero">
    <div>
      <p class="eyebrow">Local finance</p>
      <h1>Accounts, categories &amp; transactions</h1>
      <p class="intro">Keep everyday money, labels, and ledger entries in one place. Changes save to your local ledger.</p>
    </div>
    <div class="status" role="status"><span class="dot"></span>SQLite runtime ready</div>
  </header>

  <section class="workspace" aria-label="Account maintenance">
    <form class="card form-card" on:submit|preventDefault={saveAccount}>
      <div class="heading">
        <div>
          <p class="eyebrow">{editingAccountId === null ? 'New account' : 'Edit account'}</p>
          <h2>{editingAccountId === null ? 'Add an account' : 'Update account'}</h2>
        </div>
        {#if editingAccountId !== null}<button class="link" type="button" on:click={resetAccount}>Cancel</button>{/if}
      </div>
      <label for="account-name">Account name</label>
      <input id="account-name" bind:value={name} placeholder="e.g. Main checking" autocomplete="off" required maxlength="200" />
      <label for="opening-balance">Opening balance <span>(optional)</span></label>
      <div class="money"><span>$</span><input id="opening-balance" bind:value={openingBalance} inputmode="decimal" placeholder="0.00" /></div>
      <button class="primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingAccountId === null ? 'Create account' : 'Save changes'}</button>
    </form>

    <section class="card" aria-labelledby="accounts-heading">
      <div class="heading">
        <div><p class="eyebrow">Overview</p><h2 id="accounts-heading">Saved accounts</h2></div>
        <span class="count">{accounts.length}</span>
      </div>
      {#if loading}
        <p class="empty">Loading…</p>
      {:else if accounts.length === 0}
        <p class="empty">No accounts yet.</p>
      {:else}
        <div class="list">
          {#each accounts as account (account.id)}
            <article class="row">
              <div><h3>{account.name}</h3><p>Opening balance</p></div>
              <strong>{money(account.openingBalanceMinor)}</strong>
              <div class="actions">
                <button class="link" type="button" on:click={() => editAccount(account)}>Edit</button>
                <button class="danger" type="button" on:click={() => removeAccount(account)}>Delete</button>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </section>

  <section class="workspace categories" aria-label="Category maintenance">
    <form class="card form-card" on:submit|preventDefault={createCategory}>
      <div class="heading"><div><p class="eyebrow">New category</p><h2>Add a category</h2></div></div>
      <label for="category-name">Name</label>
      <input id="category-name" bind:value={newCategoryName} placeholder="e.g. Groceries" maxlength="100" autocomplete="off" required />
      <button class="primary" type="submit" disabled={saving || !newCategoryName.trim()}>{saving ? 'Saving…' : 'Add category'}</button>
    </form>

    <section class="card" aria-labelledby="categories-heading">
      <div class="heading">
        <div><p class="eyebrow">Labels</p><h2 id="categories-heading">Saved categories</h2></div>
        <span class="count">{categories.length}</span>
      </div>
      {#if loading}
        <p class="empty">Loading…</p>
      {:else if categories.length === 0}
        <p class="empty">No categories yet.</p>
      {:else}
        <div class="list">
          {#each categories as category (category.id)}
            <article class="row">
              {#if editingCategoryId === category.id}
                <form class="inline" on:submit|preventDefault={() => saveCategory(category.id)}>
                  <input bind:value={editingCategoryName} maxlength="100" aria-label="Category name" />
                  <button class="link" type="submit" disabled={saving || !editingCategoryName.trim()}>Save</button>
                  <button class="danger" type="button" on:click={cancelEditCategory}>Cancel</button>
                </form>
              {:else}
                <div><h3>{category.name}</h3></div>
                <div class="actions">
                  <button class="link" type="button" on:click={() => beginEditCategory(category)}>Edit</button>
                  <button class="danger" type="button" on:click={() => deleteCategory(category)}>Delete</button>
                </div>
              {/if}
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </section>

  <section class="ledger" aria-label="Transaction entry and history">
    <form class="card form-card wide" id="transaction-form" on:submit|preventDefault={saveTransaction}>
      <div class="heading">
        <div>
          <p class="eyebrow">Ledger entry</p>
          <h2>{editingTxnId ? 'Edit transaction' : 'Add a transaction'}</h2>
        </div>
        {#if editingTxnId}<button class="link" type="button" on:click={resetTransaction}>Cancel</button>{/if}
      </div>
      <div class="toggle" role="group" aria-label="Transaction direction">
        <label class:active={form.direction === 'expense'}>
          <input type="radio" bind:group={form.direction} value="expense" />Expense
        </label>
        <label class:active={form.direction === 'income'}>
          <input type="radio" bind:group={form.direction} value="income" />Income
        </label>
      </div>
      <div class="fields">
        <label for="txn-amount">Amount</label>
        <input id="txn-amount" required type="number" min="0.01" step="0.01" bind:value={form.amount} placeholder="0.00" />
        <label for="txn-date">Date</label>
        <input id="txn-date" required type="date" bind:value={form.occurredOn} />
        <label for="txn-account">Account</label>
        <select id="txn-account" required bind:value={form.accountId}>
          <option value="" disabled>Select an account</option>
          {#each accounts as account}
            <option value={account.id}>{account.name}</option>
          {/each}
        </select>
        <label for="txn-category">Category</label>
        <select id="txn-category" required bind:value={form.categoryId}>
          <option value="" disabled>Select a category</option>
          {#each categories as category}
            <option value={category.id}>{category.name}</option>
          {/each}
        </select>
        <label for="txn-memo">Memo <span>(optional)</span></label>
        <input id="txn-memo" maxlength="500" bind:value={form.memo} placeholder="Add a note" class="span-2" />
      </div>
      <button
        class="primary"
        type="submit"
        disabled={saving || loading || !accounts.length || !categories.length}
      >
        {saving ? 'Saving…' : editingTxnId ? 'Save changes' : 'Save transaction'}
      </button>
      {#if !loading && (!accounts.length || !categories.length)}
        <p class="empty">Create an account and category first so this entry can be categorized.</p>
      {/if}
    </form>

    <section class="card wide" aria-labelledby="history-heading">
      <div class="heading">
        <div><p class="eyebrow">Activity</p><h2 id="history-heading">History</h2></div>
        <span class="count">{transactions.length}</span>
      </div>
      {#if loading}
        <p class="empty">Loading…</p>
      {:else if transactions.length === 0}
        <p class="empty">No transactions yet.</p>
      {:else}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Direction</th>
                <th>Amount</th>
                <th>Account</th>
                <th>Category</th>
                <th>Memo</th>
                <th><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {#each transactions as transaction (transaction.id)}
                <tr>
                  <td>{transaction.occurredOn}</td>
                  <td><span class:income={transaction.direction === 'income'} class="direction">{transaction.direction}</span></td>
                  <td class:positive={transaction.direction === 'income'} class="amount">
                    {transaction.direction === 'income' ? '+' : '−'}{transaction.amount}
                  </td>
                  <td>{transaction.accountName}</td>
                  <td>{transaction.categoryName}</td>
                  <td>{transaction.memo || '—'}</td>
                  <td class="actions">
                    <button class="link" type="button" on:click={() => editTransaction(transaction)}>Edit</button>
                    <button class="danger" type="button" on:click={() => removeTransaction(transaction.id)}>Delete</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  </section>

  {#if error}<p class="feedback error" role="alert">{error}</p>{/if}
  {#if notice}<p class="feedback success" role="status">{notice}</p>{/if}
</main>

<style>
  :global(body){margin:0;background:#f5f2eb;color:#20231f;font-family:system-ui,sans-serif}
  :global(button),:global(input),:global(select){font:inherit}
  main{max-width:70rem;margin:auto;padding:4rem 2rem 6rem}
  .hero{align-items:end;display:flex;justify-content:space-between;gap:2rem;margin-bottom:3rem}
  .eyebrow{color:#5e7253;font-size:.72rem;font-weight:800;letter-spacing:.14em;margin:0 0 .75rem;text-transform:uppercase}
  h1,h2,h3,p{margin-top:0}
  h1{font-family:Georgia,serif;font-size:clamp(2.8rem,7vw,5rem);font-weight:400;line-height:.95;margin-bottom:1rem}
  h2{font-family:Georgia,serif;font-size:1.65rem;font-weight:400;margin-bottom:0}
  h3{font-size:1rem;margin-bottom:.25rem}
  .intro{color:#626861;font-size:1.05rem;line-height:1.55;max-width:34rem;margin-bottom:0}
  .status{align-items:center;color:#59605a;display:flex;font-size:.82rem;font-weight:650;gap:.55rem}
  .dot{background:#5e8b55;border-radius:50%;height:.55rem;width:.55rem}
  .workspace,.ledger{align-items:start;display:grid;gap:1.5rem;grid-template-columns:minmax(16rem,.8fr) minmax(20rem,1.2fr);margin-bottom:2rem}
  .ledger{grid-template-columns:1fr}
  .card{background:#fffdf9;border:1px solid #e5e1d8;border-radius:1rem;box-shadow:0 1rem 3rem #3a34220b;padding:1.75rem}
  .card.wide{grid-column:1 / -1}
  .heading{align-items:start;display:flex;justify-content:space-between;margin-bottom:1.5rem}
  label{display:block;font-size:.8rem;font-weight:700;margin:1.15rem 0 .45rem}
  label span{color:#8b9089;font-weight:400}
  input,select{background:#faf8f3;border:1px solid #d9d6cc;border-radius:.5rem;box-sizing:border-box;color:#20231f;padding:.8rem .85rem;width:100%}
  .money{align-items:center;background:#faf8f3;border:1px solid #d9d6cc;border-radius:.5rem;display:flex;padding-left:.85rem}
  .money input{border:0;padding-left:.45rem}
  .toggle{display:flex;gap:.5rem;margin:1rem 0}
  .toggle label{border:1px solid #d7d1c5;border-radius:99px;margin:0;padding:.6rem 1rem;cursor:pointer}
  .toggle label.active{background:#314d35;color:white;border-color:#314d35}
  .toggle input{position:absolute;opacity:0;width:1px;height:1px}
  .fields{display:grid;grid-template-columns:1fr 1fr;gap:0 1rem}
  .fields .span-2{grid-column:1 / -1}
  .primary{background:#314d35;border:0;border-radius:.5rem;color:white;cursor:pointer;font-weight:700;margin-top:1.5rem;padding:.85rem 1rem;width:100%}
  .primary:disabled{opacity:.65}
  .link,.danger{background:none;border:0;cursor:pointer;font-size:.82rem;font-weight:700;padding:.25rem}
  .link{color:#486b4b}.danger{color:#a34d42}
  .count{align-items:center;background:#e9eee5;border-radius:2rem;color:#486b4b;display:flex;font-size:.78rem;font-weight:800;height:1.8rem;justify-content:center;min-width:1.8rem}
  .list{border-top:1px solid #e5e1d8}
  .row{align-items:center;border-bottom:1px solid #e5e1d8;display:grid;gap:1rem;grid-template-columns:1fr auto auto;padding:1.1rem 0}
  .row:last-child{border-bottom:0}
  .row p{color:#8b9089;font-size:.76rem;margin-bottom:0}
  .row strong{font-family:Georgia,serif;font-size:1.1rem;font-weight:400}
  .actions{display:flex;gap:.35rem}
  .inline{align-items:center;display:flex;gap:.5rem;grid-column:1 / -1;width:100%}
  .empty{color:#737a72;font-size:.92rem;line-height:1.5;padding:1rem 0 .5rem}
  .feedback{border-radius:.5rem;font-size:.9rem;margin:1.5rem 0 0;padding:.85rem 1rem}
  .error{background:#fbeae7;color:#963f35}.success{background:#e7f1e5;color:#3d6843}
  .table-wrap{overflow-x:auto}
  table{width:100%;border-collapse:collapse}
  th,td{text-align:left;padding:.85rem .5rem;border-bottom:1px solid #e5e1d8;white-space:nowrap}
  th{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:#687069}
  .direction{color:#9b4e34;text-transform:capitalize}
  .direction.income{color:#4d7b4c}
  .amount{font-variant-numeric:tabular-nums;font-weight:700}
  .amount.positive{color:#4d7b4c}
  .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
  @media(max-width:680px){main{padding:2.5rem 1rem 4rem}.hero{align-items:start;flex-direction:column}.workspace{grid-template-columns:1fr}.fields{grid-template-columns:1fr}}
</style>
