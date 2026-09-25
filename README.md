# Six Palms ($PALMS)

A memecoin site where creator fees fund a public treasury that buys GTA 6 copies
to raffle among holders. Next.js 15 + Tailwind CSS, deployable to Vercel.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional — without it the site runs on DEMO DATA
npm run dev                  # http://localhost:3000
```

## Going live

1. Fill in `.env.local` (or Vercel environment variables):
   - `NEXT_PUBLIC_TOKEN_MINT` — the token mint
   - `NEXT_PUBLIC_TREASURY_WALLET` — the treasury wallet
   - `SOLANA_RPC_URL` — a Helius URL is recommended (the public RPC rate-limits
     and blocks the holder-count query, which then shows "—")
2. Edit `src/config.ts` for name, ticker, social links, game price, minimum
   holding and draw cadence.
3. Add Upstash Redis (Vercel → Storage → Marketplace → Upstash Redis) and set
   `ADMIN_TOKEN` and `CRON_SECRET` (random strings, 16+ chars).

## Points & redemptions

- $10 held for a full day = 1 point; 1,000 points = one copy (PS5 or Xbox).
  All numbers live in `points` in `src/config.ts`.
- `vercel.json` runs `/api/cron/snapshot` daily at 00:00 UTC. A wallet earns on
  the lower of its balance at two consecutive snapshots, at the lower of the two
  prices. The first snapshot only records balances.
- Holders redeem at `/redeem` by signing a message (no transaction). Points are
  deducted atomically and the request joins the queue.
- Fulfil at `/admin`: buy the code, pay from the treasury, paste the tx
  signature, mark fulfilled, email the code. "Reject" refunds the points.

Demo data is shown per source: treasury sections go live once the treasury
wallet is set, token sections (holders, eligibility) once the mint is set. Every
demo surface carries a **DEMO DATA** badge and never links to a real tx.

## Deploy to Vercel

Push to GitHub → "New Project" on Vercel → import → add the env vars → Deploy.
No extra config needed.

## Accent colour

Change `--accent-1` / `--accent-2` in `src/app/globals.css` (options listed there).

## Structure

- `src/app/page.tsx` — home (hero, treasury, winners, eligibility, how it works, FAQ)
- `src/app/treasury` — public ledger
- `src/app/disclosures`, `terms`, `privacy` — legal (templates: get them reviewed)
- `src/app/api/treasury`, `src/app/api/eligibility` — server routes reading Solana
- `src/lib/solana.ts` — all chain reads (cached in memory)
- `src/lib/demo.ts` — deterministic demo data
