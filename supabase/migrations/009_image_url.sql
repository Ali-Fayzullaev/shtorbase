-- ============================================
-- Шаг 9: Поддержка URL изображений
-- ============================================

alter table public.product_images
  add column url text,
  alter column storage_path drop not null;

-- storage_path или url должен быть заполнен
alter table public.product_images
  add constraint image_source_check
  check (storage_path is not null or url is not null);
