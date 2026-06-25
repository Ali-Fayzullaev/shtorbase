import { NextRequest, NextResponse } from 'next/server'

const HELP_TEXT = `
Привет! Я бот уведомлений <b>ШторБазы</b>.

Твой Telegram ID: <code>{{CHAT_ID}}</code>

Скопируй этот ID и вставь в разделе <b>Профиль → Telegram уведомления</b> на сайте — и ты будешь получать уведомления о своих заказах лично.
`.trim()

async function reply(token: string, chatId: string | number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

export async function POST(request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return NextResponse.json({ ok: false }, { status: 500 })

  let update: Record<string, unknown>
  try {
    update = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const message =
    (update.message as Record<string, unknown> | undefined) ??
    (update.channel_post as Record<string, unknown> | undefined)

  if (!message) return NextResponse.json({ ok: true })

  const chat = message.chat as { id: number } | undefined
  const text = typeof message.text === 'string' ? message.text.trim() : ''

  if (!chat?.id) return NextResponse.json({ ok: true })

  const cmd = text.split(' ')[0]?.toLowerCase()
  if (cmd === '/start' || cmd === '/myid' || cmd === '/id') {
    await reply(token, chat.id, HELP_TEXT.replace('{{CHAT_ID}}', String(chat.id)))
  }

  return NextResponse.json({ ok: true })
}
