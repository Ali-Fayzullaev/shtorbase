# Что менять в Supabase — пошаговый раннер

← [Назад к обзору](./00-overview.md)

## Как этим пользоваться

В проекте нет автоматического применения миграций (нет Supabase CLI/CI) — SQL из `supabase/migrations/*.sql` нужно **вручную** прогонять в Supabase:

1. Открыть [supabase.com/dashboard](https://supabase.com/dashboard) → ваш проект → **SQL Editor**.
2. Нажать **New query**.
3. Вставить SQL нужного шага (ниже) и нажать **Run**.
4. Отметить шаг как выполненный ✅ в этом файле (или просто держать в голове порядок).

**Важно:** прогоняйте SQL шага **до того**, как соответствующий код уйдёт в прод (т.е. до того, как я запушу код, который использует новые поля) — иначе сайт на Netlify сломается на этом экране, потому что будет обращаться к несуществующим колонкам. Я буду явно предупреждать в чате перед каждым пушем, требующим миграции, и указывать номер шага отсюда.

Каждый блок SQL ниже дублируется файлом миграции в `supabase/migrations/0NN_*.sql` — это делается для истории и порядка в репозитории. Файл миграции появится в коде одновременно с реализацией соответствующего шага.

---

## Шаг 1 — Оплата заказа

**Статус: ✅ выполнено** (проверено напрямую в БД 10.08.2026)
**Файл миграции:** `supabase/migrations/019_order_payments.sql`

```sql
alter table public.orders
  add column payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'partial', 'paid')),
  add column paid_amount numeric(12,2) not null default 0
    check (paid_amount >= 0);

create or replace function public.sync_payment_status()
returns trigger as $$
begin
  if new.paid_amount <= 0 then
    new.payment_status := 'unpaid';
  elsif new.paid_amount >= new.total_amount then
    new.payment_status := 'paid';
  else
    new.payment_status := 'partial';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_order_payment_status
  before insert or update of paid_amount, total_amount on public.orders
  for each row execute function public.sync_payment_status();
```

Что это даёт: у каждого заказа появляется отслеживание оплаты. Ничего в текущей работе приложения не ломает — новые колонки со значением по умолчанию `unpaid`/`0`.

---

## Шаг 2 — Индивидуальные параметры позиции заказа

**Статус: ✅ выполнено** (проверено напрямую в БД 10.08.2026)
**Файл миграции:** `supabase/migrations/020_order_item_attributes.sql`

```sql
alter table public.order_items
  add column custom_attributes jsonb not null default '{}'::jsonb;
```

Что это даёт: возможность сохранить размеры/цвет конкретной позиции заказа (например, `{"width_cm": 250, "height_cm": 180, "color": "бордо"}`), не влияя на существующие данные — по умолчанию пустой объект.

---

## Шаг 3 — Самостоятельный приём заказа сотрудником

**Статус: не требуется**

Этот шаг ([02-production.md](./02-production.md)) — только изменение кода (`lib/actions/orders.ts`), схема БД не меняется.

---

## Шаг 4 — Уведомление менеджеру о готовности

**Статус: не требуется**

Только код ([04-notifications.md](./04-notifications.md)), использует уже существующую таблицу `notifications`.

---

## Шаг 5 — Категория для динамических полей товара

**Статус: ✅ выполнено** (проверено напрямую в БД 10.08.2026)
**Файл миграции:** `supabase/migrations/021_custom_fields_category_scope.sql`

```sql
alter table public.custom_fields
  add column category_id uuid references public.categories(id) on delete cascade;
-- null = поле общее для всех категорий (все уже существующие поля продолжат работать как раньше)
```

---

## Шаг 6 — Вариации товара

**Статус: ✅ выполнено** (проверено напрямую в БД 10.08.2026)
**Файл миграции:** `supabase/migrations/022_product_variants.sql`

```sql
alter table public.products
  add column variant_group_id uuid;

create index idx_products_variant_group on public.products(variant_group_id);
```

---

## Шаг 7 — RLS на notifications и order_history (security fix)

**Статус: ✅ выполнено** (применено напрямую в БД 10.08.2026)
**Файл миграции:** `supabase/migrations/023_rls_notifications_order_history.sql`

Не относится к ТЗ v2.0 — это закрытие бреши безопасности, обнаруженной Supabase security advisor: обе таблицы с момента создания (миграции 014, 015) не имели RLS вообще, то есть были полностью открыты на чтение/запись через anon/authenticated Supabase-клиент, в обход Server Actions. Приложение всегда ходит в эти таблицы через service-role клиент (`createAdminClient()`), так что включение RLS ничего не ломает — закрывает только прямой доступ через публичный anon key.

```sql
alter table public.notifications enable row level security;
alter table public.order_history enable row level security;

create policy "Пользователь видит свои уведомления"
  on public.notifications for select using (user_id = auth.uid());
create policy "Админ видит все уведомления"
  on public.notifications for select using (public.get_my_role() = 'admin');
create policy "Пользователь отмечает свои уведомления прочитанными"
  on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Запись истории заказа от своего имени"
  on public.order_history for insert with check (user_id = auth.uid());
create policy "Менеджер/админ видят всю историю, сотрудник — свои записи"
  on public.order_history for select
  using (user_id = auth.uid() or public.get_my_role() in ('manager', 'admin'));

revoke update, delete on public.order_history from authenticated;
```

---

## Шаг 8 — История платежей (долги) + скидка на заказ

**Статус: ⬜ не выполнено**
**Файл миграции:** `supabase/migrations/024_payments_and_discounts.sql`

Раньше `paid_amount` было одним числом, которое менеджер перезаписывал. Теперь это сумма записей в новой таблице `payments` — так поддерживаются частичные оплаты в разное время (клиент занёс половину сейчас, остальное потом) и появляется реальная история для отчётов по выручке. `orders.discount_amount` — скидка на заказ, вычитается при расчёте статуса оплаты.

**Важно:** это самая объёмная миграция из всех — она не просто добавляет колонки, а создаёт таблицу, переносит существующие `paid_amount` в неё (backfill) и пересоздаёт триггер расчёта статуса оплаты. Прогоните её целиком одним запросом, не по частям.

```sql
alter table public.orders
  add column discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

create index idx_payments_order on public.payments(order_id);
create index idx_payments_created_at on public.payments(created_at);

alter table public.payments enable row level security;

create policy "payments_select" on public.payments
  for select using (true);
create policy "payments_insert" on public.payments
  for insert with check (created_by = auth.uid());
create policy "payments_admin_delete" on public.payments
  for delete using (public.get_my_role() = 'admin');

revoke update on public.payments from authenticated;

insert into public.payments (order_id, amount, note, created_at, created_by)
select id, paid_amount, 'Перенесено при переходе на историю платежей', updated_at, created_by
from public.orders
where paid_amount > 0;

create or replace function public.recalc_order_paid_amount()
returns trigger as $$
declare
  target_order uuid;
begin
  target_order := coalesce(new.order_id, old.order_id);
  update public.orders
  set paid_amount = coalesce((select sum(amount) from public.payments where order_id = target_order), 0)
  where id = target_order;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists trg_payments_recalc on public.payments;
create trigger trg_payments_recalc
  after insert or update or delete on public.payments
  for each row execute function public.recalc_order_paid_amount();

create or replace function public.sync_payment_status()
returns trigger as $$
declare
  payable numeric(12,2);
begin
  payable := greatest(new.total_amount - new.discount_amount, 0);
  if new.paid_amount <= 0 then
    new.payment_status := 'unpaid';
  elsif new.paid_amount >= payable then
    new.payment_status := 'paid';
  else
    new.payment_status := 'partial';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_order_payment_status on public.orders;
create trigger trg_order_payment_status
  before insert or update of paid_amount, total_amount, discount_amount on public.orders
  for each row execute function public.sync_payment_status();
```

---

## Шаг 9 — Очистка логов изменений (по запросу пользователя)

**Статус: ⬜ не выполнено**
**Файл миграции:** `supabase/migrations/028_clear_change_logs.sql`

Не связано с новым функционалом — очистка накопленных тестовых записей и старых записей с английскими статусами (до перевода статусов на русский, см. коммит `fix: мгновенное обновление...`). Удаляются только служебные журналы; сами заказы/товары/клиенты/платежи не затрагиваются.

```sql
delete from public.order_history;
delete from public.audit_log;
```

**Необратимо** — история изменений заказов и товаров будет полностью удалена. Новые записи начнут копиться заново с этого момента.

---

## Сводная таблица

| № | Шаг | Таблица | Ломает текущую работу сайта? |
|---|---|---|---|
| 1 | Оплата | `orders` | Нет — новые колонки с дефолтами |
| 2 | Параметры позиции | `order_items` | Нет — новая колонка с дефолтом `{}` |
| 3 | Приём заказа | — | Не требует SQL |
| 4 | Уведомление менеджеру | — | Не требует SQL |
| 5 | Атрибуты по категориям | `custom_fields` | Нет — новая nullable-колонка |
| 6 | Вариации товара | `products` | Нет — новая nullable-колонка |
| 7 | RLS security fix | `notifications`, `order_history` | Нет — приложение ходит через service-role, RLS его не касается |
| 8 | Платежи + скидка | `orders`, `payments` (новая) | Нет для существующих данных (backfill переносит старый `paid_amount`), но код (`addPayment`, форма заказа) начнёт писать в `payments` сразу после деплоя — прогнать до пуша шага 8 |
| 9 | Очистка логов | `order_history`, `audit_log` | **Да, необратимо удаляет данные** этих двух таблиц — не влияет на работоспособность сайта, но история изменений будет потеряна |

Все миграции безопасны для уже работающего приложения: только `ADD COLUMN`/новая таблица с значениями по умолчанию или включение RLS с политиками, покрывающими существующий service-role доступ — без удаления или переименования существующих полей.

---

*Соответствующий функционал: [00-overview.md](./00-overview.md) — таблица шагов внедрения*
