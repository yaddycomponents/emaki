import { describe, expect, it } from 'vitest'
import { extractHandover } from '../src'

describe('extractHandover — the AI extraction target', () => {
  it('turns a lenient, id-less handover into a validated deck', () => {
    const r = extractHandover({
      title: 'Auto-reply',
      aspect: '9:16',
      theme: 'saas-product',
      scenes: [
        { type: 'title', kicker: 'Auto-reply', text: 'Your inbox, on autopilot.' },
        { type: 'stat', value: '92%', label: 'replies drafted' },
      ],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.deck.scenes.map((s) => s.id)).toEqual(['s1', 's2'])
    expect(r.deck.aspect).toBe('9:16')
    expect(r.notes.join(' ')).toMatch(/Assigned scene ids/)
  })

  it('accepts a ui-scene extracted from a screenshot as a node tree', () => {
    const r = extractHandover({
      scenes: [
        {
          type: 'ui-scene',
          caption: 'One reply, sent & logged',
          states: [
            { id: 'skeleton', hold: 1 },
            { id: 'loaded', hold: 2.5 },
          ],
          root: {
            kind: 'split',
            children: [
              { kind: 'col', w: 300, children: [{ kind: 'listRow', title: '52%', sub: '80%', active: true }] },
              { kind: 'col', children: [{ kind: 'bar', w: '52%', h: 14, text: 'Acme Corp · Invoice #4021' }] },
            ],
          },
        },
      ],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.deck.scenes[0]!.type).toBe('ui-scene')
  })

  it('supports both inline and nested props', () => {
    const r = extractHandover({
      scenes: [{ id: 'keep', type: 'statement', props: { text: 'Nested props work too.' } }],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.deck.scenes[0]!.id).toBe('keep')
  })

  it('localises a broken scene instead of one deep union error', () => {
    const r = extractHandover({
      scenes: [
        { type: 'title', text: 'Fine.' },
        { type: 'stat', value: '92%' }, // missing required `label`
        { type: 'no-such-block', foo: 1 },
      ],
    })
    expect(r.ok).toBe(false)
    if (r.ok) return
    const scenes = r.issues.map((i) => i.scene)
    expect(scenes).toContain(1)
    expect(scenes).toContain(2)
    expect(scenes).not.toContain(0)
  })

  it('refuses an empty handover with a helpful message', () => {
    const r = extractHandover({ scenes: [] })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.message).toMatch(/no scenes/i)
  })
})
