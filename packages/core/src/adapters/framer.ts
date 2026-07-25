import { resolvePreset, type Channel } from '../presets'
import type { TimelineStep } from '../timeline'

/**
 * Framer Motion props for one step. Framer receives the same bezier control
 * points as the Remotion adapter, so both ease identically. `x` is px, `yp`
 * maps to Framer's `y` as a percentage string; the rest pass straight through.
 */
export interface FramerProps {
  initial: Record<string, number | string>
  animate: Record<string, number | string>
  transition: { duration: number; delay: number; ease: readonly number[] }
}

function channelToFramer(
  channel: Channel,
  value: number,
): [string, number | string] {
  switch (channel) {
    case 'yp':
      return ['y', `${value}%`]
    default:
      return [channel, value]
  }
}

export function stepToFramer(step: TimelineStep): FramerProps {
  const spec = resolvePreset(step.preset, step.params)
  const initial: Record<string, number | string> = {}
  const animate: Record<string, number | string> = {}

  for (const key of Object.keys(spec.channels) as Channel[]) {
    const tween = spec.channels[key]
    if (!tween) continue
    const [prop, from] = channelToFramer(key, tween.from)
    const [, to] = channelToFramer(key, tween.to)
    initial[prop] = from
    animate[prop] = to
  }

  return {
    initial,
    animate,
    transition: { duration: spec.duration, delay: step.at ?? 0, ease: spec.ease },
  }
}
