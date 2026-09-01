-- Migration 0004: Add consistency_rate_percent column to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS consistency_rate_percent NUMERIC DEFAULT 0;
