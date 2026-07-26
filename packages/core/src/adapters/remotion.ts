import { cubicBezier, clamp, lerp } from '../easing'
import { type Channel } from '../presets'
import { composeStyle, type ChannelValues, type RenderStyle } from '../compose'
import { stepSpec, type TimelineStep, type Timeline } from '../timeline'

export interface FrameCtx {
  frame: number
  fps: number
}

/** The animated style for one step at a given frame — deterministic, no clock. */
export function stepStyleAt(step: TimelineStep, ctx: FrameCtx): RenderStyle {
  const spec = stepSpec(step)
  const t = ctx.frame / ctx.fps
  const local = spec.duration <= 0 ? 1 : clamp((t - (step.at ?? 0)) / spec.duration, 0, 1)
  const eased = cubicBezier(spec.ease)(local)

  const values: ChannelValues = {}
  for (const key of Object.keys(spec.channels) as Channel[]) {
    const tween = spec.channels[key]
    if (tween) values[key] = lerp(tween.from, tween.to, eased)
  }
  return composeStyle(values)
}

/**
 * The merged style for a target element at a frame — the composition of every
 * step that drives it. Later steps win on shared channels. This is what a
 * Remotion block component spreads onto the target.
 */
export function targetStyleAt(timeline: Timeline, target: string, ctx: FrameCtx): RenderStyle {
  const merged: RenderStyle = {}
  for (const step of timeline) {
    if (step.target !== target) continue
    Object.assign(merged, stepStyleAt(step, ctx))
  }
  return merged
}
