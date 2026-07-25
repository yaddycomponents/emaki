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
