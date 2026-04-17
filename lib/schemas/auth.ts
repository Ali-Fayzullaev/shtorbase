import { z } from 'zod'

/**
 * Единая политика паролей для всех auth-потоков.
 * Требования: 10+ символов, буква и цифра.
 */
export const passwordSchema = z
  .string()
  .min(10, 'Минимум 10 символов')
  .max(128, 'Максимум 128 символов')
  .regex(/[a-zA-Zа-яА-ЯёЁ]/, 'Должна быть хотя бы одна буква')
  .regex(/[0-9]/, 'Должна быть хотя бы одна цифра')

/** Общая проверка совпадения пароля и подтверждения. */
export function withPasswordConfirm<T extends z.ZodObject<Record<string, z.ZodTypeAny>>>(schema: T) {
  return schema.refine(
    (d: { password?: string; password_confirm?: string }) => d.password === d.password_confirm,
    { message: 'Пароли не совпадают', path: ['password_confirm'] },
  )
}

export const emailSchema = z.string().trim().toLowerCase().email('Некорректный email').max(254)

/**
 * Honeypot-поле. Должно быть пустым. Если бот заполнит — zod вернёт ошибку.
 * Используйте вместе с CSS `position: absolute; left: -9999px`.
 */
export const honeypotSchema = z.string().max(0, 'bot').optional()
