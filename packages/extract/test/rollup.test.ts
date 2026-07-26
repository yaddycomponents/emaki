import { describe, it, expect } from 'vitest'
import { extractRollup } from '../src'

describe('extractRollup', () => {
  it('builds a valid deck from bundle stats', () => {
    const deck = extractRollup({
      bundles: [
        { name: 'index.js', bytes: 247_900 },
        { name: 'vendor.js', bytes: 114_100 },
        { name: 'app.css', bytes: 12_000 },
      ],
    })
    expect(deck.scenes[0]!.type).toBe('title')
    expect(deck.scenes[1]!.type).toBe('stat')
    expect((deck.scenes[1]!.props as { value: string }).value).toContain('kB')
    expect(deck.scenes[2]!.type).toBe('list')
  })

  it('throws when no sizes are present', () => {
    expect(() => extractRollup({ nothing: true })).toThrow(/No chunk sizes/)
  })
})
