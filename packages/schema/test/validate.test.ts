import { describe, it, expect } from 'vitest'
import { parseDeck } from '../src'

const goodDeck = {
  version: 1,
  title: 'Hello, Emaki',
  scenes: [
    { id: 'a', type: 'title', props: { kicker: 'Emaki', text: 'Films from a JSON file.' } },
    { id: 'b', type: 'statement', props: { text: 'One deck, one engine, two matching render paths.' } },
    { id: 'c', type: 'stat', props: { value: '30s', label: 'vertical film' } },
  ],
}

describe('parseDeck', () => {
  it('accepts a well-formed 3-scene deck and fills defaults', () => {
    const r = parseDeck(goodDeck)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.deck.aspect).toBe('9:16')
      expect(r.deck.theme).toBe('warm-editorial')
      expect(r.deck.wordsPerSecond).toBe(2.2)
      expect(r.deck.scenes).toHaveLength(3)
    }
  })

  it('rejects an unknown block type with a message that points at scenes', () => {
    const r = parseDeck({ version: 1, scenes: [{ id: 'a', type: 'banana', props: {} }] })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message.toLowerCase()).toContain('scenes')
  })

  it('rejects a scene missing a required prop', () => {
    const r = parseDeck({ version: 1, scenes: [{ id: 'a', type: 'title', props: {} }] })
    expect(r.ok).toBe(false)
  })

  it('fails when version is missing', () => {
    const r = parseDeck({ scenes: [{ id: 'a', type: 'title', props: { text: 'x' } }] })
    expect(r.ok).toBe(false)
  })

  it('fails on an empty deck', () => {
    const r = parseDeck({ version: 1, scenes: [] })
    expect(r.ok).toBe(false)
  })
})
