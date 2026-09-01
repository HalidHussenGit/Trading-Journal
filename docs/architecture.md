# Architecture — Ayzoh Enji Trading Journal (Cloud Sync Edition)

Rebuilt from the actual codebase extraction (`types/index.ts`, `database.ts`, `JournalContext.tsx`, `NewTrade.tsx`, `calculations.ts`).

## 0. Note for the coding agent

The project owner is the only one who applies SQL to Supabase, and it's always done by hand in Supabase's online SQL editor (supabase.com) — not the Supabase CLI, not a local Docker setup, not any automated runner. There is no local Supabase instance and no CLI-managed migration flow in this project. When a database change is needed, the coding agent writes a new plain `.sql` migration file and hands it to the owner, who copies its contents into the SQL editor on the Supabase website and runs it manually. The agent should never attempt to execute SQL against Supabase itself, invoke the Supabase CLI, or assume a database change has been applied — its job stops at producing the `.sql` file.

## 1. Overview

Goal: log a trade on your phone, see it on your PC a moment later, with no manual export/import step. Two users only (you + one friend), so scale is a non-issue — this is about correctness, not load.

Supabase becomes the single source of truth. IndexedDB is removed entirely. There is no longer a "local" copy of the data to keep in sync with a "remote" one — this removes conflict-resolution and merge-logic as a problem entirely, at the cost of requiring an internet connection to use the app. That trade-off was chosen deliberately for a two-user personal tool.

## 2. High-level shape

```
Browser (phone)  ──┐
                    ├──►  Supabase project
Browser (PC)     ──┘        ├── Postgres  (accounts, setups, setup_checklist_items,
                             │              trades, trade_exits, trade_screenshots,
                             │              trade_timeline_events, trading_days,
                             │              tags, settings, users)
                             └── Storage bucket: trade-screenshots
```

Both devices run the same static React build and talk directly to the same Supabase project via `supabase-js`. Neither device is "primary."

## 3. File structure

```
├── docs/
│   ├── architecture.md      # this file
│   ├── design.md            # UI/styling rules for this project
│   └── schema.md            # human-readable description of the schema
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql     # each file is a plain, standalone SQL script
│       ├── 0002_disable_rls.sql
│       └── ...                # kept for history
├── dev-server.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── components/
    │   └── auth/
    │       └── LoginPage.tsx  # plain username/password form
    ├── context/
    │   └── JournalContext.tsx
    ├── db/
    │   └── database.ts        # rewritten as a supabase-js wrapper
    ├── pages/
    │   ├── Accounts.tsx
    │   ├── Analytics.tsx
    │   ├── BackupRestore.tsx  # repurposed snapshot downloader
    │   ├── DailyJournal.tsx
    │   ├── Dashboard.tsx
    │   ├── NewTrade.tsx
    │   ├── RiskManagement.tsx
    │   ├── Settings.tsx
    │   ├── Setups.tsx
    │   ├── TradeDetail.tsx
    │   └── Trades.tsx
    ├── utils/
    │   └── calculations.ts    # stays client-side
    └── types/
        └── index.ts
```

## 4. What changes in the existing codebase

| File | Change |
| --- | --- |
| `src/db/database.ts` | Rewritten as a thin wrapper around `supabase-js`. Reassembles flattened Postgres rows & child tables into the exact nested `Trade` TypeScript shape. |
| `src/context/JournalContext.tsx` | Manual balance recalculation removed; enforced by Postgres trigger. Scoped to current authenticated session (`user_id`). |
| `src/pages/BackupRestore.tsx` | Repurposed as a JSON+ZIP snapshot export/restore tool from Supabase. |
| `src/utils/calculations.ts` | Unchanged, stays client-side. |
| `IndexedDB` | Removed once Supabase version is verified working. |
| `Screenshot handling` | Replaced by Supabase Storage bucket `trade-screenshots`. |

## 5. New: Authentication

- Username + password auth against `users` table (`username` + `password_hash`).
- Session stored in `localStorage` (`user_id` + `username`).
- All queries filtered by `user_id = <current session's user_id>`.

## 6. Data flow — App-computed vs. Database-computed

- **Postgres Trigger:** `accounts.current_balance` = `initial_balance + sum(result_net_pl)` over `status = 'Closed'` trades.
- **Postgres Generated Column:** `quality_overall` = `(quality_setup + quality_execution + quality_risk_management + quality_psychology + quality_discipline) / 5.0`.
- **App-computed:** `planned_*`, `actual_*`, `result_*`, and Analytics aggregations (`winRate`, `profitFactor`, `expectancy`, `drawdown`).
- **Immutable Rule:** `trades.checklist_snapshot` is an immutable JSONB point-in-time copy taken at trade creation/edit time.

## 7. Security & Auth Stance
- No OAuth/Email verification.
- Passwords hashed with `bcryptjs`.
- RLS disabled (`ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;`) as queries are filtered by `user_id` at the application layer for this two-user system.

## 8. Environment / Config
- `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## 9. Build Order
1. Write `supabase/migrations/0001_init.sql` & hand to owner.
2. Build `LoginPage.tsx` & session context.
3. Rewrite `database.ts` to use `@supabase/supabase-js`.
4. Update `JournalContext.tsx` to handle async Supabase queries.
5. Repurpose `BackupRestore.tsx`.
6. Prune IndexedDB.
