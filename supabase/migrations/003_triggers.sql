-- ============================================
-- Шаг 3: Триггеры аудита
-- ============================================

-- Триггер: автоматическое логирование изменений товаров
create or replace function public.log_product_changes()
returns trigger as $$
begin
  -- При INSERT — одна запись «товар создан»
  if TG_OP = 'INSERT' then
    insert into public.audit_log (user_id, product_id, field_name, old_value, new_value, action)
    values (new.created_by, new.id, 'product', null, new.name, 'create');
    return new;
  end if;

  -- При UPDATE — логируем каждое изменённое поле отдельно
  if TG_OP = 'UPDATE' then
    -- Цена
    if old.price is distinct from new.price then
      insert into public.audit_log (user_id, product_id, field_name, old_value, new_value, action)
      values (new.updated_by, new.id, 'price', old.price::text, new.price::text, 'update');
    end if;

    -- Остаток
    if old.stock is distinct from new.stock then
      insert into public.audit_log (user_id, product_id, field_name, old_value, new_value, action)
      values (new.updated_by, new.id, 'stock', old.stock::text, new.stock::text, 'update');
    end if;

    -- Статус
    if old.status is distinct from new.status then
      insert into public.audit_log (user_id, product_id, field_name, old_value, new_value, action)
      values (new.updated_by, new.id, 'status', old.status, new.status, 'update');
    end if;

    -- Название
    if old.name is distinct from new.name then
      insert into public.audit_log (user_id, product_id, field_name, old_value, new_value, action)
      values (new.updated_by, new.id, 'name', old.name, new.name, 'update');
    end if;

    -- Заметка
    if old.note is distinct from new.note then
      insert into public.audit_log (user_id, product_id, field_name, old_value, new_value, action)
      values (new.updated_by, new.id, 'note', old.note, new.note, 'update');
    end if;

    -- Описание
    if old.description is distinct from new.description then
      insert into public.audit_log (user_id, product_id, field_name, old_value, new_value, action)
      values (new.updated_by, new.id, 'description', old.description, new.description, 'update');
    end if;

    -- НДС
    if old.vat_included is distinct from new.vat_included then
      insert into public.audit_log (user_id, product_id, field_name, old_value, new_value, action)
      values (new.updated_by, new.id, 'vat_included', old.vat_included::text, new.vat_included::text, 'update');
    end if;

    return new;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_product_audit
  after insert or update on public.products
  for each row execute function public.log_product_changes();

-- ============================================
-- Триггер: автосоздание профиля при регистрации
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'employee')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
