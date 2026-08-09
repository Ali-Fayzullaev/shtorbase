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

**Статус: ⬜ не выполнено**
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

**Статус: ⬜ не выполнено**
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

**Статус: ⬜ не выполнено**
**Файл миграции:** `supabase/migrations/021_custom_fields_category_scope.sql`

```sql
alter table public.custom_fields
  add column category_id uuid references public.categories(id) on delete cascade;
-- null = поле общее для всех категорий (все уже существующие поля продолжат работать как раньше)
```

---

## Шаг 6 — Вариации товара

**Статус: ⬜ не выполнено**
**Файл миграции:** `supabase/migrations/022_product_variants.sql`

```sql
alter table public.products
  add column variant_group_id uuid;

create index idx_products_variant_group on public.products(variant_group_id);
```

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

Все миграции безопасны для уже работающего приложения: только `ADD COLUMN` с значениями по умолчанию, без удаления или переименования существующих полей.

---

*Соответствующий функционал: [00-overview.md](./00-overview.md) — таблица шагов внедрения*
