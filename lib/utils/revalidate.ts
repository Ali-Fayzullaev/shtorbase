import { revalidatePath } from 'next/cache'

/**
 * Centralized revalidation paths by entity.
 * Using this map prevents scattered string literals and makes it easier
 * to audit what gets revalidated when each entity changes.
 */
export const REVALIDATE_MAP = {
  products: ['/', '/catalog', '/products'] as const,
  orders: ['/', '/orders', '/catalog'] as const,
  order: (id: string) => [`/orders/${id}`, '/orders'] as const,
  catalogItem: (id: string) => [`/catalog/${id}`] as const,
  notifications: ['/'] as const,
  users: ['/users'] as const,
  settings: ['/settings'] as const,
}

/** Revalidate all paths for the given entity */
export function revalidateFor(entity: keyof typeof REVALIDATE_MAP, ...args: string[]) {
  const entry = REVALIDATE_MAP[entity]
  const paths = typeof entry === 'function'
    ? (entry as (...a: string[]) => readonly string[])(...args)
    : entry
  for (const path of paths) {
    revalidatePath(path)
  }
}
