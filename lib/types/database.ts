export type UserRole = 'employee' | 'manager' | 'admin'
export type ProductUnit = 'meter' | 'piece'
export type ProductStatus = 'active' | 'hidden' | 'discontinued'
export type AuditAction = 'create' | 'update' | 'delete'

export interface Profile {
  id: string
  full_name: string
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
