import { describe, it, expect } from 'vitest'
import { escapeIlike, sanitizeCsvCell } from '@/lib/utils/sanitize'

describe('escapeIlike', () => {
  it('escapes SQL wildcards', () => {
    expect(escapeIlike('foo%bar')).toBe('foo\\%bar')
    expect(escapeIlike('foo_bar')).toBe('foo\\_bar')
    expect(escapeIlike('\\backslash')).toBe('\\\\backslash')
  })

  it('strips control characters', () => {
    expect(escapeIlike('abc\x00\x1fxyz')).toBe('abcxyz')
  })

  it('preserves normal input', () => {
    expect(escapeIlike('Rideau bleu')).toBe('Rideau bleu')
  })

  it('trims whitespace', () => {
    expect(escapeIlike('  hello  ')).toBe('hello')
  })
})

describe('sanitizeCsvCell', () => {
  it('prefixes formula-like cells with apostrophe', () => {
    expect(sanitizeCsvCell('=SUM(A1:A9)')).toBe("'=SUM(A1:A9)")
    expect(sanitizeCsvCell('+evil')).toBe("'+evil")
    expect(sanitizeCsvCell('-evil')).toBe("'-evil")
    expect(sanitizeCsvCell('@cmd')).toBe("'@cmd")
    expect(sanitizeCsvCell('\tHYPERLINK')).toBe("'\tHYPERLINK")
  })

  it('leaves normal values untouched', () => {
    expect(sanitizeCsvCell('Штора 3м')).toBe('Штора 3м')
    expect(sanitizeCsvCell('1500')).toBe('1500')
    expect(sanitizeCsvCell('')).toBe('')
  })

  it('handles null/undefined', () => {
    expect(sanitizeCsvCell(null)).toBe('')
    expect(sanitizeCsvCell(undefined)).toBe('')
  })
})
