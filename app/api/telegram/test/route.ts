import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  // Only allow authenticated users
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN не задан в .env.local — перезапусти сервер' }, { status: 500 })
  if (!chatId) return NextResponse.json({ error: 'TELEGRAM_CHAT_ID не задан в .env.local — перезапусти сервер' }, { status: 500 })

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '✅ <b>Тест уведомлений ШторБазы</b>\n\nЕсли видишь это сообщение — уведомления работают!',
        parse_mode: 'HTML',
      }),
    })
    const body = await res.json()
    return NextResponse.json({ ok: res.ok, status: res.status, telegram: body })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
