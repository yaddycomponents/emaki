import { describe, it, expect } from 'vitest'
import { DeckSchema, deckDuration, sceneDuration, MIN_SCENE_SECONDS } from '../src'

const deck = DeckSchema.parse({
  version: 1,
  wordsPerSecond: 2,
  scenes: [
    { id: 's1', type: 'title', props: { text: 'Two years of debt, one branch, sixteen ticks' } },
    { id: 's2', type: 'stat', props: { value: '5,400', label: 'lines deleted' }, dur: 3 },
    { id: 's3', type: 'statement', props: { text: 'Go.' } },
  ],
})

describe('duration', () => {
  it('honours an explicit dur override', () => {
    expect(sceneDuration(deck.scenes[1]!, { wordsPerSecond: deck.wordsPerSecond })).toBe(3)
  })

  it('computes reading time from words at wordsPerSecond', () => {
    // 8 words at 2 wps = 4s, above the floor
    expect(sceneDuration(deck.scenes[0]!, { wordsPerSecond: 2 })).toBe(4)
  })

  it('floors short scenes at MIN_SCENE_SECONDS', () => {
    expect(sceneDuration(deck.scenes[2]!, { wordsPerSecond: 2 })).toBe(MIN_SCENE_SECONDS)
  })

  it('sums the deck and reports per-scene durations', () => {
    const d = deckDuration(deck)
    expect(d.scenes.map((s) => s.id)).toEqual(['s1', 's2', 's3'])
    expect(d.total).toBeCloseTo(d.scenes.reduce((a, s) => a + s.dur, 0), 5)
  })

  it('adds hold on top of reading time', () => {
    const held = sceneDuration({ ...deck.scenes[2]!, hold: 1 }, { wordsPerSecond: 2 })
    expect(held).toBe(MIN_SCENE_SECONDS + 1)
  })
})
