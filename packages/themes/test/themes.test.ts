import { describe, it, expect } from 'vitest'
import { ThemeContract } from '@emaki/schema'
import { THEMES, resolveTheme, warmEditorial, saasProduct } from '../src'

describe('themes', () => {
  it('registers both first-party themes', () => {
    expect(Object.keys(THEMES).sort()).toEqual(['saas-product', 'warm-editorial'])
  })

  it('every theme satisfies the schema ThemeContract', () => {
    for (const theme of Object.values(THEMES)) {
      const r = ThemeContract.safeParse({
        id: theme.id,
        name: theme.name,
        colors: theme.colors,
        fonts: theme.fonts,
      })
      expect(r.success).toBe(true)
    }
  })

  it('resolves by id and throws on unknown', () => {
    expect(resolveTheme('warm-editorial')).toBe(warmEditorial)
    expect(resolveTheme('saas-product')).toBe(saasProduct)
    expect(() => resolveTheme('nope')).toThrow(/Unknown theme/)
  })
})
