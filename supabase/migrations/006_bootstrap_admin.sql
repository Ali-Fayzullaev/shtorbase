-- ============================================
-- Создание первого администратора (Bootstrap)
-- ============================================
-- 
-- ИНСТРУКЦИЯ:
-- 1. Откройте Supabase Dashboard → Authentication → Users
-- 2. Нажмите "Add user" → "Create new user"
-- 3. Введите email и пароль для админа
-- 4. Поставьте галочку "Auto Confirm User"
-- 5. Скопируйте UUID созданного пользователя
-- 6. Замените <UUID> ниже и выполните этот SQL в SQL Editor
--
-- Или используйте альтернативный способ ниже (автоматический).

-- ============================================
-- Способ 1: Если вы уже создали пользователя вручную
-- ============================================
-- update public.profiles
-- set role = 'admin'
-- where id = '<UUID пользователя>';

-- ============================================
-- Способ 2: Автоматическое создание через Supabase Auth API
-- ============================================
-- Этот скрипт обновляет роль первого зарегистрированного пользователя на admin.
-- Выполните ПОСЛЕ того, как зарегистрируете первого пользователя.

do $$
declare 
  first_user_id uuid;
begin
  -- Берём самого первого пользователя
  select id into first_user_id 
  from public.profiles 
  order by created_at asc 
  limit 1;
  
  if first_user_id is not null then
    update public.profiles 
    set role = 'admin' 
    where id = first_user_id;
    
    raise notice 'Первый администратор установлен: %', first_user_id;
  else
    raise notice 'Нет пользователей в таблице profiles. Сначала создайте пользователя в Authentication.';
  end if;
end $$;
