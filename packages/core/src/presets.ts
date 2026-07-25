import type { BezierPoints } from './easing'

/**
 * A channel is one animatable value. `y`/`x` are pixels; `yp` is a percentage
 * translateY (used by the mask reveal); the scale/rotate channels are unitless
 * / degrees. An `AnimSpec` is a preset resolved to concrete from→to tweens.
 */
export type Channel = 'opacity' | 'x' | 'y' | 'yp' | 'scale' | 'scaleX' | 'scaleY' | 'rotate'

export interface ChannelTween {
  from: number
  to: number
}

export type Channels = Partial<Record<Channel, ChannelTween>>

export interface AnimSpec {
  channels: Channels
  ease: BezierPoints
  duration: number
}

// The three eases ported from theme.js, plus a back-out for deterministic pop.
const EASE_OUT: BezierPoints = [0.22, 1, 0.36, 1]
const EASE_INOUT: BezierPoints = [0.65, 0, 0.35, 1]
const EASE_SOFT: BezierPoints = [0.4, 0, 0.2, 1]
const EASE_BACK: BezierPoints = [0.34, 1.56, 0.64, 1]

/** Default durations (seconds), ported from theme.js `dur`. */
export const DUR = { fast: 0.5, base: 0.8, slow: 1.2, draw: 1.1, count: 1.6 } as const

export interface PresetParams {
  y?: number
  fromScale?: number
  rotate?: number
  duration?: number
}

/**
 * The 11 motion presets, mapped once. Each returns an `AnimSpec` — pure data,
 * framework-agnostic. The Framer and Remotion adapters both consume these, so
 * the mapping lives in exactly one place.
 *
 * `drawIn` (SVG pathLength) and `flash` (background keyframes) are declared as
 * names but resolve to their nearest tween here so the initial four blocks —
 * title, statement, stat, compare-bars — render identically in both paths.
 * Their special-cased renderers land with the block that first needs them.
 */
export const PRESETS = {
  fadeUp: (p: PresetParams = {}): AnimSpec => ({
    channels: { opacity: { from: 0, to: 1 }, y: { from: p.y ?? 16, to: 0 } },
    ease: EASE_OUT,
    duration: p.duration ?? DUR.base,
  }),
  fadeIn: (p: PresetParams = {}): AnimSpec => ({
    channels: { opacity: { from: 0, to: 1 } },
    ease: EASE_OUT,
    duration: p.duration ?? DUR.base,
  }),
  maskReveal: (p: PresetParams = {}): AnimSpec => ({
    channels: { yp: { from: 115, to: 0 } },
    ease: EASE_OUT,
    duration: p.duration ?? 0.85,
  }),
  drawIn: (p: PresetParams = {}): AnimSpec => ({
    channels: { opacity: { from: 0, to: 1 } },
    ease: EASE_INOUT,
    duration: p.duration ?? DUR.draw,
  }),
  popIn: (p: PresetParams = {}): AnimSpec => ({
    channels: { opacity: { from: 0, to: 1 }, scale: { from: p.fromScale ?? 0.7, to: 1 } },
    ease: EASE_BACK,
    duration: p.duration ?? DUR.fast,
  }),
  spinIn: (p: PresetParams = {}): AnimSpec => ({
    channels: { opacity: { from: 0, to: 1 }, scale: { from: 0, to: 1 }, rotate: { from: 0, to: p.rotate ?? 45 } },
    ease: EASE_OUT,
    duration: p.duration ?? DUR.fast,
  }),
  growX: (p: PresetParams = {}): AnimSpec => ({
    channels: { scaleX: { from: 0, to: 1 } },
    ease: EASE_OUT,
    duration: p.duration ?? DUR.slow,
  }),
  growY: (p: PresetParams = {}): AnimSpec => ({
    channels: { scaleY: { from: 0, to: 1 } },
    ease: EASE_OUT,
    duration: p.duration ?? DUR.slow,
  }),
  growXFade: (p: PresetParams = {}): AnimSpec => ({
    channels: { opacity: { from: 0, to: 1 }, scaleX: { from: 0, to: 1 } },
    ease: EASE_OUT,
    duration: p.duration ?? DUR.base,
  }),
  flash: (p: PresetParams = {}): AnimSpec => ({
    channels: { opacity: { from: 1, to: 1 } },
    ease: EASE_OUT,
    duration: p.duration ?? 1.1,
  }),
  sceneSwap: (p: PresetParams = {}): AnimSpec => ({
    channels: { opacity: { from: 0, to: 1 }, x: { from: 60, to: 0 }, scale: { from: 0.99, to: 1 } },
    ease: EASE_OUT,
    duration: p.duration ?? 0.55,
  }),
} satisfies Record<string, (p?: PresetParams) => AnimSpec>

export type PresetName = keyof typeof PRESETS

export function resolvePreset(name: PresetName, params?: PresetParams): AnimSpec {
  return PRESETS[name](params)
}
