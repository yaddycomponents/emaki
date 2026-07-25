import { ThemeContract } from '@emaki/schema'
import type { Theme } from './theme'
import { warmEditorial } from './warm-editorial'
import { saasProduct } from './saas-product'

export const DEFAULT_THEME_ID = 'warm-editorial'

export const THEMES: Record<string, Theme> = {
  [warmEditorial.id]: warmEditorial,
  [saasProduct.id]: saasProduct,
}

/** Validate that a theme provides the required contract keys — fail loudly. */
export function assertThemeValid(theme: Theme): void {
  ThemeContract.parse({ id: theme.id, name: theme.name, colors: theme.colors, fonts: theme.fonts })
}

for (const theme of Object.values(THEMES)) assertThemeValid(theme)

export function resolveTheme(id: string): Theme {
  const theme = THEMES[id]
  if (!theme) {
    throw new Error(`Unknown theme "${id}". Available: ${Object.keys(THEMES).join(', ')}`)
  }
  return theme
}
