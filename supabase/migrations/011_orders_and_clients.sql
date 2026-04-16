-- ============================================
-- Шаг 11: Заказы, клиенты, позиции заказов
-- ============================================

-- 1. Таблица клиентов
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 200),
  phone text check (char_length(phone) <= 20),
  email text,
  address text,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table public.clients enable row level security;
drop policy if exists "clients_select" on public.clients;
create policy "clients_select" on public.clients for select using (true);
drop policy if exists "clients_all_admin" on public.clients;
create policy "clients_all_admin" on public.clients for all using (true) with check (true);

-- 2. Таблица заказов
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number serial,
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'ready', 'delivered', 'cancelled')),
  assigned_to uuid references auth.users(id) on delete set null,
  note text,
  total_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

alter table public.orders enable row level security;
drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders for select using (true);
drop policy if exists "orders_all_admin" on public.orders;
create policy "orders_all_admin" on public.orders for all using (true) with check (true);

-- 3. Позиции заказа
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(10, 2) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  total_price numeric(12, 2) not null generated always as (quantity * unit_price) stored,
  note text,
  created_at timestamptz not null default now()
);

alter table public.order_items enable row level security;
drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items for select using (true);
drop policy if exists "order_items_all_admin" on public.order_items;
create policy "order_items_all_admin" on public.order_items for all using (true) with check (true);

-- 4. Функция обновления total_amount заказа
create or replace function public.update_order_total()
returns trigger as $$
begin
  update public.orders
  set total_amount = coalesce((
    select sum(quantity * unit_price) from public.order_items where order_id = coalesce(new.order_id, old.order_id)
  ), 0),
  updated_at = now()
  where id = coalesce(new.order_id, old.order_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Триггер пересчёта суммы при изменении позиций
drop trigger if exists trg_order_items_total on public.order_items;
create trigger trg_order_items_total
  after insert or update or delete on public.order_items
  for each row execute function public.update_order_total();
