import { describe, it, expect } from 'vitest'
import { uiSceneProps, sequence, stateAt, visibleIn, uiSceneDuration, statesDuration } from '../src'

// v1's InboxScene re-expressed as a node tree — the gate: can the schema hold
// the scene we already know is good?
const listRow = (active = false, ai = false) => ({
  kind: 'listRow' as const,
  title: active ? '52%' : '46%',
  sub: '80%',
  active,
  ...(ai ? { badge: 'AI Replied' } : {}),
})

const INBOX = {
  chrome: 'app',
  caption: 'One reply, sent & logged — even a Promise-to-Pay created',
  states: [
    { id: 'skeleton', hold: 1.0 },
    { id: 'loaded', hold: 2.5 },
  ],
  root: {
    kind: 'split',
    children: [
      {
        kind: 'col',
        w: 380,
        children: [
          { kind: 'col', gap: 9, children: [{ kind: 'bar', w: '42%' }, { kind: 'bar', w: '24%', lite: true }] },
          listRow(),
          listRow(true, true),
          listRow(),
          listRow(false, true),
          listRow(),
          listRow(),
        ],
      },
      {
        kind: 'col',
        gap: 14,
        children: [
          { kind: 'bar', w: '52%', h: 14, text: 'Acme Corp · Invoice #4021' },
          {
            kind: 'card',
            children: [
              { kind: 'text', value: 'Summary', tone: 'primary', weight: 'bold' },
              { kind: 'bar', w: '72%', h: 7, lite: true },
            ],
          },
          { kind: 'col', children: [{ kind: 'dot' }, { kind: 'bar', w: '92%', h: 8, lite: true }] },
          {
            kind: 'col',
            children: [
              { kind: 'dot' },
              { kind: 'badge', label: 'AI Replied' },
              // exists only after the load
              { kind: 'card', in: ['loaded'], children: [{ kind: 'text', value: 'Activity created · PTP001', tone: 'primary' }] },
            ],
          },
        ],
      },
    ],
  },
}

describe('ui scene — InboxScene as data (the gate)', () => {
  const parsed = uiSceneProps.parse(INBOX)

  it('the schema expresses InboxScene', () => {
    expect(parsed.states).toHaveLength(2)
    expect(parsed.root.kind).toBe('split')
    expect(parsed.root.children).toHaveLength(2)
  })

  it('derives reveal order from the tree — later siblings reveal later', () => {
    const { placed } = sequence(parsed.root)
    const rows = placed.filter((p) => p.node.kind === 'listRow')
    expect(rows).toHaveLength(6)
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]!.reveal).toBeGreaterThan(rows[i - 1]!.reveal)
    }
  })

  it('scene duration comes from the state holds (entrance fits inside)', () => {
    expect(uiSceneDuration(parsed)).toBeGreaterThanOrEqual(statesDuration(parsed.states))
    expect(statesDuration(parsed.states)).toBe(3.5)
  })

  it('states resolve over time', () => {
    expect(stateAt(parsed.states, 0.5)).toBe('skeleton')
    expect(stateAt(parsed.states, 2.0)).toBe('loaded')
  })

  it('nodes can restrict themselves to a state (the activity card)', () => {
    const conv = parsed.root.children[1] as { children: { children?: { in?: string[] }[] }[] }
    const activityCard = conv.children[3]!.children![2]!
    expect(visibleIn(activityCard as never, 'skeleton')).toBe(false)
    expect(visibleIn(activityCard as never, 'loaded')).toBe(true)
  })
})
