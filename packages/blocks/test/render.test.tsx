import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseDeck, type Aspect } from '@emaki/schema'
import { Block, BLOCKS, ALL_BLOCK_TYPES, blockAnimationEnd } from '../src'

const parsed = parseDeck({
  version: 1,
  scenes: [
    { id: 't', type: 'title', props: { kicker: 'Emaki', text: 'Films from a JSON file.' } },
    { id: 's', type: 'statement', props: { text: 'We cleared the debt.', emphasis: ['cleared'] } },
    { id: 'n', type: 'stat', props: { value: '5,400', label: 'lines deleted', caption: 'across three repos' } },
    {
      id: 'c',
      type: 'compare-bars',
      props: { title: 'Bundle', unit: 'kB', rows: [{ label: 'raw', before: 247, after: 114 }] },
    },
  ],
})
if (!parsed.ok) throw new Error('fixture deck should be valid')
const deck = parsed.deck

const aspects: Aspect[] = ['16:9', '9:16']

describe('block rendering', () => {
  it('registers all four block types with a 16:9 layout', () => {
    expect(ALL_BLOCK_TYPES.sort()).toEqual(['compare-bars', 'stat', 'statement', 'title'])
    for (const b of Object.values(BLOCKS)) expect(b.layouts['16:9']).toBeTruthy()
  })

  for (const aspect of aspects) {
    for (const scene of deck.scenes) {
      it(`renders ${scene.type} at ${aspect} to non-empty static markup`, () => {
        const html = renderToStaticMarkup(createElement(Block, { scene, aspect }))
        expect(html.length).toBeGreaterThan(20)
      })
    }
  }

  it('renders the emphasised substring inside the statement', () => {
    const scene = deck.scenes[1]!
    const html = renderToStaticMarkup(createElement(Block, { scene, aspect: '16:9' }))
    expect(html).toContain('cleared')
  })

  it('gives every block a positive animation-end time', () => {
    for (const type of ALL_BLOCK_TYPES) expect(blockAnimationEnd(type)).toBeGreaterThan(0)
  })
})
