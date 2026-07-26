import { ThemeContract } from '@emaki/schema'
import type { Theme } from './theme'

/**
 * A *brand* is what the host model extracts from a logo, screenshot, or brand
 * guide — a name and a handful of colours. Emaki never looks at the source; it
 * turns those extracted tokens into a full, valid theme deterministically:
 * derived surface/muted, a good/bad data palette, and the shared type scale.
 *
 * It invents nothing structural — every colour is either given or derived from a
 * given one. Missing fonts fall back to system stacks so an imported theme
 * always renders, even when the brand font isn't installed.
 */
export interface BrandInput {
  name: string
  /** Theme id (slug). Derived from `name` when omitted. */
  id?: string
  /** The one brand colour. Required — it becomes `accent`. */
  accent: string
  /** 'light' | 'dark'. Inferred from `bg` if given, else 'light'. */
  mode?: 'light' | 'dark'
  bg?: string
  surface?: string
  text?: string
  muted?: string
  fonts?: { display?: string; body?: string; mono?: string }
}

interface RGB {
  r: number
  g: number
  b: number
}

function parseHex(input: string): RGB | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim())
  if (!m) return null
  let h = m[1]!
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}

function toHex({ r, g, b }: RGB): string {
  const h = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

/** Mix two colours; t=0 → a, t=1 → b. Falls back to `a` if either isn't hex. */
function mix(a: string, b: string, t: number): string {
  const ca = parseHex(a)
  const cb = parseHex(b)
  if (!ca || !cb) return a
  return toHex({ r: ca.r + (cb.r - ca.r) * t, g: ca.g + (cb.g - ca.g) * t, b: ca.b + (cb.b - ca.b) * t })
}

/** Relative luminance (0 dark … 1 light). Unknown colours read as mid-light. */
function luminance(color: string): number {
  const c = parseHex(color)
  if (!c) return 0.6
  return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255
}

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'brand'
  )
}

/** The brand-agnostic type scale (cqw so it resolves to the scene box at any size). */
const TYPE_SCALE: Theme['type'] = {
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
}

const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
const MONO = "ui-monospace, 'SF Mono', 'JetBrains Mono', monospace"

export function buildTheme(brand: BrandInput): Theme {
  if (!brand || typeof brand !== 'object') throw new Error('buildTheme needs a brand object.')
  if (!brand.name) throw new Error('buildTheme needs a `name`.')
  if (!brand.accent) throw new Error('buildTheme needs an `accent` colour.')

  const mode = brand.mode ?? (brand.bg ? (luminance(brand.bg) < 0.5 ? 'dark' : 'light') : 'light')
  const accent = brand.accent

  const bg = brand.bg ?? (mode === 'dark' ? '#15181e' : '#ffffff')
  const text = brand.text ?? (mode === 'dark' ? '#f2f3f5' : '#1a1d21')
  const surface = brand.surface ?? mix(bg, mode === 'dark' ? '#ffffff' : text, mode === 'dark' ? 0.06 : 0.03)
  const muted = brand.muted ?? mix(text, bg, 0.42)

  const afterBar = '#3f9b6d'
  const afterNum = '#2f7d55'

  const theme: Theme = {
    id: brand.id ?? slug(brand.name),
    name: brand.name,
    colors: { bg, surface, text, muted, accent },
    fonts: {
      display: brand.fonts?.display ?? SANS,
      body: brand.fonts?.body ?? SANS,
      mono: brand.fonts?.mono ?? MONO,
    },
    data: {
      beforeBar: accent,
      beforeNum: mix(accent, '#000000', 0.15),
      afterBar,
      afterNum,
      peach: mix(accent, bg, 0.6),
      mint: mix(afterBar, bg, 0.6),
    },
    type: TYPE_SCALE,
    track: { eyebrow: '0.28em', label: '0.16em' },
  }

  // Fail loudly if the derived theme somehow misses a required contract key.
  ThemeContract.parse({ id: theme.id, name: theme.name, colors: theme.colors, fonts: theme.fonts })
  return theme
}
