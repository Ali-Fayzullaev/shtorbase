const TELEGRAM_API = 'https://api.telegram.org'

async function post(token: string, chatId: string, text: string): Promise<void> {
  console.log(`[Telegram] sending to ${chatId}…`)
  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[Telegram] ERROR ${res.status} for chat ${chatId}:`, body)
  } else {
    console.log(`[Telegram] ✓ delivered to ${chatId}`)
  }
}

/** Send to the group chat configured in TELEGRAM_CHAT_ID env var. */
export async function sendTelegram(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  try {
    await post(token, chatId, message)
  } catch (e) {
    console.error('[Telegram] sendTelegram error:', e)
  }
}

/**
 * Send to a list of personal chat IDs (null/undefined values are skipped).
 * Does NOT send to the group chat — call sendTelegram separately if needed.
 */
export async function sendTelegramToMany(
  message: string,
  chatIds: (string | null | undefined)[],
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  const unique = [...new Set(chatIds.filter(Boolean))] as string[]
  if (!unique.length) return
  await Promise.allSettled(unique.map((id) => post(token, id, message).catch(() => {})))
}

/**
 * Send to the group chat AND to personal chat IDs in one call.
 * Deduplicates all IDs, so if a personal ID matches the group chat ID it's sent once.
 */
export async function broadcastTelegram(
  message: string,
  personalIds: (string | null | undefined)[] = [],
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error('[Telegram] TELEGRAM_BOT_TOKEN is not set')
    return
  }
  const groupId = process.env.TELEGRAM_CHAT_ID
  if (!groupId) {
    console.error('[Telegram] TELEGRAM_CHAT_ID is not set')
  }
  const all = [...new Set([groupId, ...personalIds].filter(Boolean))] as string[]
  console.log(`[Telegram] broadcasting to ${all.length} recipient(s):`, all)
  await Promise.allSettled(all.map((id) => post(token, id, message).catch((e) => console.error('[Telegram] fetch error:', e))))
}

// ─── Message builders ─────────────────────────────────────────────────────────

export function tgNewOrder(params: {
  orderNumber: string | number
  clientName: string
  createdBy: string
  total?: number
  itemCount?: number
}) {
  const lines = [
    `🛒 <b>Новый заказ #${params.orderNumber}</b>`,
    `👤 Клиент: ${params.clientName}`,
    `👨‍💼 Создал: ${params.createdBy}`,
  ]
  if (params.itemCount) lines.push(`📦 Позиций: ${params.itemCount}`)
  if (params.total) lines.push(`💰 Сумма: ${params.total.toLocaleString('ru')} ₽`)
  return lines.join('\n')
}

export function tgStatusChanged(params: {
  orderNumber: string | number
  clientName: string
  oldStatus: string
  newStatus: string
  changedBy: string
}) {
  const statusEmoji: Record<string, string> = {
    new: '🆕',
    in_progress: '🔄',
    ready: '✅',
    delivered: '📬',
    cancelled: '❌',
  }
  const emoji = statusEmoji[params.newStatus] ?? '📋'
  return [
    `${emoji} <b>Заказ #${params.orderNumber}</b> — смена статуса`,
    `👤 Клиент: ${params.clientName}`,
    `📌 Статус: ${params.oldStatus} → <b>${params.newStatus}</b>`,
    `👨‍💼 Изменил: ${params.changedBy}`,
  ].join('\n')
}

export function tgLowStock(params: { productName: string; sku: string; stock: number }) {
  return [
    `⚠️ <b>Низкий остаток</b>`,
    `📦 ${params.productName} (${params.sku})`,
    `🔢 Остаток: ${params.stock} шт.`,
  ].join('\n')
}
