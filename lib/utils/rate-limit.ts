/**
 * Lightweight in-memory rate limiter for Server Actions.
 *
 * Production note: this uses a module-level Map, so it is per-server-instance
 * and resets on deploy. Good enough for brute-force mitigation on small
 * deployments; for multi-instance setups, swap the storage with Redis / Upstash.
 */

import { headers } from 'next/headers'

type Bucket = { count: number; resetAt: number; blockedUntil?: number }

const buckets = new Map<string, Bucket>()

// Periodic cleanup to avoid unbounded growth.
let lastSweep = 0
function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, b] of buckets) {
    if (b.resetAt < now && (!b.blockedUntil || b.blockedUntil < now)) {
      buckets.delete(key)
    }
  }
}

export async function getClientIp(): Promise<string> {
  const h = await headers()
  const fwd = h.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return h.get('x-real-ip') ?? 'unknown'
}

export interface RateLimitOptions {
  /** Unique namespace, e.g. 'login', 'register'. */
  key: string
  /** Max attempts per window. */
  limit: number
  /** Window in ms. */
  windowMs: number
  /** Block duration after hitting the limit (ms). Defaults to windowMs. */
  blockMs?: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterMs: number
}

/**
 * Consume one attempt for the given identifier + bucket. Returns ok=false when
 * the caller should be rejected. Safe to call from Server Actions.
 */
export function consume(identifier: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const key = `${opts.key}:${identifier}`
  const blockMs = opts.blockMs ?? opts.windowMs
  const existing = buckets.get(key)

  if (existing?.blockedUntil && existing.blockedUntil > now) {
    return { ok: false, remaining: 0, retryAfterMs: existing.blockedUntil - now }
  }

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { ok: true, remaining: opts.limit - 1, retryAfterMs: 0 }
  }

  existing.count += 1
  if (existing.count > opts.limit) {
    existing.blockedUntil = now + blockMs
    return { ok: false, remaining: 0, retryAfterMs: blockMs }
  }
  return { ok: true, remaining: opts.limit - existing.count, retryAfterMs: 0 }
}

export function formatRetry(ms: number): string {
  const s = Math.ceil(ms / 1000)
  if (s < 60) return `${s} сек`
  const m = Math.ceil(s / 60)
  return `${m} мин`
}
