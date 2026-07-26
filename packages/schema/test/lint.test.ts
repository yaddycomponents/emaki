import { describe, expect, it } from 'vitest'
import { glyphWarning, lintDeckGlyphs, suspiciousGlyphs } from '../src'

describe('glyph lint', () => {
  it('flags tofu-prone glyphs, allows normal typography', () => {
    expect(suspiciousGlyphs('Compose ＋ reply →')).toEqual(expect.arrayContaining(['＋', '→']))
    expect(suspiciousGlyphs('Acme Corp · Invoice #4021 — overdue…')).toEqual([]) // ·, —, … are safe
    expect(suspiciousGlyphs('café — naïve — Zürich')).toEqual([]) // accented Latin is safe
  })

  it('walks a whole deck for suspicious glyphs', () => {
    const deck = {
      version: 1,
      scenes: [
        { id: 'a', type: 'title', props: { text: 'Fine text' } },
        { id: 'b', type: 'statement', props: { text: 'Broken ✦ glyph' } },
      ],
    }
    expect(lintDeckGlyphs(deck)).toContain('✦')
    expect(glyphWarning(deck)).toMatch(/may render as blank boxes/)
  })

  it('returns null for a clean deck', () => {
    expect(glyphWarning({ scenes: [{ props: { text: 'All good.' } }] })).toBeNull()
  })
})
