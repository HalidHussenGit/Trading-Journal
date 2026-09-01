-- Add lot_size columns to trades table

ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS planned_lot_size numeric;

ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS actual_lot_size numeric;
