-- Add lot_size columns to trades table

ALTER TABLE public.trades 
ADD COLUMN planned_lot_size numeric;

ALTER TABLE public.trades 
ADD COLUMN actual_lot_size numeric;
