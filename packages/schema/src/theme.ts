import * as z from 'zod'

/**
 * The theme contract: the required tokens every theme must provide. Studio
 * chrome and blocks both derive their variables from this one contract, so
 * there is a single design system instead of two.
 *
 * A deck references a theme by id (string); the theme definitions themselves
 * live in `@emaki/themes` (Week 3). `.parse()` here enforces required keys so a
 * half-defined theme fails loudly instead of rendering with holes.
 */
export const ThemeContract = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    colors: z.object({
      bg: z.string(),
      surface: z.string(),
      text: z.string(),
      muted: z.string(),
      accent: z.string(),
    }),
    fonts: z.object({
      display: z.string(),
      body: z.string(),
      mono: z.string(),
    }),
  })
  .meta({ id: 'ThemeContract', description: 'Required design tokens every theme must provide.' })

export type ThemeContract = z.infer<typeof ThemeContract>
