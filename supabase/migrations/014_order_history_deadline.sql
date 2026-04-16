-- 1. Order history / audit log for status changes
CREATE TABLE IF NOT EXISTS public.order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,        -- 'status_change', 'assigned', 'created', 'deleted'
  old_value text,
  new_value text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_order_history_order ON public.order_history(order_id);

-- 2. Deadline field on orders
ALTER TABLE public.orders ADD COLUMN deadline timestamptz;
