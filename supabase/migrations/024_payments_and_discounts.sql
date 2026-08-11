-- ============================================
-- Шаг 24: История платежей (долги) + скидка на заказ
-- ============================================

-- 1. Скидка на заказ
alter table public.orders
  add column discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0);

-- 2. Таблица платежей — вместо одного числа paid_amount храним историю:
--    кто, сколько и когда заплатил. Это даёт отчёты по выручке за период
--    и позволяет клиенту платить частями в разное время (взял в долг,
--    занёс половину, потом остальное).
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

-- Логи неизменяемы для всех кроме удаления админом — как order_history/audit_log
revoke update on public.payments from authenticated;

-- 3. Backfill: то, что уже было записано как paid_amount, становится первой
--    записью истории платежей (иначе долги задним числом посчитаются неверно)
insert into public.payments (order_id, amount, note, created_at, created_by)
select id, paid_amount, 'Перенесено при переходе на историю платежей', updated_at, created_by
from public.orders
where paid_amount > 0;

-- 4. paid_amount становится производным полем — пересчитывается суммой платежей
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

-- 5. Статус оплаты теперь считается от суммы к оплате за вычетом скидки
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
