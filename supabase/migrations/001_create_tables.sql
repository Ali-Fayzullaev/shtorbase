-- ============================================
-- Шаг 1: Таблицы
-- ============================================

-- Включаем расширение для полнотекстового поиска (триграммы)
create extension if not exists pg_trgm;

-- ============================================
-- 1. Профили пользователей
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  role text not null default 'employee' check (role in ('employee', 'manager', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Профили пользователей системы';
comment on column public.profiles.role is 'Роль: employee, manager, admin';

-- ============================================
-- 2. Категории
-- ============================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 100),
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.categories is 'Категории товаров';

-- ============================================
-- 3. Товары
-- ============================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (char_length(sku) between 2 and 50),
  name text not null check (char_length(name) between 2 and 200),
  description text check (char_length(description) <= 2000),
  category_id uuid not null references public.categories(id),
  price numeric(12,2) not null check (price > 0),
  unit text not null check (unit in ('meter', 'piece')),
  stock numeric(10,1) not null default 0 check (stock >= 0),
  vat_included boolean not null default true,
  note text check (char_length(note) <= 500),
  status text not null default 'active' check (status in ('active', 'hidden', 'discontinued')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id)
);

comment on table public.products is 'Каталог товаров';
comment on column public.products.unit is 'Единица измерения: meter или piece — нельзя менять после создания';
comment on column public.products.status is 'active, hidden, discontinued';

-- Индексы для быстрого поиска
create index idx_products_sku on public.products(sku);
create index idx_products_name_trgm on public.products using gin (name gin_trgm_ops);
create index idx_products_category on public.products(category_id);
create index idx_products_status on public.products(status);
create index idx_products_unit on public.products(unit);

-- ============================================
-- 4. Изображения товаров
-- ============================================
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.product_images is 'Изображения товаров (Supabase Storage)';

-- ============================================
-- 5. Лог изменений (аудит) — INSERT-only!
-- ============================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  product_id uuid not null references public.products(id),
  field_name text not null,
  old_value text,
  new_value text not null,
  comment text check (char_length(comment) <= 500),
  action text not null check (action in ('create', 'update', 'delete')),
  created_at timestamptz not null default now()
);

comment on table public.audit_log is 'Неизменяемый лог всех изменений товаров';

-- Индексы для фильтрации логов
create index idx_audit_product on public.audit_log(product_id);
create index idx_audit_user on public.audit_log(user_id);
create index idx_audit_created on public.audit_log(created_at desc);

-- ============================================
-- Функция автообновления updated_at
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();
