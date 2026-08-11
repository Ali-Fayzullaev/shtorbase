-- ============================================
-- Security fix: RLS был не включён на notifications и order_history
-- с момента их создания (миграции 014, 015) — обе таблицы были полностью
-- открыты для чтения/записи через anon/authenticated Supabase-клиент,
-- в обход всех проверок в Server Actions (lib/actions/*.ts).
--
-- Приложение всегда обращается к этим таблицам через service-role клиент
-- (createAdminClient(), см. lib/actions/notifications.ts и orders.ts),
-- который RLS не касается — включение RLS ничего не ломает в самом
-- приложении, только закрывает прямой доступ через anon key.
-- ============================================

alter table public.notifications enable row level security;
alter table public.order_history enable row level security;

-- ============================================
-- NOTIFICATIONS — личные уведомления пользователя
-- ============================================

create policy "Пользователь видит свои уведомления"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Админ видит все уведомления"
  on public.notifications for select
  using (public.get_my_role() = 'admin');

create policy "Пользователь отмечает свои уведомления прочитанными"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Insert-политики для authenticated намеренно нет: уведомление создаётся
-- ДЛЯ другого пользователя (например, сотрудник -> менеджеру), то есть
-- user_id заведомо не равен auth.uid() автора события. Вставка идёт только
-- через service-role (createNotification()), который минует RLS.

-- ============================================
-- ORDER_HISTORY — неизменяемый лог действий по заказу, как audit_log
-- ============================================

create policy "Запись истории заказа от своего имени"
  on public.order_history for insert
  with check (user_id = auth.uid());

create policy "Менеджер/админ видят всю историю, сотрудник — свои записи"
  on public.order_history for select
  using (
    user_id = auth.uid()
    or public.get_my_role() in ('manager', 'admin')
  );

-- ЯВНЫЙ ЗАПРЕТ: история заказов неизменяема, как audit_log
-- (RLS по умолчанию deny, так что отсутствие update/delete-политик = запрет)
revoke update, delete on public.order_history from authenticated;
