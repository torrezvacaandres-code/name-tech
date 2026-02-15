import { cn } from '@/lib/utils'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })

  it('handles tailwind conflicts correctly', () => {
    // Should keep the last conflicting class
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })

  it('handles array input', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('deduplicates classes', () => {
    expect(cn('foo', 'foo', 'bar')).toBe('foo bar')
  })
})
