-- Migration 0001: Initial Schema Setup for Ayzoh Enji Trading Journal (Cloud Sync Edition)
-- To be executed manually in the Supabase Online SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  broker_or_firm TEXT NOT NULL DEFAULT '',
  account_type TEXT NOT NULL DEFAULT 'Personal',
  currency TEXT NOT NULL DEFAULT '$',
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  default_risk_percent NUMERIC NOT NULL DEFAULT 1.0,
  daily_loss_limit_percent NUMERIC DEFAULT 0,
  max_drawdown_percent NUMERIC DEFAULT 0,
  trading_style TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  notes TEXT DEFAULT '',
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SETUPS TABLE
CREATE TABLE IF NOT EXISTS setups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  market TEXT DEFAULT '',
  instrument TEXT DEFAULT '',
  timeframes TEXT[] NOT NULL DEFAULT '{}',
  sessions TEXT[] NOT NULL DEFAULT '{}',
  direction TEXT NOT NULL DEFAULT 'Both',
  entry_model TEXT DEFAULT '',
  stop_loss_model TEXT DEFAULT '',
  take_profit_model TEXT DEFAULT '',
  minimum_rr NUMERIC DEFAULT 0,
  default_risk_percent NUMERIC DEFAULT 1.0,
  rules TEXT[] NOT NULL DEFAULT '{}',
  invalid_conditions TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SETUP CHECKLIST ITEMS TABLE
CREATE TABLE IF NOT EXISTS setup_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setup_id UUID NOT NULL REFERENCES setups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  required BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TAGS TABLE
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#64748b'
);

-- 6. TRADES TABLE
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  setup_id UUID REFERENCES setups(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'Long',
  status TEXT NOT NULL DEFAULT 'Draft',
  trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
  trade_time TIME WITHOUT TIME ZONE,
  session TEXT DEFAULT 'London',
  timeframe TEXT DEFAULT '15m',
  market_condition TEXT DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  violations TEXT[] NOT NULL DEFAULT '{}',
  
  -- Planned Execution
  planned_entry NUMERIC,
  planned_stop_loss NUMERIC,
  planned_take_profit NUMERIC,
  planned_risk_percent NUMERIC,
  planned_risk_amount NUMERIC,
  planned_rr NUMERIC,
  planned_position_size NUMERIC,
  planned_point_value NUMERIC,
  planned_contract_size NUMERIC,
  planned_leverage NUMERIC,
  
  -- Actual Execution
  actual_entry NUMERIC,
  actual_exit NUMERIC,
  actual_position_size NUMERIC,
  actual_fees NUMERIC DEFAULT 0,
  actual_commission NUMERIC DEFAULT 0,
  actual_swap NUMERIC DEFAULT 0,
  actual_slippage NUMERIC DEFAULT 0,
  actual_exit_reason TEXT DEFAULT '',
  
  -- Results
  result_status TEXT DEFAULT '',
  result_net_pl NUMERIC DEFAULT 0,
  result_gross_pl NUMERIC DEFAULT 0,
  result_r_multiple NUMERIC DEFAULT 0,
  result_holding_time_minutes INTEGER,
  
  -- Immutable Point-in-Time Checklist Snapshot
  checklist_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Psychology Ratings
  psych_pre_trade_emotion TEXT DEFAULT 'Neutral',
  psych_confidence_rating INTEGER DEFAULT 5,
  psych_focus_rating INTEGER DEFAULT 5,
  psych_stress_rating INTEGER DEFAULT 5,
  psych_patience_rating INTEGER DEFAULT 5,
  psych_energy_rating INTEGER DEFAULT 5,
  psych_post_trade_emotion TEXT,
  
  -- Quality Scores & Generated Column
  quality_setup INTEGER DEFAULT 0,
  quality_execution INTEGER DEFAULT 0,
  quality_risk_management INTEGER DEFAULT 0,
  quality_psychology INTEGER DEFAULT 0,
  quality_discipline INTEGER DEFAULT 0,
  quality_overall NUMERIC GENERATED ALWAYS AS (
    (COALESCE(quality_setup, 0) + COALESCE(quality_execution, 0) + COALESCE(quality_risk_management, 0) + COALESCE(quality_psychology, 0) + COALESCE(quality_discipline, 0)) / 5.0
  ) STORED,
  
  -- Journal Entry
  journal_thesis TEXT DEFAULT '',
  journal_what_went_well TEXT DEFAULT '',
  journal_what_went_wrong TEXT DEFAULT '',
  journal_followed_plan TEXT DEFAULT 'Yes',
  journal_interfered_during_trade BOOLEAN NOT NULL DEFAULT FALSE,
  journal_moved_stop_loss BOOLEAN NOT NULL DEFAULT FALSE,
  journal_closed_early BOOLEAN NOT NULL DEFAULT FALSE,
  journal_hesitated_on_entry BOOLEAN NOT NULL DEFAULT FALSE,
  journal_revenge_or_overtraded BOOLEAN NOT NULL DEFAULT FALSE,
  journal_lessons_learned TEXT DEFAULT '',
  journal_what_to_do_differently TEXT DEFAULT '',
  
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TRADE EXITS TABLE
CREATE TABLE IF NOT EXISTS trade_exits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  level_name TEXT NOT NULL,
  exit_price NUMERIC NOT NULL,
  size_percent NUMERIC NOT NULL,
  size_quantity NUMERIC,
  realized_pl NUMERIC DEFAULT 0,
  realized_r NUMERIC DEFAULT 0,
  exit_reason TEXT DEFAULT '',
  exit_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TRADE SCREENSHOTS TABLE
CREATE TABLE IF NOT EXISTS trade_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'Other',
  caption TEXT DEFAULT '',
  storage_path TEXT NOT NULL,
  preview_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TRADE TIMELINE EVENTS TABLE
CREATE TABLE IF NOT EXISTS trade_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TRADING DAYS TABLE
CREATE TABLE IF NOT EXISTS trading_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  did_trade BOOLEAN NOT NULL DEFAULT FALSE,
  trade_count INTEGER NOT NULL DEFAULT 0,
  daily_pl NUMERIC NOT NULL DEFAULT 0,
  daily_r NUMERIC NOT NULL DEFAULT 0,
  no_trade_reason TEXT,
  no_trade_notes TEXT,
  emotional_state TEXT,
  energy_rating INTEGER,
  focus_rating INTEGER,
  discipline_score INTEGER,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_day UNIQUE(user_id, day)
);

-- 11. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'Light',
  currency TEXT NOT NULL DEFAULT '$',
  date_format TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  default_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  default_setup_id UUID REFERENCES setups(id) ON DELETE SET NULL,
  default_risk_percent NUMERIC NOT NULL DEFAULT 1.0,
  normal_risk_max_percent NUMERIC DEFAULT 1.5,
  warning_risk_max_percent NUMERIC DEFAULT 3.0,
  critical_risk_max_percent NUMERIC DEFAULT 5.0,
  autosave_interval_ms INTEGER NOT NULL DEFAULT 2000,
  autosave_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  hard_checklist_enforcement BOOLEAN NOT NULL DEFAULT FALSE,
  hard_risk_warnings BOOLEAN NOT NULL DEFAULT TRUE,
  no_trade_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  storage_persisted BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_setups_user_id ON setups(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_setup_id ON trades(setup_id);
CREATE INDEX IF NOT EXISTS idx_trades_trade_date ON trades(trade_date);
CREATE INDEX IF NOT EXISTS idx_trading_days_user_day ON trading_days(user_id, day);

-- POSTGRES TRIGGER: Automatic Account Balance Recalculation on Closed Trades
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

  -- Sum net P&L across all closed non-archived trades for this account
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

DROP TRIGGER IF EXISTS trg_recalculate_account_balance ON trades;
CREATE TRIGGER trg_recalculate_account_balance
AFTER INSERT OR UPDATE OR DELETE ON trades
FOR EACH ROW
EXECUTE FUNCTION update_account_current_balance();

-- DISABLE RLS TO PREVENT SILENT ACCESS BLOCKING
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE setups DISABLE ROW LEVEL SECURITY;
ALTER TABLE setup_checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE trade_exits DISABLE ROW LEVEL SECURITY;
ALTER TABLE trade_screenshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE trade_timeline_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE trading_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
