-- ============================================
-- Шаг 10: Единицы измерения + кастомные поля товаров
-- ============================================

-- 1. Таблица единиц измерения
create table public.units (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 50),
  short_name text not null check (char_length(short_name) between 1 and 10),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Seed дефолтные единицы
insert into public.units (id, name, short_name, sort_order) values
  ('u1000000-0000-0000-0000-000000000001', 'Метр', 'м', 1),
  ('u1000000-0000-0000-0000-000000000002', 'Штука', 'шт', 2);

-- RLS для units
alter table public.units enable row level security;
create policy "units_select" on public.units for select using (true);
create policy "units_all_admin" on public.units for all using (true) with check (true);

-- 2. Кастомные поля товаров (метаданные)
create table public.custom_fields (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  field_type text not null default 'text' check (field_type in ('text', 'number', 'select')),
  options jsonb, -- для select: ["Вариант 1", "Вариант 2"]
  is_required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.custom_fields enable row level security;
create policy "custom_fields_select" on public.custom_fields for select using (true);
create policy "custom_fields_all_admin" on public.custom_fields for all using (true) with check (true);

-- 3. Значения кастомных полей для товаров
create table public.product_custom_values (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  field_id uuid not null references public.custom_fields(id) on delete cascade,
  value text not null,
  unique (product_id, field_id)
);

alter table public.product_custom_values enable row level security;
create policy "pcv_select" on public.product_custom_values for select using (true);
create policy "pcv_all_admin" on public.product_custom_values for all using (true) with check (true);

-- 4. Добавляем phone в profiles
alter table public.profiles add column if not exists phone text check (char_length(phone) <= 20);

-- 5. Меняем constraint на unit в products, чтобы принимать любое текстовое значение
-- (убираем жёсткий check на 'meter'/'piece')
alter table public.products drop constraint if exists products_unit_check;
alter table public.products alter column unit type text;
alter table public.products add constraint products_unit_check check (char_length(unit) between 1 and 50);
