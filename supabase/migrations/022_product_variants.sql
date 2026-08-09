-- ============================================
-- Шаг 22: Вариации товара
-- ============================================

alter table public.products
  add column variant_group_id uuid;

create index idx_products_variant_group on public.products(variant_group_id);
