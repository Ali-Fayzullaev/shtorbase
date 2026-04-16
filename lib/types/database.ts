export type UserRole = 'employee' | 'manager' | 'admin'
export type ProductUnit = string
export type ProductStatus = 'active' | 'hidden' | 'discontinued'
export type AuditAction = 'create' | 'update' | 'delete'
export type CustomFieldType = 'text' | 'number' | 'select'

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  sort_order: number
  created_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  description: string | null
  category_id: string
  price: number
  unit: ProductUnit
  stock: number
  vat_included: boolean
  note: string | null
  status: ProductStatus
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  // Joined
  category?: Category
}

export interface ProductImage {
  id: string
  product_id: string
  storage_path: string | null
  url: string | null
  sort_order: number
  created_at: string
  /** Resolved display URL (file or external) */
  display_url?: string
}

export interface AuditLog {
  id: string
  user_id: string
  product_id: string
  field_name: string
  old_value: string | null
  new_value: string
  comment: string | null
  action: AuditAction
  created_at: string
  // Joined
  user?: Profile
  product?: Product
}

export interface Unit {
  id: string
  name: string
  short_name: string
  sort_order: number
  created_at: string
}

export interface CustomField {
  id: string
  name: string
  field_type: CustomFieldType
  options: string[] | null
  is_required: boolean
  sort_order: number
  created_at: string
}

export interface ProductCustomValue {
  id: string
  product_id: string
  field_id: string
  value: string
}

// ============================================
// Заказы и клиенты
// ============================================
export type OrderStatus = 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'

export interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  note: string | null
  created_at: string
  created_by: string | null
}

export interface Order {
  id: string
  order_number: number
  client_id: string | null
  status: OrderStatus
  assigned_to: string | null
  note: string | null
  total_amount: number
  created_at: string
  updated_at: string
  created_by: string
  // Joined
  client?: Client
  assigned_user?: Profile
  created_user?: Profile
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  note: string | null
  created_at: string
  // Joined
  product?: Product
}
