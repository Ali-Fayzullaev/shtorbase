-- ============================================
-- Шаг 21: Категория для динамических полей товара
-- ============================================

alter table public.custom_fields
  add column category_id uuid references public.categories(id) on delete cascade;
-- null = поле общее для всех категорий (все уже существующие поля продолжат работать как раньше)
