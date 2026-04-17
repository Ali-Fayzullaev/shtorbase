import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Формирует Content-Security-Policy с per-request nonce.
 * В dev-режиме требуются 'unsafe-eval' и 'unsafe-inline' для Turbopack HMR,
 * в production — строгая политика с 'strict-dynamic'.
 */
function buildCsp(nonce: string): string {
  const isProd = process.env.NODE_ENV === 'production'
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' ${isProd ? "'strict-dynamic'" : "'unsafe-eval' 'unsafe-inline'"}`,
    // Tailwind v4 эмитит inline-стили (CSS vars) — 'unsafe-inline' неизбежен.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ')
}

export async function updateSession(request: NextRequest) {
  // Генерируем nonce для CSP и прокидываем его в server-components через header.
  // 128-bit случайный nonce (OWASP рекомендует ≥128 бит энтропии)
  const nonceBytes = new Uint8Array(16)
  crypto.getRandomValues(nonceBytes)
  const nonce = Buffer.from(nonceBytes).toString('base64')
  const csp = buildCsp(nonce)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const applyCsp = (res: NextResponse) => {
    res.headers.set('Content-Security-Policy', csp)
    return res
  }

  // Fallback: если Supabase не настроен — просто пропускаем с CSP.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return applyCsp(NextResponse.next({ request: { headers: requestHeaders } }))
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/register') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/invite')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return applyCsp(NextResponse.redirect(url))
  }

  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return applyCsp(NextResponse.redirect(url))
  }

  return applyCsp(supabaseResponse)
}
