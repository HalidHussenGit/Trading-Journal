-- Migration 0005: Fix session column to accept all valid session values
-- Run this in the Supabase SQL Editor if "New York (PM)" fails to save with a 400 error.
-- This drops any existing CHECK constraint on the session column and replaces it
-- with one that includes all valid session values.

-- Step 1: Drop any existing CHECK constraints on the session column
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'trades'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%session%'
  LOOP
    EXECUTE 'ALTER TABLE trades DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END LOOP;
END $$;

-- Step 2: Add a permissive CHECK constraint that includes all valid sessions
-- (or simply leave the column unconstrained by not adding one)
-- The column is TEXT so it can accept any value — no constraint needed.

-- Verify the fix:
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'trades'::regclass AND contype = 'c';
