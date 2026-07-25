import type { Channel } from './presets'

/**
 * Compose channel values into a CSS style. BOTH adapters route through this, so
 * the transform channel order is identical between preview and render — the
 * thing that makes the two paths line up pixel-for-pixel.
 */
export interface RenderStyle {
  opacity?: number
  transform?: string
}

export type ChannelValues = Partial<Record<Channel, number>>

export function composeStyle(v: ChannelValues): RenderStyle {
  const style: RenderStyle = {}
  if (v.opacity !== undefined) style.opacity = v.opacity

  const parts: string[] = []
  const hasTranslate = v.x !== undefined || v.y !== undefined || v.yp !== undefined
  if (hasTranslate) {
    const x = `${v.x ?? 0}px`
    const y = v.yp !== undefined ? `${v.yp}%` : `${v.y ?? 0}px`
    parts.push(`translate(${x}, ${y})`)
  }
  if (v.scale !== undefined) parts.push(`scale(${v.scale})`)
  if (v.scaleX !== undefined) parts.push(`scaleX(${v.scaleX})`)
  if (v.scaleY !== undefined) parts.push(`scaleY(${v.scaleY})`)
  if (v.rotate !== undefined) parts.push(`rotate(${v.rotate}deg)`)
  if (parts.length) style.transform = parts.join(' ')

  return style
}
