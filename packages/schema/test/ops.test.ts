import { describe, it, expect } from 'vitest'
import { DeckSchema, applyOps, type SceneOp } from '../src'

const deck = DeckSchema.parse({
  version: 1,
  scenes: [
    { id: 'a', type: 'title', props: { text: 'A' } },
    { id: 'b', type: 'statement', props: { text: 'B' } },
  ],
})

describe('applyOps', () => {
  it('inserts, patches, and removes; revalidates', () => {
    const ops: SceneOp[] = [
      { op: 'insertAfter', afterId: 'a', scene: { id: 'c', type: 'stat', props: { value: '9', label: 'x' } } },
      { op: 'patch', id: 'b', props: { text: 'B!' } },
      { op: 'remove', id: 'a' },
    ]
    const r = applyOps(deck, ops)
    expect(r.ok).toBe(true)
    expect(r.applied).toBe(3)
    expect(r.deck.scenes.map((s) => s.id)).toEqual(['c', 'b'])
    expect((r.deck.scenes[1]!.props as { text: string }).text).toBe('B!')
  })

  it('reports unknown ids in skipped, never throws', () => {
    const r = applyOps(deck, [{ op: 'remove', id: 'nope' }])
    expect(r.skipped).toHaveLength(1)
    expect(r.skipped[0]!.reason).toContain('nope')
  })

  it('fails when an op would produce an invalid deck (empty)', () => {
    const r = applyOps(deck, [
      { op: 'remove', id: 'a' },
      { op: 'remove', id: 'b' },
    ])
    expect(r.ok).toBe(false)
    expect(r.error).toBeTruthy()
  })
})
