import { describe, it, expect } from 'vitest'
import { passwordSchema, emailSchema, honeypotSchema } from '@/lib/schemas/auth'

describe('passwordSchema', () => {
  it('rejects short passwords', () => {
    expect(passwordSchema.safeParse('short1a').success).toBe(false)
  })

  it('rejects password without digit', () => {
    expect(passwordSchema.safeParse('abcdefghij').success).toBe(false)
  })

  it('rejects password without letter', () => {
    expect(passwordSchema.safeParse('1234567890').success).toBe(false)
  })

  it('accepts valid password', () => {
    expect(passwordSchema.safeParse('hello12345').success).toBe(true)
    expect(passwordSchema.safeParse('Пароль123').success).toBe(false) // только 9 символов
    expect(passwordSchema.safeParse('Парольчик123').success).toBe(true)
  })

  it('rejects absurdly long passwords (DoS guard)', () => {
    expect(passwordSchema.safeParse('a1' + 'x'.repeat(200)).success).toBe(false)
  })
})

describe('emailSchema', () => {
  it('normalizes case and trims', () => {
    const r = emailSchema.parse('  Test@Example.COM  ')
    expect(r).toBe('test@example.com')
  })

  it('rejects invalid formats', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false)
    expect(emailSchema.safeParse('@example.com').success).toBe(false)
  })

  it('rejects emails longer than 254 chars', () => {
    const long = 'a'.repeat(250) + '@b.co'
    expect(emailSchema.safeParse(long).success).toBe(false)
  })
})

describe('honeypotSchema', () => {
  it('accepts empty string', () => {
    expect(honeypotSchema.safeParse('').success).toBe(true)
  })

  it('accepts undefined', () => {
    expect(honeypotSchema.safeParse(undefined).success).toBe(true)
  })

  it('rejects any non-empty value (bot)', () => {
    expect(honeypotSchema.safeParse('https://evil.com').success).toBe(false)
    expect(honeypotSchema.safeParse('x').success).toBe(false)
  })
})
