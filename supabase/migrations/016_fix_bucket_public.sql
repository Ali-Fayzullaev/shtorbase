-- Убеждаемся что бакет product-images публичный.
-- Предыдущая миграция 007 использовала ON CONFLICT DO NOTHING,
-- поэтому существующие приватные бакеты не обновлялись.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Обновляем url для существующих записей где url = null но storage_path есть.
-- URL строится из NEXT_PUBLIC_SUPABASE_URL — подставьте ваш project ref:
-- UPDATE public.product_images
-- SET url = 'https://[YOUR_PROJECT].supabase.co/storage/v1/object/public/product-images/' || storage_path
-- WHERE url IS NULL AND storage_path IS NOT NULL;
