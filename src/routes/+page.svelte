<svelte:head>
  <title>Personal Finance</title>
  <meta name="description" content="Local-first personal finance ledger" />
</svelte:head>

<main>
  <p class="eyebrow">Local finance</p>
  <h1>Personal Finance</h1>
  <p class="intro">A private, local-first ledger foundation. Your data stays in the SQLite file configured for this development environment.</p>
  <div class="status" role="status">
    <span class="dot" aria-hidden="true"></span>
    SQLite runtime ready
  </div>
</main>

<style>
  :global(body) { margin: 0; background: #f5f2eb; color: #20231f; font-family: system-ui, sans-serif; }
  main { max-width: 42rem; margin: 15vh auto; padding: 2rem; }
  .eyebrow { color: #5e7253; font-size: .8rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  h1 { font-family: Georgia, serif; font-size: clamp(3rem, 10vw, 6rem); font-weight: 400; line-height: .95; margin: 1rem 0 1.5rem; }
  .intro { color: #59605a; font-size: 1.15rem; line-height: 1.6; max-width: 34rem; }
  .status { align-items: center; display: flex; gap: .6rem; margin-top: 2.5rem; font-size: .9rem; font-weight: 600; }
  .dot { background: #5e8b55; border-radius: 50%; height: .65rem; width: .65rem; }
</style>
