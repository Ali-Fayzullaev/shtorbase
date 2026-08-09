-- ============================================
-- Шаг 19: Оплата заказа
-- ============================================

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

drop trigger if exists trg_order_payment_status on public.orders;
create trigger trg_order_payment_status
  before insert or update of paid_amount, total_amount on public.orders
  for each row execute function public.sync_payment_status();
