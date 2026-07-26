import type { Deck } from '@emaki/schema'

/** The deck the studio opens with — every block type, so the tree is explorable. */
export const SAMPLE_DECK: Deck = {
  version: 1,
  title: 'Untitled',
  aspect: '9:16',
  theme: 'warm-editorial',
  wordsPerSecond: 2.2,
  scenes: [
    { id: 'open', type: 'title', props: { kicker: 'Emaki', text: 'Films from a JSON file.' } },
    { id: 'why', type: 'statement', props: { text: 'One deck. One engine. Two matching paths.', emphasis: ['matching'] } },
    { id: 'chapter', type: 'chapter', props: { number: '01', title: 'What shipped' } },
    { id: 'steps', type: 'list', props: { title: 'The batch', items: ['Schema', 'Blocks', 'Two render paths'] } },
    { id: 'proof', type: 'stat', props: { value: '30s', label: 'vertical film', caption: 'rendered locally' } },
  ],
}

export interface TemplateMeta {
  id: string
  name: string
  author: string
  aspects: string
  scenes: number
  theme: string
  community?: boolean
}

export const TEMPLATES: TemplateMeta[] = [
  { id: 'release-notes', name: 'release-notes', author: 'emaki', aspects: '16:9 · 9:16', scenes: 8, theme: 'warm-editorial' },
  { id: 'bundle-diff', name: 'bundle-diff', author: 'emaki', aspects: '16:9 · 9:16', scenes: 6, theme: 'saas-product' },
  { id: 'lighthouse-story', name: 'lighthouse-story', author: 'emaki', aspects: '9:16', scenes: 7, theme: 'saas-product' },
  { id: 'changelog-scroll', name: 'changelog-scroll', author: 'emaki', aspects: '16:9', scenes: 9, theme: 'warm-editorial' },
  { id: 'quote-card', name: 'quote-card', author: 'community', aspects: '1:1 · 9:16', scenes: 3, theme: 'warm-editorial', community: true },
  { id: 'before-after', name: 'before-after', author: 'community', aspects: '16:9 · 9:16', scenes: 5, theme: 'saas-product', community: true },
]

export const TEMPLATE_DECKS: Record<string, Deck> = {
  'release-notes': {
    version: 1,
    title: 'v1.3.0',
    aspect: '9:16',
    theme: 'warm-editorial',
    wordsPerSecond: 2.2,
    scenes: [
      { id: 'open', type: 'title', props: { kicker: 'Release', text: 'What shipped in v1.3.0' } },
      { id: 'chapter', type: 'chapter', props: { number: '01', title: 'Highlights' } },
      { id: 'list', type: 'list', props: { title: 'This release', items: ['Faster cold start', 'New extract API', 'Dark mode'] } },
      { id: 'stat', type: 'stat', props: { value: '2.1×', label: 'faster boot', caption: 'p95 across the fleet' } },
      { id: 'close', type: 'statement', props: { text: 'Update today.', emphasis: ['today'] } },
    ],
  },
  'bundle-diff': {
    version: 1,
    title: 'Bundle diff',
    aspect: '9:16',
    theme: 'saas-product',
    wordsPerSecond: 2.2,
    scenes: [
      { id: 'open', type: 'title', props: { kicker: 'Bundle', text: 'We cut the bundle in half.' } },
      { id: 'bars', type: 'compare-bars', props: { title: 'Raw size', unit: 'kB', rows: [{ label: 'raw', before: 247, after: 114 }] } },
      { id: 'stat', type: 'stat', props: { value: '−54%', label: 'gzipped', caption: 'tree-shakeable subpaths' } },
    ],
  },
  'quote-card': {
    version: 1,
    title: 'Quote',
    aspect: '1:1',
    theme: 'warm-editorial',
    wordsPerSecond: 2.2,
    scenes: [
      { id: 'q', type: 'statement', props: { text: 'The best deck is a JSON file.', emphasis: ['JSON file'] } },
      { id: 'who', type: 'title', props: { kicker: '—', text: 'Emaki' } },
    ],
  },
}
