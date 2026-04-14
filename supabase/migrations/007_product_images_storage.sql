-- Supabase Storage: создаём бакет для изображений товаров
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Политики хранилища
-- Просмотр: все авторизованные
CREATE POLICY "product_images_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'product-images');

-- Загрузка: менеджер/админ
CREATE POLICY "product_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.get_my_role() IN ('manager', 'admin')
  );

-- Удаление: менеджер/админ
CREATE POLICY "product_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.get_my_role() IN ('manager', 'admin')
  );

-- Публичное чтение для отображения
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'product-images');
