-- ============================================
-- Шаг 5: Таблица токенов приглашений
-- ============================================

create table public.invite_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  role text not null default 'employee' check (role in ('employee', 'manager', 'admin')),
  full_name text not null check (char_length(full_name) between 2 and 100),
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by uuid not null references public.profiles(id),
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

comment on table public.invite_tokens is 'Токены приглашений — доступ только по инвайту администратора';

-- Индекс для быстрого поиска по токену
create index idx_invite_tokens_token on public.invite_tokens (token);

-- RLS
alter table public.invite_tokens enable row level security;

-- Только admin может видеть все приглашения
create policy "Админ видит все приглашения"
  on public.invite_tokens for select
  to authenticated
  using (public.get_my_role() = 'admin');

-- Только admin может создавать приглашения
create policy "Админ создаёт приглашения"
  on public.invite_tokens for insert
  to authenticated
  with check (public.get_my_role() = 'admin');

-- Обновлять (пометить использованным) может service_role (через серверный клиент)
-- Анонимные пользователи могут читать по токену (для страницы принятия инвайта)
create policy "Анонимный доступ по токену"
  on public.invite_tokens for select
  to anon
  using (
    used_at is null 
    and expires_at > now()
  );
