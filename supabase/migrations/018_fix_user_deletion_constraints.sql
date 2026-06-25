-- Fix FK constraints that block user deletion.
-- Changes created_by / updated_by / user_id to SET NULL on user delete,
-- and removes NOT NULL so deleted-user rows remain intact.

-- ── products.created_by ──────────────────────────────────────────────────────
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_created_by_fkey;
ALTER TABLE public.products ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.products
  ADD CONSTRAINT products_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── products.updated_by ──────────────────────────────────────────────────────
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_updated_by_fkey;
ALTER TABLE public.products ALTER COLUMN updated_by DROP NOT NULL;
ALTER TABLE public.products
  ADD CONSTRAINT products_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── audit_log.user_id ────────────────────────────────────────────────────────
ALTER TABLE public.audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;
ALTER TABLE public.audit_log ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.audit_log
  ADD CONSTRAINT audit_log_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── orders.created_by ────────────────────────────────────────────────────────
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_created_by_fkey;
ALTER TABLE public.orders ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── clients.created_by ───────────────────────────────────────────────────────
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_created_by_fkey;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
