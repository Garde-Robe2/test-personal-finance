<script>
  export let data;

  const money = (value) => {
    const amount = Number(value);
    return `${amount < 0 ? '-' : ''}$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const date = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
</script>

<svelte:head>
  <title>Overview · Personal Finance</title>
  <meta name="description" content="A local-first overview of your accounts and recent activity" />
</svelte:head>

<main>
  <header class="topbar">
    <div class="brand"><span class="mark" aria-hidden="true">$</span><span>Personal Finance</span></div>
    <div class="runtime"><span class="dot" aria-hidden="true"></span>Local ledger</div>
  </header>

  <section class="welcome">
    <p class="eyebrow">Overview</p>
    <h1>Know where you stand.</h1>
    <p class="intro">A clear view of your accounts and the latest movements in your local ledger.</p>
  </section>

  <section aria-labelledby="accounts-heading">
    <div class="section-heading">
      <div><p class="eyebrow">Your money</p><h2 id="accounts-heading">Accounts</h2></div>
      {#if data.accounts.length}<span class="count">{data.accounts.length} {data.accounts.length === 1 ? 'account' : 'accounts'}</span>{/if}
    </div>
    {#if data.accounts.length}
      <div class="accounts">
        {#each data.accounts as account}
          <article class="account-card">
            <div class="account-icon" aria-hidden="true">{account.name.slice(0, 1).toUpperCase()}</div>
            <div><h3>{account.name}</h3><p>Current balance</p></div>
            <strong class:negative={account.balanceMinor < 0}>{money(account.balanceMinor / 100)}</strong>
          </article>
        {/each}
      </div>
    {:else}
      <div class="empty-card"><div class="empty-icon" aria-hidden="true">＋</div><div><h3>Your accounts will appear here</h3><p>Add an account to start tracking your balance and activity.</p></div></div>
    {/if}
  </section>

  <section class="activity" aria-labelledby="activity-heading">
    <div class="section-heading"><div><p class="eyebrow">The latest</p><h2 id="activity-heading">Recent activity</h2></div></div>
    {#if data.transactions.length}
      <div class="transaction-list">
        {#each data.transactions as transaction}
          <article class="transaction">
            <div class:income={transaction.direction === 'income'} class:expense={transaction.direction === 'expense'} class="direction" aria-label={transaction.direction}>
              {transaction.direction === 'income' ? '↑' : '↓'}
            </div>
            <div class="transaction-main"><h3>{transaction.categoryName}</h3><p>{transaction.accountName} · {date(transaction.date)}</p></div>
            <strong class:income-text={transaction.direction === 'income'} class="amount">{transaction.direction === 'income' ? '+' : '-'}{money(transaction.amountMinor / 100)}</strong>
          </article>
        {/each}
      </div>
    {:else}
      <div class="empty-card"><div class="empty-icon" aria-hidden="true">↗</div><div><h3>No transactions yet</h3><p>Your income and expenses will show up here once you add them.</p></div></div>
    {/if}
  </section>
</main>

<style>
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; background: #f6f4ef; color: #20231f; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  main { max-width: 70rem; margin: auto; padding: 1.5rem clamp(1.25rem, 5vw, 4rem) 5rem; }
  .topbar { align-items: center; border-bottom: 1px solid #dfddd6; display: flex; justify-content: space-between; padding-bottom: 1.25rem; }
  .brand { align-items: center; display: flex; font-size: .95rem; font-weight: 700; gap: .65rem; letter-spacing: -.02em; }
  .mark { align-items: center; background: #2e5138; border-radius: .55rem; color: #fff; display: inline-flex; font-family: Georgia, serif; font-size: 1.15rem; height: 2rem; justify-content: center; width: 2rem; }
  .runtime, .count { color: #697068; font-size: .78rem; font-weight: 600; }
  .runtime { align-items: center; display: flex; gap: .45rem; }
  .dot { background: #5d9b68; border-radius: 50%; height: .5rem; width: .5rem; }
  .welcome { padding: clamp(3.5rem, 9vw, 7rem) 0 4rem; }
  .eyebrow { color: #5a755f; font-size: .72rem; font-weight: 800; letter-spacing: .14em; margin: 0 0 .65rem; text-transform: uppercase; }
  h1, h2, h3, p { margin-top: 0; }
  h1 { font-family: Georgia, serif; font-size: clamp(2.8rem, 7vw, 5.5rem); font-weight: 400; letter-spacing: -.055em; line-height: .98; margin-bottom: 1.2rem; max-width: 42rem; }
  .intro { color: #697068; font-size: 1.1rem; line-height: 1.6; max-width: 31rem; }
  section { margin-bottom: 4.5rem; }
  .section-heading { align-items: end; display: flex; justify-content: space-between; margin-bottom: 1rem; }
  h2 { font-family: Georgia, serif; font-size: 2rem; font-weight: 400; letter-spacing: -.035em; margin-bottom: 0; }
  .accounts { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); }
  .account-card, .empty-card, .transaction-list { background: #fff; border: 1px solid #e4e2dc; border-radius: .85rem; }
  .account-card { align-items: center; display: grid; gap: 1rem; grid-template-columns: auto 1fr auto; padding: 1.3rem; }
  .account-icon, .empty-icon { align-items: center; background: #e4eee5; border-radius: .65rem; color: #376246; display: flex; font-weight: 800; height: 2.8rem; justify-content: center; width: 2.8rem; }
  h3 { font-size: .95rem; margin-bottom: .3rem; }
  .account-card p, .transaction p, .empty-card p { color: #7b817b; font-size: .78rem; margin-bottom: 0; }
  .account-card strong { font-size: 1.15rem; letter-spacing: -.03em; }
  .negative { color: #a3534e; }
  .empty-card { align-items: center; color: #545b54; display: flex; gap: 1rem; padding: 1.5rem; }
  .empty-icon { font-size: 1.4rem; }
  .empty-card h3 { margin-bottom: .35rem; }
  .transaction-list { overflow: hidden; }
  .transaction { align-items: center; border-bottom: 1px solid #efeee9; display: grid; gap: 1rem; grid-template-columns: auto 1fr auto; padding: 1rem 1.25rem; }
  .transaction:last-child { border-bottom: 0; }
  .direction { align-items: center; border-radius: 50%; display: flex; font-size: 1.2rem; font-weight: 700; height: 2.35rem; justify-content: center; width: 2.35rem; }
  .income { background: #e4f1e6; color: #39734b; }
  .expense { background: #f7e8e4; color: #a3534e; }
  .transaction-main h3 { margin-bottom: .25rem; }
  .amount { font-size: .95rem; }
  .income-text { color: #39734b; }
  @media (max-width: 35rem) { .welcome { padding-bottom: 3rem; } .transaction { padding-left: .8rem; padding-right: .8rem; } .transaction-main p { font-size: .7rem; } }
</style>
