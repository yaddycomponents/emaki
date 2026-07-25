import * as z from 'zod'

/**
 * Output aspect ratio. Every block declares a layout per aspect; the deck only
 * picks one. 9:16 is the social wedge, so it is the default.
 */
export const Aspect = z.enum(['16:9', '1:1', '9:16']).meta({
  id: 'Aspect',
  title: 'Aspect ratio',
  description: 'Output aspect ratio. 9:16 is the social wedge.',
})

export type Aspect = z.infer<typeof Aspect>

/** Pixel dimensions for each aspect, used by the render host. */
export const ASPECT_DIMENSIONS: Record<Aspect, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
}
