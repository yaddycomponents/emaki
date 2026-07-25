/**
 * The full token shape blocks render against — a superset of the schema's
 * `ThemeContract` (which enforces the required `colors`/`fonts` keys). Every
 * first-party theme provides all of these so any block looks right in any theme.
 */
export interface Theme {
  id: string
  name: string
  colors: {
    bg: string
    surface: string
    text: string
    muted: string
    accent: string
  }
  fonts: {
    display: string
    body: string
    mono: string
  }
  /** Before/after comparison colours + two decorative accents. */
  data: {
    beforeBar: string
    beforeNum: string
    afterBar: string
    afterNum: string
    peach: string
    mint: string
  }
  /** Named type sizes (CSS clamp() strings) used across blocks. */
  type: {
    eyebrow: string
    body: string
    label: string
    rowLabel: string
    metric: string
    h2: string
    chapter: string
    statement: string
    display: string
    hero: string
    stat: string
  }
  track: {
    eyebrow: string
    label: string
  }
}
