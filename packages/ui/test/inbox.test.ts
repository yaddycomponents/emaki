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

import { explainNode } from '../src'

describe('ui scene — layout controls + node errors', () => {
  it('parses justify/align on containers', () => {
    const p = uiSceneProps.parse({
      root: { kind: 'row', justify: 'between', align: 'center', children: [{ kind: 'text', value: 'a' }, { kind: 'text', value: 'b' }] },
    })
    const root = p.root as { justify?: string; align?: string }
    expect(root.justify).toBe('between')
    expect(root.align).toBe('center')
  })

  it('explainNode names the bad leaf, field, and valid values (the rowLabel case)', () => {
    const e = explainNode({ kind: 'col', children: [{ kind: 'text', value: 'Compose', size: 'rowLabel' }] })
    expect(e).toMatch(/children\[0\] \(text\): size/)
    expect(e).toMatch(/body/) // lists the valid options
    expect(e).not.toMatch(/rowLabel"?\s*(is|:)?\s*valid/) // it's rejected, not accepted
  })

  it('explainNode flags an unknown kind and returns null for a valid tree', () => {
    expect(explainNode({ kind: 'col', children: [{ kind: 'blorp' }] })).toMatch(/unknown kind "blorp"/)
    expect(explainNode({ kind: 'row', justify: 'between', children: [{ kind: 'text', value: 'ok' }] })).toBeNull()
  })
})

describe('ui scene — chrome, transitions, product primitives', () => {
  it('parses chrome + transition scene props with defaults', () => {
    const bare = uiSceneProps.parse({ root: { kind: 'col', children: [{ kind: 'text', value: 'x' }] } })
    expect(bare.chrome).toBe('none')
    expect(bare.transition).toBe('crossfade')
    expect(bare.transitionMs).toBe(420)
    const app = uiSceneProps.parse({ chrome: 'app', title: 'Growfin', transition: 'cut', root: { kind: 'col', children: [{ kind: 'text', value: 'x' }] } })
    expect(app.chrome).toBe('app')
    expect(app.title).toBe('Growfin')
    expect(app.transition).toBe('cut')
  })

  it('parses the product-UI primitives', () => {
    const p = uiSceneProps.parse({
      root: {
        kind: 'col',
        children: [
          { kind: 'button', label: 'Reply', icon: 'mail', variant: 'filled' },
          { kind: 'checkbox', checked: true, label: 'Done' },
          { kind: 'chip', label: 'Overdue', active: true, color: '#ef4444' },
          { kind: 'tabs', items: ['All', 'Unread'], active: 1 },
          { kind: 'search', placeholder: 'Find' },
        ],
      },
    })
    expect(p.root.children.map((c) => (c as { kind: string }).kind)).toEqual([
      'button',
      'checkbox',
      'chip',
      'tabs',
      'search',
    ])
  })

  it('rejects an out-of-allowlist button icon', () => {
    expect(() =>
      uiSceneProps.parse({ root: { kind: 'col', children: [{ kind: 'button', label: 'x', icon: 'not-an-icon' }] } }),
    ).toThrow()
  })
})

describe('ui scene — image leaf (logo/screenshot)', () => {
  it('parses an image node with a local path and defaults', () => {
    const p = uiSceneProps.parse({
      root: { kind: 'col', children: [{ kind: 'image', src: 'assets/logo.svg', w: 40, h: 40 }] },
    })
    const img = (p.root.children[0] as { kind: string; src: string; fit: string; radius: number })
    expect(img.kind).toBe('image')
    expect(img.src).toBe('assets/logo.svg')
    expect(img.fit).toBe('contain')
    expect(img.radius).toBe(0)
  })
})

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
