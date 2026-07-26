import { describe, expect, it } from 'vitest'
import { assertThemeValid, buildTheme } from '../src'

describe('buildTheme — brand → full valid theme', () => {
  it('fills the full contract from a minimal brand', () => {
    const theme = buildTheme({ name: 'Acme Corp', accent: '#5533ff' })
    expect(() => assertThemeValid(theme)).not.toThrow()
    expect(theme.id).toBe('acme-corp')
    expect(theme.colors.accent).toBe('#5533ff')
    // derived tokens are all present
    expect(theme.colors.surface).toMatch(/^#/)
    expect(theme.colors.muted).toMatch(/^#/)
    expect(theme.data.beforeBar).toBe('#5533ff')
    expect(Object.keys(theme.type)).toHaveLength(11)
  })

  it('defaults to a light theme, and infers dark from a dark bg', () => {
    const light = buildTheme({ name: 'L', accent: '#0af' })
    expect(light.colors.bg).toBe('#ffffff')
    const dark = buildTheme({ name: 'D', accent: '#0af', bg: '#0b0d12' })
    expect(dark.colors.bg).toBe('#0b0d12')
    // dark text is lighter than dark bg
    expect(dark.colors.text).not.toBe(light.colors.text)
  })

  it('honours explicit overrides and custom fonts', () => {
    const theme = buildTheme({
      name: 'Brandy',
      id: 'brandy-x',
      accent: '#e0484d',
      bg: '#101317',
      text: '#eaeaea',
      fonts: { display: "'Custom Display', serif" },
    })
    expect(theme.id).toBe('brandy-x')
    expect(theme.colors.bg).toBe('#101317')
    expect(theme.fonts.display).toBe("'Custom Display', serif")
    expect(theme.fonts.mono).toMatch(/mono/i) // fell back to a system mono stack
  })

  it('is deterministic', () => {
    const a = buildTheme({ name: 'Same', accent: '#123456' })
    const b = buildTheme({ name: 'Same', accent: '#123456' })
    expect(a).toEqual(b)
  })

  it('throws a clear error without a name or accent', () => {
    // @ts-expect-error missing accent
    expect(() => buildTheme({ name: 'X' })).toThrow(/accent/)
    // @ts-expect-error missing name
    expect(() => buildTheme({ accent: '#fff' })).toThrow(/name/)
  })
})
