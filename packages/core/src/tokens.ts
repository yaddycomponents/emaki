/**
 * Design tokens ported from the v1 `theme.js` (the warm-editorial language).
 * These will move to `@emaki/themes` in Week 3; kept here now so the engine and
 * blocks have a token contract to render against. The keys a theme MUST provide
 * are enforced by `ThemeContract` in `@emaki/schema`.
 */

const palette = {
  cream: '#f4e7d6',
  rose: '#d98c9a',
  sage: '#8aa9a6',
  paper: '#f6ead9',
  plum: '#5e3b46',
  plumDeep: '#6b4a55',
  mauve: '#8a6470',
  mauveSoft: '#a86e7c',
  roseBar: '#c97a8a',
  roseHot: '#a8536a',
  sageBar: '#8aa9a6',
  sageDeep: '#5b7d77',
  peach: '#e8b9a0',
  mint: '#cdd8c4',
  rule: '#d8b9ab',
} as const

export const warmEditorial = {
  id: 'warm-editorial',
  name: 'Warm Editorial',
  colors: {
    bg: palette.cream,
    surface: palette.paper,
    text: palette.plum,
    muted: palette.mauve,
    accent: palette.roseHot,
  },
  fonts: {
    display: "'Yeseva One', Georgia, serif",
    body: "'Josefin Sans', system-ui, sans-serif",
    mono: "'Space Mono', ui-monospace, monospace",
  },
  data: {
    beforeBar: palette.roseBar,
    beforeNum: palette.roseHot,
    afterBar: palette.sageBar,
    afterNum: palette.sageDeep,
    peach: palette.peach,
    mint: palette.mint,
  },
  type: {
    eyebrow: 'clamp(11px, 1.1vw, 15px)',
    body: 'clamp(16px, 2.1vw, 28px)',
    label: 'clamp(11px, 1.2vw, 16px)',
    rowLabel: 'clamp(15px, 1.6vw, 21px)',
    metric: 'clamp(17px, 2.1vw, 28px)',
    h2: 'clamp(26px, 4vw, 58px)',
    chapter: 'clamp(34px, 5.5vw, 76px)',
    statement: 'clamp(38px, 7vw, 92px)',
    display: 'clamp(40px, 8vw, 120px)',
    hero: 'clamp(64px, 13vw, 200px)',
    stat: 'clamp(40px, 6.5vw, 96px)',
  },
  track: {
    eyebrow: '0.32em',
    label: '0.18em',
  },
} as const

export type Tokens = typeof warmEditorial
