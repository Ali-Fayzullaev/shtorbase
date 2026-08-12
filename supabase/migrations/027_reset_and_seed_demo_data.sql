-- ============================================
-- Шаг 27: Полный сброс демо-данных + пересев каталога
-- ============================================
-- По запросу пользователя: вся база на момент миграции — тестовые данные
-- без реальных заказов/клиентов (подтверждено явно). Полностью очищаем
-- транзакционные данные и пересеваем каталог: 10 базовых товаров,
-- у каждого минимум 5 вариаций по цвету. Категории и поля вариаций
-- (custom_fields) НЕ удаляются — только их списки значений очищены
-- от тестового мусора.

-- 1. Очистка транзакционных данных (от потомков к родителям — без опоры на CASCADE)
delete from payments;
delete from order_history;
delete from order_items;
delete from orders;
delete from audit_log;
delete from product_custom_values;
delete from product_images;
delete from products;
delete from clients;

alter sequence orders_order_number_seq restart with 1;

-- 2. Убираем тестовое поле-мусор (name='тест', единственная опция 'тестт')
delete from custom_fields where name = 'тест';

-- 3. Чистые списки значений для оставшихся полей вариаций
update custom_fields set options = '["Белый","Бежевый","Серый","Синий","Зелёный","Терракотовый"]'::jsonb
  where id = '5c5d59bc-2418-47dc-97d5-c10986fb096b'; -- Цвет (Шторы)
update custom_fields set options = '["Белый","Чёрный","Бежевый","Серый","Коричневый"]'::jsonb
  where id = '7bd53300-67b3-494b-8012-b8604871483c'; -- Цвет (Ткани)
update custom_fields set options = '["Белый","Чёрный","Золотой","Серебристый","Коричневый"]'::jsonb
  where id = '09512aa7-44ee-45d6-b41f-7ed1da538980'; -- Цвет (Карнизы)
update custom_fields set options = '["10 мм","16 мм","19 мм","25 мм"]'::jsonb
  where id = 'fd923b65-f4e4-4800-ab88-84b36583fc40'; -- толщина (Карнизы)
update custom_fields set options = '["Белый","Чёрный","Бежевый","Серый","Коричневый"]'::jsonb
  where id = '72970d30-cdb6-46de-b9ad-880ff36eef78'; -- цвет (Ленты)
update custom_fields set options = '["5 см","7 см","10 см"]'::jsonb
  where id = 'ca498ed8-7969-44e5-abef-380e884eb724'; -- толщина (Ленты)
update custom_fields set options = '["С пультом","Без пульта"]'::jsonb
  where id = '20afa808-6d95-4551-bc2a-4a7ac0e6868f'; -- добавляется (Карнизы)

-- 4. Пересев каталога — 10 базовых товаров × 5-6 вариаций по цвету каждый
do $$
declare
  admin_id uuid := '2e47a584-9ed7-4eef-ad97-8b4265bc612f';
  gid uuid;
  pid uuid;
  c text;
begin
  -- 1. Штора «Милан» блэкаут
  gid := gen_random_uuid();
  foreach c in array array['Белый','Бежевый','Серый','Синий','Зелёный','Терракотовый'] loop
    insert into products (sku, name, description, category_id, price, unit, stock, vat_included, status, variant_group_id, created_by, updated_by)
    values ('MIL-'||upper(left(c,3)), 'Штора «Милан» блэкаут — '||c, 'Плотная штора блэкаут, полностью блокирует свет.', 'c1000000-0000-0000-0000-000000000001', 4500, 'meter', 180, true, 'active', gid, admin_id, admin_id)
    returning id into pid;
    insert into product_custom_values (product_id, field_id, value) values (pid, '5c5d59bc-2418-47dc-97d5-c10986fb096b', c);
  end loop;

  -- 2. Штора «Верона» лён
  gid := gen_random_uuid();
  foreach c in array array['Белый','Бежевый','Серый','Синий','Зелёный'] loop
    insert into products (sku, name, description, category_id, price, unit, stock, vat_included, status, variant_group_id, created_by, updated_by)
    values ('VER-'||upper(left(c,3)), 'Штора «Верона» лён — '||c, 'Лёгкая льняная штора, натуральная фактура.', 'c1000000-0000-0000-0000-000000000001', 3800, 'meter', 220, true, 'active', gid, admin_id, admin_id)
    returning id into pid;
    insert into product_custom_values (product_id, field_id, value) values (pid, '5c5d59bc-2418-47dc-97d5-c10986fb096b', c);
  end loop;

  -- 3. Штора «Прованс» жаккард
  gid := gen_random_uuid();
  foreach c in array array['Бежевый','Серый','Синий','Зелёный','Терракотовый'] loop
    insert into products (sku, name, description, category_id, price, unit, stock, vat_included, status, variant_group_id, created_by, updated_by)
    values ('PRV-'||upper(left(c,3)), 'Штора «Прованс» жаккард — '||c, 'Жаккардовая ткань с рельефным узором.', 'c1000000-0000-0000-0000-000000000001', 5200, 'meter', 140, true, 'active', gid, admin_id, admin_id)
    returning id into pid;
    insert into product_custom_values (product_id, field_id, value) values (pid, '5c5d59bc-2418-47dc-97d5-c10986fb096b', c);
  end loop;

  -- 4. Штора «Классик» вуаль
  gid := gen_random_uuid();
  foreach c in array array['Белый','Бежевый','Серый','Синий','Зелёный','Терракотовый'] loop
    insert into products (sku, name, description, category_id, price, unit, stock, vat_included, status, variant_group_id, created_by, updated_by)
    values ('CLS-'||upper(left(c,3)), 'Штора «Классик» вуаль — '||c, 'Полупрозрачная вуаль для мягкого рассеивания света.', 'c1000000-0000-0000-0000-000000000001', 2900, 'meter', 260, true, 'active', gid, admin_id, admin_id)
    returning id into pid;
    insert into product_custom_values (product_id, field_id, value) values (pid, '5c5d59bc-2418-47dc-97d5-c10986fb096b', c);
  end loop;

  -- 5. Ткань «Атлас Люкс»
  gid := gen_random_uuid();
  foreach c in array array['Белый','Чёрный','Бежевый','Серый','Коричневый'] loop
    insert into products (sku, name, description, category_id, price, unit, stock, vat_included, status, variant_group_id, created_by, updated_by)
    values ('ATL-'||upper(left(c,3)), 'Ткань «Атлас Люкс» — '||c, 'Гладкая атласная ткань с лёгким блеском.', 'c1000000-0000-0000-0000-000000000002', 3200, 'meter', 300, true, 'active', gid, admin_id, admin_id)
    returning id into pid;
    insert into product_custom_values (product_id, field_id, value) values (pid, '7bd53300-67b3-494b-8012-b8604871483c', c);
  end loop;

  -- 6. Ткань «Рогожка Премиум»
  gid := gen_random_uuid();
  foreach c in array array['Белый','Чёрный','Бежевый','Серый','Коричневый'] loop
    insert into products (sku, name, description, category_id, price, unit, stock, vat_included, status, variant_group_id, created_by, updated_by)
    values ('ROG-'||upper(left(c,3)), 'Ткань «Рогожка Премиум» — '||c, 'Плотная фактурная ткань, износостойкая.', 'c1000000-0000-0000-0000-000000000002', 2600, 'meter', 350, true, 'active', gid, admin_id, admin_id)
    returning id into pid;
    insert into product_custom_values (product_id, field_id, value) values (pid, '7bd53300-67b3-494b-8012-b8604871483c', c);
  end loop;

  -- 7. Ткань «Бархат Софт»
  gid := gen_random_uuid();
  foreach c in array array['Белый','Чёрный','Бежевый','Серый','Коричневый'] loop
    insert into products (sku, name, description, category_id, price, unit, stock, vat_included, status, variant_group_id, created_by, updated_by)
    values ('BRH-'||upper(left(c,3)), 'Ткань «Бархат Софт» — '||c, 'Мягкий бархат с плотным ворсом.', 'c1000000-0000-0000-0000-000000000002', 4800, 'meter', 160, true, 'active', gid, admin_id, admin_id)
    returning id into pid;
    insert into product_custom_values (product_id, field_id, value) values (pid, '7bd53300-67b3-494b-8012-b8604871483c', c);
  end loop;

  -- 8. Карниз потолочный «Стандарт»
  gid := gen_random_uuid();
  foreach c in array array['Белый','Чёрный','Золотой','Серебристый','Коричневый'] loop
    insert into products (sku, name, description, category_id, price, unit, stock, vat_included, status, variant_group_id, created_by, updated_by)
    values ('KRP-'||upper(left(c,3)), 'Карниз потолочный «Стандарт» — '||c, 'Двухрядный потолочный карниз, длина по индивидуальному заказу.', 'c1000000-0000-0000-0000-000000000003', 9500, 'piece', 45, true, 'active', gid, admin_id, admin_id)
    returning id into pid;
    insert into product_custom_values (product_id, field_id, value) values (pid, '09512aa7-44ee-45d6-b41f-7ed1da538980', c);
  end loop;

  -- 9. Карниз настенный «Модерн»
  gid := gen_random_uuid();
  foreach c in array array['Белый','Чёрный','Золотой','Серебристый','Коричневый'] loop
    insert into products (sku, name, description, category_id, price, unit, stock, vat_included, status, variant_group_id, created_by, updated_by)
    values ('KRN-'||upper(left(c,3)), 'Карниз настенный «Модерн» — '||c, 'Металлический настенный карниз с наконечниками.', 'c1000000-0000-0000-0000-000000000003', 12000, 'piece', 30, true, 'active', gid, admin_id, admin_id)
    returning id into pid;
    insert into product_custom_values (product_id, field_id, value) values (pid, '09512aa7-44ee-45d6-b41f-7ed1da538980', c);
  end loop;

  -- 10. Лента шторная «Классик» 5см
  gid := gen_random_uuid();
  foreach c in array array['Белый','Чёрный','Бежевый','Серый','Коричневый'] loop
    insert into products (sku, name, description, category_id, price, unit, stock, vat_included, status, variant_group_id, created_by, updated_by)
    values ('LNT-'||upper(left(c,3)), 'Лента шторная «Классик» 5см — '||c, 'Шторная тесьма для сборки складок, ширина 5 см.', 'c1000000-0000-0000-0000-000000000005', 650, 'meter', 400, true, 'active', gid, admin_id, admin_id)
    returning id into pid;
    insert into product_custom_values (product_id, field_id, value) values (pid, '72970d30-cdb6-46de-b9ad-880ff36eef78', c);
  end loop;
end $$;
