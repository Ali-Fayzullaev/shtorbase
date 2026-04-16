import { type Product, type Category, type AuditLog, type Profile } from '@/lib/types/database'

export const demoCategories: Category[] = [
  { id: '1', name: 'Шторы', slug: 'shtory', sort_order: 1, created_at: '2026-04-01T00:00:00Z' },
  { id: '2', name: 'Ткани', slug: 'tkani', sort_order: 2, created_at: '2026-04-01T00:00:00Z' },
  { id: '3', name: 'Карнизы', slug: 'karnizy', sort_order: 3, created_at: '2026-04-01T00:00:00Z' },
  { id: '4', name: 'Фурнитура', slug: 'furnitura', sort_order: 4, created_at: '2026-04-01T00:00:00Z' },
  { id: '5', name: 'Ленты', slug: 'lenty', sort_order: 5, created_at: '2026-04-01T00:00:00Z' },
  { id: '6', name: 'Аксессуары', slug: 'aksessuary', sort_order: 6, created_at: '2026-04-01T00:00:00Z' },
]

export const demoProducts: Product[] = [
  {
    id: 'p1', sku: 'SH-0421', name: 'Штора «Венеция» бархат', description: 'Плотная бархатная штора, цвет бордо.',
    category_id: '1', price: 4500, unit: 'meter', stock: 127, vat_included: true,
    note: 'Режется от 1 м, шаг 0.5 м', status: 'active',
    created_at: '2026-03-15T10:00:00Z', updated_at: '2026-04-13T14:32:00Z',
    created_by: 'u1', updated_by: 'u2',
    category: { id: '1', name: 'Шторы', slug: 'shtory', sort_order: 1, created_at: '2026-04-01T00:00:00Z' },
  },
  {
    id: 'p2', sku: 'SH-0533', name: 'Штора «Милан» лён', description: 'Льняная штора натурального цвета.',
    category_id: '1', price: 3200, unit: 'meter', stock: 85, vat_included: true,
    note: 'Режется от 1 м', status: 'active',
    created_at: '2026-03-15T10:00:00Z', updated_at: '2026-04-12T09:15:00Z',
    created_by: 'u1', updated_by: 'u2',
    category: { id: '1', name: 'Шторы', slug: 'shtory', sort_order: 1, created_at: '2026-04-01T00:00:00Z' },
  },
  {
    id: 'p3', sku: 'TK-0033', name: 'Блэкаут «Люкс»', description: 'Ткань блэкаут с полным затемнением.',
    category_id: '2', price: 6200, unit: 'meter', stock: 3, vat_included: true,
    note: 'Минимальный отрез 2 м', status: 'active',
    created_at: '2026-03-20T10:00:00Z', updated_at: '2026-04-13T13:15:00Z',
    created_by: 'u1', updated_by: 'u3',
    category: { id: '2', name: 'Ткани', slug: 'tkani', sort_order: 2, created_at: '2026-04-01T00:00:00Z' },
  },
  {
    id: 'p4', sku: 'TK-0112', name: 'Вуаль белая', description: 'Лёгкая прозрачная вуаль.',
    category_id: '2', price: 1800, unit: 'meter', stock: 250, vat_included: true,
    note: 'Шаг 0.1 м', status: 'active',
    created_at: '2026-03-20T10:00:00Z', updated_at: '2026-04-10T16:00:00Z',
    created_by: 'u1', updated_by: 'u2',
    category: { id: '2', name: 'Ткани', slug: 'tkani', sort_order: 2, created_at: '2026-04-01T00:00:00Z' },
  },
  {
    id: 'p5', sku: 'KR-0011', name: 'Карниз «Модерн» 2м', description: 'Потолочный карниз с декоративной планкой.',
    category_id: '3', price: 12800, unit: 'piece', stock: 15, vat_included: true,
    note: null, status: 'active',
    created_at: '2026-03-22T10:00:00Z', updated_at: '2026-04-11T11:00:00Z',
    created_by: 'u1', updated_by: 'u2',
    category: { id: '3', name: 'Карнизы', slug: 'karnizy', sort_order: 3, created_at: '2026-04-01T00:00:00Z' },
  },
  {
    id: 'p6', sku: 'KR-0025', name: 'Карниз «Классик» 3м', description: 'Настенный двухрядный карниз.',
    category_id: '3', price: 18500, unit: 'piece', stock: 8, vat_included: true,
    note: null, status: 'active',
    created_at: '2026-03-22T10:00:00Z', updated_at: '2026-04-09T14:00:00Z',
    created_by: 'u1', updated_by: 'u3',
    category: { id: '3', name: 'Карнизы', slug: 'karnizy', sort_order: 3, created_at: '2026-04-01T00:00:00Z' },
  },
  {
    id: 'p7', sku: 'FN-0098', name: 'Крючки декоративные «Лотос»', description: 'Металлические крючки с позолотой.',
    category_id: '4', price: 350, unit: 'piece', stock: 540, vat_included: false,
    note: 'Продаются только упаковкой 10 шт.', status: 'active',
    created_at: '2026-03-25T10:00:00Z', updated_at: '2026-04-12T17:40:00Z',
    created_by: 'u1', updated_by: 'u2',
    category: { id: '4', name: 'Фурнитура', slug: 'furnitura', sort_order: 4, created_at: '2026-04-01T00:00:00Z' },
  },
  {
    id: 'p8', sku: 'FN-0100', name: 'Люверсы бронза 40мм', description: 'Металлические люверсы цвета бронзы.',
    category_id: '4', price: 180, unit: 'piece', stock: 1200, vat_included: false,
    note: 'Упаковка 50 шт.', status: 'active',
    created_at: '2026-03-25T10:00:00Z', updated_at: '2026-04-08T12:00:00Z',
    created_by: 'u1', updated_by: 'u3',
    category: { id: '4', name: 'Фурнитура', slug: 'furnitura', sort_order: 4, created_at: '2026-04-01T00:00:00Z' },
  },
  {
    id: 'p9', sku: 'LN-0015', name: 'Лента шторная «Карандаш» 7.5см', description: 'Шторная лента для карандашной складки.',
    category_id: '5', price: 450, unit: 'meter', stock: 300, vat_included: true,
    note: 'Шаг 0.5 м', status: 'active',
    created_at: '2026-03-28T10:00:00Z', updated_at: '2026-04-07T10:00:00Z',
    created_by: 'u1', updated_by: 'u2',
    category: { id: '5', name: 'Ленты', slug: 'lenty', sort_order: 5, created_at: '2026-04-01T00:00:00Z' },
  },
  {
    id: 'p10', sku: 'AK-0042', name: 'Подхват магнитный серебро', description: 'Магнитный подхват для штор, серебряный.',
    category_id: '6', price: 2100, unit: 'piece', stock: 45, vat_included: true,
    note: null, status: 'active',
    created_at: '2026-03-30T10:00:00Z', updated_at: '2026-04-06T15:00:00Z',
    created_by: 'u1', updated_by: 'u3',
    category: { id: '6', name: 'Аксессуары', slug: 'aksessuary', sort_order: 6, created_at: '2026-04-01T00:00:00Z' },
  },
]

export const demoProfile: Profile = {
  id: 'u2',
  full_name: 'Алия Кенесова',
  phone: null,
  role: 'manager',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const demoAuditLogs: AuditLog[] = [
  {
    id: 'a1', user_id: 'u2', product_id: 'p1', field_name: 'price',
    old_value: '4000', new_value: '4500', comment: 'Поставщик поднял цену',
    action: 'update', created_at: '2026-04-13T14:32:00Z',
    user: { id: 'u2', full_name: 'Алия Кенесова', phone: null, role: 'manager', is_active: true, created_at: '', updated_at: '' },
    product: demoProducts[0],
  },
  {
    id: 'a2', user_id: 'u3', product_id: 'p3', field_name: 'stock',
    old_value: '50', new_value: '3', comment: null,
    action: 'update', created_at: '2026-04-13T13:15:00Z',
    user: { id: 'u3', full_name: 'Бахыт Муратов', phone: null, role: 'manager', is_active: true, created_at: '', updated_at: '' },
    product: demoProducts[2],
  },
  {
    id: 'a3', user_id: 'u2', product_id: 'p7', field_name: 'note',
    old_value: null, new_value: 'Продаются только упаковкой 10 шт.', comment: null,
    action: 'update', created_at: '2026-04-12T17:40:00Z',
    user: { id: 'u2', full_name: 'Алия Кенесова', phone: null, role: 'manager', is_active: true, created_at: '', updated_at: '' },
    product: demoProducts[6],
  },
  {
    id: 'a4', user_id: 'u3', product_id: 'p6', field_name: 'price',
    old_value: '17500', new_value: '18500', comment: 'Новая партия',
    action: 'update', created_at: '2026-04-09T14:00:00Z',
    user: { id: 'u3', full_name: 'Бахыт Муратов', phone: null, role: 'manager', is_active: true, created_at: '', updated_at: '' },
    product: demoProducts[5],
  },
]
