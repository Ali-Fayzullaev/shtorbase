import { toast as sonner } from 'sonner'

/**
 * Единый хелпер для тостов. Используйте вместо прямого импорта `sonner`,
 * чтобы легко менять поведение (telemetry, кастомные классы) в одном месте.
 */
export const toast = {
  success(message: string, description?: string) {
    sonner.success(message, description ? { description } : undefined)
  },
  error(message: string, description?: string) {
    sonner.error(message, description ? { description } : undefined)
  },
  info(message: string, description?: string) {
    sonner.info(message, description ? { description } : undefined)
  },
  /**
   * Обёртка над server-action. Показывает success/error на основе возвращённого state.
   * Пример: `await withToast(updateOrder(...), { success: 'Заказ обновлён' })`.
   */
  async withPromise<T extends { error?: string } | null | undefined>(
    promise: Promise<T>,
    messages: { success: string; errorPrefix?: string },
  ): Promise<T> {
    try {
      const result = await promise
      if (result?.error) {
        sonner.error(messages.errorPrefix ? `${messages.errorPrefix}: ${result.error}` : result.error)
      } else {
        sonner.success(messages.success)
      }
      return result
    } catch (e) {
      sonner.error(e instanceof Error ? e.message : 'Неизвестная ошибка')
      throw e
    }
  },
}
