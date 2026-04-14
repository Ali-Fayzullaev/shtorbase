-- ============================================
-- Шаг 8: Настройки приложения + открытая регистрация
-- ============================================

create table public.app_settings (
  key text primary key,
  value jsonb not null default 'false'::jsonb,
  updated_at timestamptz not null default now()
);

-- Начальные настройки
insert into public.app_settings (key, value) values
  ('allow_registration', 'false'::jsonb);

-- RLS
alter table public.app_settings enable row level security;

-- Все могут читать настройки (нужно для страницы регистрации)
create policy "Все читают настройки"
  on public.app_settings for select
  using (true);

-- Только admin обновляет
create policy "Админ обновляет настройки"
  on public.app_settings for update
  using (public.get_my_role() = 'admin');
