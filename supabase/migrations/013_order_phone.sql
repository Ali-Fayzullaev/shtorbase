-- Add contact phone directly to orders
ALTER TABLE public.orders ADD COLUMN phone text;
