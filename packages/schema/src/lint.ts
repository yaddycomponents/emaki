/**
 * Glyph lint. A silent missing-glyph box (tofu) in the render looks like a data
 * bug, not a font gap — the worst failure mode. This flags characters the
 * default render fonts likely can't draw so validate/build can WARN, before a
 * render comes out looking broken.
 *
 * Heuristic, not exhaustive: it allows Basic Latin, Latin-1 + Extended-A (for
 * accented names), and a whitelist of common typographic punctuation; anything
 * else — fullwidth plus (＋), dingbats (✦), arrows (→), emoji, CJK — is flagged.
 */

const SAFE_PUNCT = new Set([
  '–', // – en dash
  '—', // — em dash
  '…', // … ellipsis
  '‘', // ' left single quote
  '’', // ' right single quote
  '“', // " left double quote
  '”', // " right double quote
  '•', // • bullet
  '€', // € euro
  '™', // ™
  '©', // ©
  '®', // ®
])

function isSafeCodepoint(cp: number): boolean {
  if (cp === 0x09 || cp === 0x0a || cp === 0x0d) return true // tab / LF / CR
  if (cp >= 0x20 && cp <= 0x7e) return true // Basic Latin
  if (cp >= 0x00a0 && cp <= 0x017f) return true // Latin-1 Supplement + Extended-A
  return SAFE_PUNCT.has(String.fromCodePoint(cp))
}

/** Distinct characters in `s` that the default fonts likely can't render. */
export function suspiciousGlyphs(s: string): string[] {
  const found = new Set<string>()
  for (const ch of s) {
    const cp = ch.codePointAt(0)
    if (cp !== undefined && !isSafeCodepoint(cp)) found.add(ch)
  }
  return [...found]
}

/** Every distinct suspicious glyph across all text in a deck (walks all strings). */
export function lintDeckGlyphs(deck: unknown): string[] {
  const found = new Set<string>()
  const walk = (v: unknown): void => {
    if (typeof v === 'string') for (const g of suspiciousGlyphs(v)) found.add(g)
    else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v as Record<string, unknown>).forEach(walk)
  }
  walk(deck)
  return [...found]
}

/** A one-line warning for a set of flagged glyphs, or null if clean. */
export function glyphWarning(deck: unknown): string | null {
  const bad = lintDeckGlyphs(deck)
  if (bad.length === 0) return null
  const list = bad.map((g) => `"${g}"`).join(' ')
  return `⚠ ${bad.length} glyph(s) may render as blank boxes with the default fonts: ${list}. Replace them (e.g. use "+" not "＋", "->" not "→") or set a theme font that covers them.`
}
