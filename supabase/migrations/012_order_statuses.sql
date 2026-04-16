-- ============================================
-- Шаг 12: Кастомные статусы заказов
-- ============================================

-- 1. Таблица статусов заказов
create table if not exists public.order_statuses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  color text not null default 'bg-slate-50 text-slate-600 border-slate-200',
  dot_color text not null default 'bg-slate-400',
  sort_order int not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.order_statuses enable row level security;

drop policy if exists "order_statuses_select" on public.order_statuses;
create policy "order_statuses_select" on public.order_statuses for select using (true);

drop policy if exists "order_statuses_all" on public.order_statuses;
create policy "order_statuses_all" on public.order_statuses for all using (true) with check (true);

-- 2. Дефолтные статусы
insert into public.order_statuses (slug, label, color, dot_color, sort_order, is_default) values
  ('new', 'Новый', 'bg-blue-50 text-blue-700 border-blue-200', 'bg-blue-500', 1, true),
  ('in_progress', 'В работе', 'bg-amber-50 text-amber-700 border-amber-200', 'bg-amber-500', 2, true),
  ('ready', 'Готов', 'bg-emerald-50 text-emerald-700 border-emerald-200', 'bg-emerald-500', 3, true),
  ('delivered', 'Выдан', 'bg-slate-100 text-slate-600 border-slate-200', 'bg-slate-400', 4, true),
  ('cancelled', 'Отменён', 'bg-red-50 text-red-600 border-red-200', 'bg-red-500', 5, true)
on conflict (slug) do nothing;

-- 3. Убрать CHECK constraint со столбца status в orders
-- PostgreSQL автоименует check constraint как {table}_{column}_check
alter table public.orders drop constraint if exists orders_status_check;
