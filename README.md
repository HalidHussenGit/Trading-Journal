# Ayzoh Enji Trading Journal (Cloud Sync Edition)

A high-performance, multi-device trading performance and execution journal engineered for discretionary and systematic financial traders (Forex, Indices, Commodities, and Crypto). Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Supabase (PostgreSQL & Object Storage)**.

---

## 1. Project Purpose & Philosophy

### The Problem
Most retail and proprietary firm traders fail not due to a lack of technical analysis, but due to poor execution discipline, lack of risk management consistency, and emotional contamination (e.g., revenge trading, moving stop losses, widening risk). Standard spreadsheet trackers (Excel, Google Sheets) or generic journaling apps suffer from:
1. **Device Friction**: High barrier to logging trades immediately after execution on mobile devices, leading to forgotten trades or inaccurate end-of-day reconstructions.
2. **Outcome Bias**: Over-indexing on dollar P&L rather than process adherence. A bad trade that makes money is still a bad trade; a disciplined trade that hits a stop loss is a good trade.
3. **Complex Sync / Merging Woes**: Offline-only tools (like browser IndexedDB) lead to sync conflicts, corrupted states, and manual export/import friction between desktop setups and mobile phones.
4. **Prop Firm Rule Breaches**: Inability to proactively track account-specific constraints like daily loss limits, maximum drawdown thresholds, and prop firm profit consistency rules (e.g., no single trade exceeding 30%–50% of total profit).

### The Solution: Ayzoh Enji Trading Journal
The Ayzoh Enji Trading Journal was architected to serve as a **single source of truth** across all trader devices (phone, laptop, multi-monitor workstation). 

- **Instant Multi-Device Sync**: Log an execution on your smartphone the moment you enter a position; analyze the chart screenshot, execution quality, and statistics on your desktop workstation moments later.
- **Process Over Outcome**: Enforces an **immutable point-in-time checklist snapshot** at the exact moment of trade entry. Adherence metrics are tracked independently from monetary results.
- **Prop Firm Consistency Guardrails**: Built-in mathematical validation for risk percentage, position sizing, lot sizing, and prop firm profit consistency calculations.
- **Zero-Friction Cloud Persistence**: Cloud-native persistence using PostgreSQL triggers for automatic account balance re-computation, eliminating client-side balance drift.

---

## 2. Completed Features

The application is fully functional and production-ready for daily trading operations. Below is a comprehensive breakdown of completed modules:

### 🔐 1. Custom Authentication & User Session Scoping
- **Lightweight Credential Authentication**: Custom secure login engine utilizing `bcryptjs` for password hashing and verification against a cloud PostgreSQL `users` table.
- **Persistent Sessions**: Client session caching in browser storage (`localStorage`) with instant session re-hydration and auto-routing.
- **Scoped Multi-Tenancy**: Every database transaction (accounts, setups, trades, daily logs, tags, settings) is strictly partitioned by `user_id`.
- **First-Time User Auto-Seeding**: Automatically seeds default application settings and a default primary trading account upon new account registration.
- **Mobile-Friendly Signout**: Dedicated signout controls tailored for desktop sidebars and mobile navigation bars.

---

### 💼 2. Account & Portfolio Management
- **Multi-Account Tracking**: Manage multiple live, funded, prop firm (e.g., FTMO, FundedNext, Apex), or personal demo accounts concurrently.
- **Account Parameter Constraints**:
  - `initial_balance` and auto-recalculated `current_balance`.
  - Base currency selection (`$`, `€`, `£`, `¥`, etc.).
  - Default risk percentage per trade (e.g., 1.0%).
  - Daily loss limit percentage (e.g., 3.0%) and maximum trailing/overall drawdown limits (e.g., 6.0%).
  - Prop firm profit consistency target percentage (e.g., 50%).
- **Automated Balance Recalculation**: Server-enforced PostgreSQL triggers automatically recalculate account current balances whenever trades are inserted, closed, updated, or deleted.

---

### 📋 3. Strategy Playbook & Dynamic Checklists
- **Setup Definition Engine**: Create and refine specific strategies (e.g., *London Breakout*, *HTF Order Block Retest*, *Asia Liquidity Sweep*).
- **Rule Constraints**: Define entry models, stop loss models, take profit models, target instruments, directional bias (Long, Short, or Both), and minimum expected R:R.
- **Multi-Session & Custom Timeframe Support**:
  - Pre-market, Asian, London, New York (AM), New York (PM), and Off-Hours sessions.
  - Multi-timeframe tagging (1m, 5m, 15m, 1h, 4h, Daily, and custom timeframes).
- **Interactive Reorderable Checklist**: Define prerequisite criteria for valid trade executions. Each checklist item can be flagged as **Required** or **Optional** with custom display ordering.

---

### ✍️ 4. 5-Step Guided Trade Entry Wizard (`NewTrade.tsx`)
1. **Step 1: Trade Info & Auto-Session Detection**:
   - Symbol, direction (Long/Short), execution date, and execution time.
   - **Automatic UTC Session Detection**: Dynamically calculates whether the trade falls into Asian, London, New York AM, or New York PM sessions based on UTC-converted local time.
   - Setup linkage and multi-tagging system.
2. **Step 2: Immutable Setup Checklist Audit**:
   - Loads the active strategy's checklist.
   - Computes real-time checklist adherence percentage.
   - **Point-in-Time Snapshotting**: The checked state is serialized into a `checklist_snapshot` JSON column in Postgres. Future modifications to the strategy checklist never alter historical trade audit records.
3. **Step 3: Risk & Position Sizing Calculator**:
   - Direction-aware risk calculation (validates stop-loss placement below entry for Long, and above entry for Short).
   - Live computation of stop distance, reward distance, planned R:R, risk amount ($), and recommended position sizing.
   - Explicit **Lot Size support** for Forex, Indices, and commodities like Gold (`XAUUSD`).
4. **Step 4: Partial Exits & Scale-Out Planning**:
   - Define multi-stage take-profit tiers (TP1, TP2, Runner).
   - Real-time weighted average exit price and weighted realized R computation.
5. **Step 5: Review, Chart Screenshots & Storage**:
   - Trade thesis and execution reasoning notes.
   - Direct screenshot upload to Supabase Storage bucket (`trade-screenshots`) with local preview fallback.
   - Pre-trade psychological ratings (confidence, focus, stress, patience, energy).

---

### ⚡ 5. Rapid Trade Closure Workflow (`CloseTradeModal.tsx`)
- **1-Click Rapid Closure**: Available across the Dashboard, Trade Log, and Calendar views.
- **Outcome Selection**: Classify trades as Win, Loss, Breakeven, Partial Win, or Partial Loss.
- **Direction-Aware Pure Price R-Multiple Formula**:
  $$\text{Planned/Realized R} = \frac{|\text{Exit Price} - \text{Entry Price}|}{|\text{Entry Price} - \text{Stop Loss Price}|}$$
- **Deduction Auditing**: Supports explicit fee, commission, swap, and slippage deductions from gross profit.
- **Post-Trade Reflection**: Qualitative logging for *What went well*, *What went wrong*, and *Lessons learned*.

---

### 📊 6. Interactive Performance Dashboard (`Dashboard.tsx`)
- **Real-Time KPI Strip**:
  - **Net P&L**: Total dollar profit/loss with signal color formatting.
  - **Win Rate**: Mathematical win percentage over closed trades.
  - **Average Risk-to-Reward Ratio**: Realized R:R display.
  - **Checklist Adherence %**: Average system discipline score.
  - **Prop Firm Consistency Tile**: Evaluates largest winning trade against the consistency limit. Displays a definitive `✓ Pass` or `✗ Fail` badge.
- **Draft Trade Notification Banner**: Highlights open or draft trades requiring closure or post-trade reviews.
- **Interactive SVG Equity Curve**: Chronological balance curve tracking account growth with interactive tooltips and direct trade drilldown navigation.
- **Outcome Breakdown & Streak Tracker**:
  - Circular distribution chart of Wins, Losses, Breakevens, and Partials.
  - Consecutive winning streaks and consecutive losing streaks metrics.
- **Daily Net P&L & Net R Bar Chart**: Daily performance distribution.
- **Process vs. Outcome Insights**: Performance breakdown grouped by checklist adherence tiers (90–100%, 80–89%, 70–79%, 60–69%, <60%).

---

### 📅 7. Trading Calendar & Daily Reflections (`DailyJournal.tsx`)
- **Interactive Multi-Year Calendar Grid**:
  - Month/Year selector supporting historical backtesting data down to 2020.
  - Daily performance tiles showing day P&L, closed trade counts, net R, and open draft badges.
  - Monthly summary statistics bar (Trading Days Count, Monthly Net P&L, Monthly Net R).
- **Daily Journaling Modal**:
  - Log days where no trades occurred with structured categorization (*No Valid Setup*, *Market Conditions*, *Rule Discipline*, *Mental Fatigue*).
  - Daily mindset tracking: Energy level, focus rating, and discipline rating.
  - Free-form daily market recap notes.

---

### 📈 8. Advanced Analytics Engine (`Analytics.tsx`)
- **Portfolio Distribution**: Gross wins vs. gross losses, largest winning trade, largest losing trade, average win, average loss.
- **Expectancy Metrics**: Mathematical expectancy in dollars per trade and expectancy in R-multiples.
- **Drawdown Analysis**: Maximum peak-to-trough drawdown amount and percentage; current active drawdown.
- **Setup Performance Matrix**: Tabular breakdown of win rate, average R, total P&L, profit factor, and average adherence across distinct setups.
- **Adherence Buckets Table**: Statistical verification proving the mathematical edge of checklist adherence.

---

### 🛡️ 9. Risk Management Center (`RiskManagement.tsx`)
- **Global Open Risk Status**: Real-time aggregate risk across all open positions.
- **Tiered Risk Banners**:
  - **Safe (Emerald)**: Within normal risk parameters.
  - **Warning (Amber)**: Open risk approaching configured thresholds.
  - **Critical (Rose)**: Exceeding maximum allowed risk exposure.
- **Exposure Breakdowns**: Open risk grouped by individual account, trading symbol, and strategy setup.

---

### 💾 10. Data Backup, Snapshotting & Portability (`BackupRestore.tsx`)
- **Supabase Cloud Export**: One-click full JSON export of all database tables (accounts, setups, trades, exits, screenshots, timeline events, trading days, tags, and settings).
- **Cloud Snapshot Restore**: Re-upload JSON backups to rehydrate or migrate databases.
- **Onboarding Demo Seeder**: 1-click generation of realistic demo accounts, setups, and trades for instant UI and workflow testing.

---

### 📱 11. Responsive Mobile & Desktop Layout
- **Desktop Sidebar Navigation**: Collapsible navigation with active page states and autosave status indicators.
- **Mobile Bottom Tab Bar (`MobileTabBar.tsx`)**: Bottom navigation bar optimized for quick one-handed trade entry on iOS and Android devices.

---

## 3. Technical Architecture

### Architectural Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                                │
│       (Mobile Phone / Tablet / Desktop Laptop / Trading Station)        │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                     React 18 SPA (Vite)                         │   │
│   │                                                                 │   │
│   │   ┌───────────────┐   ┌─────────────────┐   ┌───────────────┐   │   │
│   │   │  UI / Pages   │   │ JournalContext  │   │ calculations  │   │   │
│   │   │  (Tailwind)   │◄─►│ (State Manager) │◄─►│   (Pure Math) │   │   │
│   │   └───────────────┘   └────────┬────────┘   └───────────────┘   │   │
│   │                                │                                │   │
│   │                       ┌────────┴────────┐                       │   │
│   │                       │   database.ts   │                       │   │
│   │                       │ (Supabase Layer)│                       │   │
│   │                       └────────┬────────┘                       │   │
│   └────────────────────────────────┼────────────────────────────────┘   │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │ HTTPS / REST / WebSockets
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     SUPABASE MANAGED CLOUD INFRASTRUCTURE               │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                 PostgreSQL Database (Engine)                    │   │
│   │                                                                 │   │
│   │   ├── users (bcrypt credentials & auth)                         │   │
│   │   ├── accounts (balances, risk parameters)                      │   │
│   │   ├── setups & setup_checklist_items (playbooks & criteria)     │   │
│   │   ├── trades (planned, actual, result, snapshot JSON, psych)    │   │
│   │   ├── trade_exits (partial exits & scaling)                     │   │
│   │   ├── trade_screenshots (metadata & storage references)         │   │
│   │   ├── trade_timeline_events (audit trail)                       │   │
│   │   ├── trading_days (calendar reflections)                       │   │
│   │   └── settings & tags                                           │   │
│   │                                                                 │   │
│   │   [POSTGRES TRIGGER] update_account_current_balance()           │   │
│   │   Auto-recalculates account balance on trade insert/update/del  │   │
│   │                                                                 │   │
│   │   [STORED GENERATED COLUMN] quality_overall                     │   │
│   │   Computed strictly as average of 5 quality sub-scores          │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │              Supabase Storage Bucket (trade-screenshots)        │   │
│   │              High-resolution trade chart screenshot assets      │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Tech Stack Specifications

| Layer | Technology | Rationale & Architectural Choice |
|---|---|---|
| **Frontend Framework** | **React 18** | Functional component hierarchy with strict hooks-based state management. |
| **Language** | **TypeScript 5.7** | Strict type safety across financial calculations, database schemas, and domain models. |
| **Build Tool** | **Vite 6** | Ultra-fast Hot Module Replacement (HMR) and optimized rollup production bundles. |
| **Styling System** | **Tailwind CSS 3.4** | Utility-first styling following high-density trading workstation design rules (slate/emerald/rose/amber palettes, monospace typography for numerical fields). |
| **Backend & Database** | **Supabase (PostgreSQL 15+)** | Single source of truth. ACID-compliant relational schema, server-side triggers, and JSONB document columns. |
| **Object Storage** | **Supabase Storage** | S3-compatible asset store bucket (`trade-screenshots`) for full-resolution chart imagery. |
| **Cryptography** | **bcryptjs** | Client-side password hashing and salt verification without external OAuth or proprietary auth silos. |

---

## 4. Database Schema & Data Modeling

The relational database architecture is defined across migration files in [`supabase/migrations/`](file:///home/phantom/Project/Trading-Journal/supabase/migrations/):

```
supabase/migrations/
├── 0001_init.sql                  # Complete schema: 11 tables, triggers, generated columns, and indexes
├── 0002_disable_rls.sql           # Explicit RLS safety disablement for public anon application client
├── 0003_create_storage_bucket.sql # Bucket initialization for trade-screenshots
├── 0003_storage_policies.sql      # Public anon read/write policies for storage objects
├── 0004_add_consistency_rate.sql  # Adds consistency_rate_percent to accounts table
├── 0004_add_lot_size.sql          # Adds planned_lot_size and actual_lot_size to trades table
└── 0005_fix_session_constraint.sql# Relaxes session text validation for multi-session flexibility
```

### Relational Entity Model

```
               ┌──────────────┐
               │    users     │
               └──────┬───────┘
                      │ 1:N
       ┌──────────────┼──────────────┬──────────────┬──────────────┐
       │              │              │              │              │
       ▼              ▼              ▼              ▼              ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│   accounts   ││    setups    ││ trading_days ││     tags     ││   settings   │
└──────┬───────┘└──────┬───────┘└──────────────┘└──────────────┘└──────────────┘
       │               │
       │ 1:N           │ 1:N
       │               ├──────────────────────────────┐
       │               ▼                              ▼
       │      ┌──────────────────────┐     ┌──────────────────────┐
       │      │ setup_checklist_items│     │        trades        │
       │      └──────────────────────┘     └──────────┬───────────┘
       │                                              │
       └──────────────────────────────────────────────┘
                                                      │ 1:N
                      ┌───────────────────────────────┼───────────────────────────────┐
                      ▼                               ▼                               ▼
             ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
             │   trade_exits   │             │trade_screenshots│             │trade_timeline_  │
             │                 │             │                 │             │     events      │
             └─────────────────┘             └─────────────────┘             └─────────────────┘
```

### Key Database Tables

#### 1. `users`
Lightweight credential storage for multi-tenant isolation.
- `id` (UUID, Primary Key)
- `username` (TEXT, Unique, Normalized lowercase)
- `password_hash` (TEXT, bcrypt hash)
- `created_at` (TIMESTAMPTZ)

#### 2. `accounts`
Financial entities representing broker accounts or prop firm accounts.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → `users.id`)
- `name` (TEXT)
- `broker_or_firm` (TEXT)
- `account_type` (TEXT: `'Personal'` | `'PropFirm'` | `'Funded'` | `'Demo'`)
- `currency` (TEXT, default `'$'`)
- `initial_balance` (NUMERIC)
- `current_balance` (NUMERIC, maintained via trigger)
- `default_risk_percent` (NUMERIC, default `1.0`)
- `daily_loss_limit_percent` (NUMERIC)
- `max_drawdown_percent` (NUMERIC)
- `consistency_rate_percent` (NUMERIC, default `0`)

#### 3. `setups` & `setup_checklist_items`
Trading strategies and their associated pre-flight checks.
- `setups`: `id`, `user_id`, `name`, `description`, `market`, `instrument`, `timeframes[]`, `sessions[]`, `direction`, `entry_model`, `stop_loss_model`, `take_profit_model`, `minimum_rr`, `default_risk_percent`, `rules[]`, `invalid_conditions[]`.
- `setup_checklist_items`: `id`, `setup_id` (FK → `setups.id`), `name`, `description`, `required` (BOOLEAN), `order_index` (INT), `active` (BOOLEAN).

#### 4. `trades`
Central fact table containing planned, actual, and post-trade analytical data.
- **Keys & Identifiers**: `id`, `user_id`, `account_id`, `setup_id`.
- **Classification**: `symbol`, `direction` (`'Long'` | `'Short'`), `status` (`'Draft'` | `'Open'` | `'Closed'`), `trade_date`, `trade_time`, `session`, `timeframe`, `market_condition`, `tags[]`, `violations[]`.
- **Planned Fields**: `planned_entry`, `planned_stop_loss`, `planned_take_profit`, `planned_risk_percent`, `planned_risk_amount`, `planned_rr`, `planned_position_size`, `planned_lot_size`, `planned_point_value`, `planned_contract_size`, `planned_leverage`.
- **Actual Execution Fields**: `actual_entry`, `actual_exit`, `actual_position_size`, `actual_lot_size`, `actual_fees`, `actual_commission`, `actual_swap`, `actual_slippage`, `actual_exit_reason`.
- **Realized Results**: `result_status` (`'Win'` | `'Loss'` | `'Breakeven'` | `'Partial Win'` | `'Partial Loss'`), `result_net_pl`, `result_gross_pl`, `result_r_multiple`, `result_holding_time_minutes`.
- **Snapshot Storage**: `checklist_snapshot` (`JSONB`, holds frozen copy of checklist items and adherence % at execution).
- **Psychology & Quality Ratings**:
  - `psych_pre_trade_emotion`, `psych_confidence_rating` (1–10), `psych_focus_rating`, `psych_stress_rating`, `psych_patience_rating`, `psych_energy_rating`, `psych_post_trade_emotion`.
  - `quality_setup`, `quality_execution`, `quality_risk_management`, `quality_psychology`, `quality_discipline`.
  - `quality_overall`: **Postgres GENERATED ALWAYS column** calculating `(quality_setup + quality_execution + quality_risk_management + quality_psychology + quality_discipline) / 5.0`.
- **Journal Entries**: Qualitative text fields for thesis, what went well, what went wrong, lessons learned, and execution flags (`journal_moved_stop_loss`, `journal_closed_early`, `journal_hesitated_on_entry`, `journal_revenge_or_overtraded`).

#### 5. Child Tables
- `trade_exits`: Multi-exit records (`trade_id`, `level_name`, `exit_price`, `size_percent`, `realized_pl`, `realized_r`, `exit_reason`, `exit_timestamp`).
- `trade_screenshots`: Screenshot metadata (`trade_id`, `category`, `caption`, `storage_path`, `preview_url`, `order_index`).
- `trade_timeline_events`: Audit history events (`trade_id`, `event_type`, `description`, `event_timestamp`).
- `trading_days`: Calendar logs (`user_id`, `day`, `did_trade`, `trade_count`, `daily_pl`, `daily_r`, `no_trade_reason`, `emotional_state`, `discipline_score`, `notes`). Unique on `(user_id, day)`.
- `settings`: Per-user preferences (`user_id`, `theme`, `currency`, `date_format`, `timezone`, default account/setup links, risk threshold warning limits).

---

### Database Triggers & Automation

#### Automated Balance Recalculation Trigger
In distributed multi-device environments, recalculating an account balance on the frontend creates race conditions and state divergence. Ayzoh Enji delegates balance synchronization entirely to PostgreSQL:

```sql
CREATE OR REPLACE FUNCTION update_account_current_balance()
RETURNS TRIGGER AS $$
DECLARE
  target_account_id UUID;
  total_net_pl NUMERIC;
  acc_initial_balance NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_account_id := OLD.account_id;
  ELSE
    target_account_id := NEW.account_id;
  END IF;

  IF target_account_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Sum net P&L across all closed, non-archived trades for this account
  SELECT COALESCE(SUM(result_net_pl), 0)
  INTO total_net_pl
  FROM trades
  WHERE account_id = target_account_id 
    AND status = 'Closed' 
    AND (is_archived IS NOT TRUE);

  -- Fetch account initial balance
  SELECT initial_balance
  INTO acc_initial_balance
  FROM accounts
  WHERE id = target_account_id;

  IF acc_initial_balance IS NOT NULL THEN
    UPDATE accounts
    SET current_balance = acc_initial_balance + total_net_pl,
        updated_at = NOW()
    WHERE id = target_account_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalculate_account_balance
AFTER INSERT OR UPDATE OR DELETE ON trades
FOR EACH ROW
EXECUTE FUNCTION update_account_current_balance();
```

---

## 5. Mathematical & Risk Calculations (`calculations.ts`)

The calculations engine in [`src/utils/calculations.ts`](file:///home/phantom/Project/Trading-Journal/src/utils/calculations.ts) operates as a pure, deterministic utility layer.

### 1. Direction-Aware Risk-to-Reward (R:R)
The application computes R:R strictly using price distance, which is independent of position sizing, account currency, or lot multiplier:

$$\text{Risk Distance} = \begin{cases} \text{Entry} - \text{StopLoss}, & \text{for Long} \\ \text{StopLoss} - \text{Entry}, & \text{for Short} \end{cases}$$

$$\text{Reward Distance} = \begin{cases} \text{TakeProfit} - \text{Entry}, & \text{for Long} \\ \text{Entry} - \text{TakeProfit}, & \text{for Short} \end{cases}$$

$$\text{Planned R:R} = \frac{\text{Reward Distance}}{\text{Risk Distance}}$$

### 2. Position & Lot Sizing
Risk dollar allocation is calculated directly from account equity:

$$\text{Risk Amount (\$) } = \frac{\text{Account Balance} \times \text{Risk \%}}{100}$$

$$\text{Position Size} = \frac{\text{Risk Amount}}{\text{Stop Distance} \times \text{Point Value} \times \text{Contract Size}}$$

### 3. Multi-Exit Weighted Realized R
For partial exits, realized R is calculated as a size-weighted sum across exit tiers:

$$\text{Weighted Realized R} = \frac{\sum \left( R_i \times \text{SizePercent}_i \right)}{\sum \text{SizePercent}_i}$$

### 4. Mathematical Expectancy
Expectancy represents the average expected dollar (or R) return for every dollar (or R) risked:

$$\text{Expectancy (\$) } = \left( \frac{\text{Win Rate}}{100} \times \text{Avg Win \$} \right) - \left( \frac{\text{Loss Rate}}{100} \times \text{Avg Loss \$} \right)$$

$$\text{Expectancy (R)} = \left( \frac{\text{Win Rate}}{100} \times \text{Avg Win R} \right) - \left( \frac{\text{Loss Rate}}{100} \times \text{Avg Loss R} \right)$$

### 5. Prop Firm Profit Consistency Rule
Proprietary trading firms often enforce consistency rules stipulating that no single trading day or single trade may account for more than a set percentage (e.g., $C\% = 50\%$) of total profits:

$$\text{Consistency Limit (\$) } = \frac{C}{100} \times \sum \text{Net P\&L of all closed trades}$$

$$\text{Condition: } \max(\text{Individual Trade P\&L}) \le \text{Consistency Limit}$$

---

## 6. Project Directory Structure

```
.
├── docs/                                # Technical & design documentation
│   ├── architecture.md                  # Comprehensive architectural specification
│   ├── design.md                        # Visual design system & Tailwind styling tokens
│   └── schema.md                        # Database schema reference
├── supabase/
│   └── migrations/                      # Plain SQL migration scripts (run in order)
├── src/
│   ├── main.tsx                         # Application bootstrapper
│   ├── App.tsx                          # Root container, page router, loading states
│   ├── index.css                        # Tailwind directives & custom CSS variables
│   ├── types/
│   │   └── index.ts                     # Core TypeScript domain models & interfaces
│   ├── db/
│   │   ├── supabaseClient.ts            # Supabase JS SDK client instance
│   │   └── database.ts                  # Database abstraction service layer
│   ├── context/
│   │   └── JournalContext.tsx           # Global state manager, autosave, & notifications
│   ├── utils/
│   │   ├── calculations.ts              # Mathematical engine: sizing, R:R, expectancy, metrics
│   │   ├── validation.ts                # Trade input validation logic
│   │   └── zip.ts                       # Snapshot archive export/import utilities
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx            # Sign in & registration modal
│   │   ├── layout/
│   │   │   ├── Header.tsx               # Top header with account badges & title
│   │   │   ├── Sidebar.tsx              # Desktop navigation sidebar
│   │   │   └── MobileTabBar.tsx         # Mobile bottom thumb-navigation bar
│   │   └── common/
│   │       ├── AutosaveBadge.tsx        # Real-time sync status indicator
│   │       ├── Charts.tsx               # Equity curve, daily bar chart, outcome pie chart
│   │       ├── CloseTradeModal.tsx      # 1-click modal for trade resolution & review
│   │       ├── ConfirmDialog.tsx        # Reusable modal confirmation prompt
│   │       ├── LazyImage.tsx            # Optimized image loader with storage key resolution
│   │       ├── LoadingScreen.tsx        # Clean startup & data fetching splash screen
│   │       └── Modal.tsx                # Accessible backdrop modal shell
│   └── pages/
│       ├── Dashboard.tsx                # KPI cards, equity curve, streaks, process insights
│       ├── NewTrade.tsx                 # 5-step guided trade entry wizard
│       ├── Trades.tsx                   # Sortable, filterable ledger of all trades
│       ├── TradeDetail.tsx              # Deep audit view of execution, checklist, & gallery
│       ├── DailyJournal.tsx             # Interactive calendar & daily reflection logs
│       ├── Analytics.tsx                # Setup performance, adherence buckets, expectancy
│       ├── RiskManagement.tsx           # Real-time exposure monitor & threshold banners
│       ├── Accounts.tsx                 # Account configuration & drawdown manager
│       ├── Setups.tsx                   # Playbook strategies & reorderable checklists
│       ├── Settings.tsx                 # Risk parameters, currency, & persistence audits
│       └── BackupRestore.tsx            # Portable JSON cloud export & demo data seeder
├── package.json                         # Dependencies & npm scripts
├── tailwind.config.js                   # Design tokens & color system configuration
├── tsconfig.json                        # TypeScript configuration
├── vercel.json                          # Single Page Application (SPA) routing rewrites
└── vite.config.ts                       # Vite bundler build settings
```

---

## 7. Setup & Development Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- A **Supabase** project (free tier is fully supported)

### 1. Clone the Repository
```bash
git clone https://github.com/HalidHussenGit/Trading-Journal.git
cd Trading-Journal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Supabase Environment Variables
Create a `.env.local` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Apply Database Migrations
Execute the migration scripts located in [`supabase/migrations/`](file:///home/phantom/Project/Trading-Journal/supabase/migrations/) sequentially in your **Supabase Project's Online SQL Editor**:
1. `0001_init.sql` (Creates core tables, foreign keys, triggers, and generated columns)
2. `0002_disable_rls.sql` (Ensures RLS does not silently block the anonymous client)
3. `0003_create_storage_bucket.sql` (Initializes the `trade-screenshots` storage bucket)
4. `0003_storage_policies.sql` (Enables read/write policies for screenshot uploads)
5. `0004_add_consistency_rate.sql` (Adds consistency rate column)
6. `0004_add_lot_size.sql` (Adds lot size columns)
7. `0005_fix_session_constraint.sql` (Relaxes session constraints)

### 5. Launch Development Server
```bash
npm run dev
```
Access the application locally at `http://localhost:5173`.

### 6. Build for Production
```bash
npm run build
```
Generates production-optimized static assets in `dist/`. Suitable for hosting on **Vercel**, **Netlify**, or **Cloudflare Pages** (configured with [`vercel.json`](file:///home/phantom/Project/Trading-Journal/vercel.json) for client-side routing).

---

## 8. License

Private personal trading performance application. All rights reserved.
