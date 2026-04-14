-- ============================================
-- Шаг 2: RLS-политики (Row Level Security)
-- ============================================

-- Включаем RLS на всех таблицах
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.audit_log enable row level security;

-- ============================================
-- Вспомогательная функция: получить роль текущего пользователя
-- ============================================
create or replace function public.get_my_role()
returns text as $$
  select role from public.profiles where id = auth.uid()
$$ language sql security definer stable;

-- ============================================
-- PROFILES
-- ============================================

-- Каждый видит свой профиль
create policy "Пользователь видит свой профиль"
  on public.profiles for select
  using (id = auth.uid());

-- Админ видит все профили
create policy "Админ видит все профили"
  on public.profiles for select
  using (public.get_my_role() = 'admin');

-- Пользователь может обновить своё имя
create policy "Пользователь обновляет свой профиль"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Админ может обновить любой профиль (роль, активность)
create policy "Админ обновляет любой профиль"
  on public.profiles for update
  using (public.get_my_role() = 'admin');

-- Профиль создаётся автоматически через триггер auth
create policy "Создание профиля через триггер"
  on public.profiles for insert
  with check (id = auth.uid());

-- ============================================
-- CATEGORIES (все читают, никто не создаёт через клиент)
-- ============================================

create policy "Все читают категории"
  on public.categories for select
  using (true);

-- Админ может управлять категориями
create policy "Админ управляет категориями"
  on public.categories for all
  using (public.get_my_role() = 'admin');

-- ============================================
-- PRODUCTS
-- ============================================

-- Сотрудник видит только активные товары
create policy "Сотрудник видит активные товары"
  on public.products for select
  using (
    status = 'active'
    or public.get_my_role() in ('manager', 'admin')
  );

-- Менеджер и админ создают товары
create policy "Менеджер/админ создаёт товары"
  on public.products for insert
  with check (public.get_my_role() in ('manager', 'admin'));

-- Менеджер и админ обновляют товары
create policy "Менеджер/админ обновляет товары"
  on public.products for update
  using (public.get_my_role() in ('manager', 'admin'));

-- Только админ может удалять (хотя мы используем soft delete)
create policy "Админ удаляет товары"
  on public.products for delete
  using (public.get_my_role() = 'admin');

-- ============================================
-- PRODUCT_IMAGES
-- ============================================

create policy "Все видят изображения"
  on public.product_images for select
  using (true);

create policy "Менеджер/админ управляет изображениями"
  on public.product_images for all
  using (public.get_my_role() in ('manager', 'admin'));

-- ============================================
-- AUDIT_LOG — INSERT-only, без UPDATE/DELETE!
-- ============================================

-- Запись логов — только авторизованный пользователь от своего имени
create policy "Запись логов"
  on public.audit_log for insert
  with check (user_id = auth.uid());

-- Менеджер видит только свои логи
create policy "Менеджер видит свои логи"
  on public.audit_log for select
  using (
    user_id = auth.uid()
    or public.get_my_role() = 'admin'
  );

-- ЯВНЫЙ ЗАПРЕТ: никто не может обновлять или удалять логи
-- (RLS по умолчанию deny, так что отсутствие политик = запрет)
-- Дополнительно отзываем права:
revoke update, delete on public.audit_log from authenticated;
