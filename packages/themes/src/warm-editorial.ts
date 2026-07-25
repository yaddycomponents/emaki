import type { Theme } from './theme'

/** Ported verbatim from the v1 deck's `theme.js` — Yeseva One over cream. */
export const warmEditorial: Theme = {
  id: 'warm-editorial',
  name: 'Warm Editorial',
  colors: {
    bg: '#f4e7d6',
    surface: '#f6ead9',
    text: '#5e3b46',
    muted: '#8a6470',
    accent: '#a8536a',
  },
  fonts: {
    display: "'Yeseva One', Georgia, serif",
    body: "'Josefin Sans', system-ui, sans-serif",
    mono: "'Space Mono', ui-monospace, monospace",
  },
  data: {
    beforeBar: '#c97a8a',
    beforeNum: '#a8536a',
    afterBar: '#8aa9a6',
    afterNum: '#5b7d77',
    peach: '#e8b9a0',
    mint: '#cdd8c4',
  },
  type: {
    eyebrow: 'clamp(11px, 1.1cqw, 15px)',
    body: 'clamp(16px, 2.1cqw, 28px)',
    label: 'clamp(11px, 1.2cqw, 16px)',
    rowLabel: 'clamp(15px, 1.6cqw, 21px)',
    metric: 'clamp(17px, 2.1cqw, 28px)',
    h2: 'clamp(26px, 4cqw, 58px)',
    chapter: 'clamp(34px, 5.5cqw, 76px)',
    statement: 'clamp(38px, 7cqw, 92px)',
    display: 'clamp(40px, 8cqw, 120px)',
    hero: 'clamp(64px, 13cqw, 200px)',
    stat: 'clamp(40px, 6.5cqw, 96px)',
  },
  track: {
    eyebrow: '0.32em',
    label: '0.18em',
  },
}
