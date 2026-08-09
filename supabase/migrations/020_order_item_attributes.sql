-- ============================================
-- Шаг 20: Индивидуальные параметры позиции заказа
-- ============================================

alter table public.order_items
  add column custom_attributes jsonb not null default '{}'::jsonb;
