import { describe, it, expect } from 'vitest'
import { consume } from '@/lib/utils/rate-limit'

// Уникальные идентификаторы между тестами, чтобы не пересекались.
describe('rate-limit consume()', () => {
  it('allows requests within limit', () => {
    const id = `u-${Math.random()}`
    const opts = { key: 't1', limit: 3, windowMs: 60_000 }
    expect(consume(id, opts).ok).toBe(true)
    expect(consume(id, opts).ok).toBe(true)
    expect(consume(id, opts).ok).toBe(true)
  })

  it('blocks after limit exceeded', () => {
    const id = `u-${Math.random()}`
    const opts = { key: 't2', limit: 2, windowMs: 60_000 }
    consume(id, opts)
    consume(id, opts)
    const third = consume(id, opts)
    expect(third.ok).toBe(false)
    expect(third.retryAfterMs).toBeGreaterThan(0)
  })

  it('namespaces are isolated', () => {
    const id = `u-${Math.random()}`
    const a = { key: 'ns-a', limit: 1, windowMs: 60_000 }
    const b = { key: 'ns-b', limit: 1, windowMs: 60_000 }
    expect(consume(id, a).ok).toBe(true)
    expect(consume(id, b).ok).toBe(true)
    expect(consume(id, a).ok).toBe(false)
  })
})
