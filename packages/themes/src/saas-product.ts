import type { Theme } from './theme'

/**
 * Ported from the v1 AI-Reply deck's `tokens.js` — a real product UI in
 * grey/white with a purple primary. Proves the block set holds across a second,
 * unrelated visual language (the Week-3 gate).
 */
export const saasProduct: Theme = {
  id: 'saas-product',
  name: 'SaaS Product',
  colors: {
    bg: '#f3f4f7',
    surface: '#ffffff',
    text: '#1d2130',
    muted: '#7f8593',
    accent: 'rgb(83,29,171)',
  },
  fonts: {
    display: "'Space Grotesk', -apple-system, 'Segoe UI', Roboto, sans-serif",
    body: "'Space Grotesk', -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "'Space Mono', ui-monospace, 'SFMono-Regular', monospace",
  },
  data: {
    beforeBar: '#e0484d',
    beforeNum: '#e0484d',
    afterBar: '#17935f',
    afterNum: '#17935f',
    peach: '#e0852f',
    mint: '#17935f',
  },
  type: {
    eyebrow: 'clamp(10px, 0.85vw, 13px)',
    body: 'clamp(14px, 1.25vw, 20px)',
    label: 'clamp(12px, 1.0vw, 16px)',
    rowLabel: 'clamp(12px, 1.0vw, 16px)',
    metric: 'clamp(20px, 2.0vw, 32px)',
    h2: 'clamp(30px, 3.8vw, 60px)',
    chapter: 'clamp(40px, 5.6vw, 92px)',
    statement: 'clamp(40px, 5.6vw, 92px)',
    display: 'clamp(40px, 5.6vw, 92px)',
    hero: 'clamp(40px, 6vw, 104px)',
    stat: 'clamp(40px, 6vw, 104px)',
  },
  track: {
    eyebrow: '0.18em',
    label: '0.1em',
  },
}
