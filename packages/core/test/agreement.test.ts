import { describe, it, expect } from 'vitest'
import {
  PRESETS,
  resolvePreset,
  stepToFramer,
  stepStyleAt,
  composeStyle,
  timelineEnd,
  type PresetName,
  type Channel,
  type ChannelValues,
} from '../src'

const FPS = 30
const names = Object.keys(PRESETS) as PresetName[]

// Reconstruct channel values from Framer props so we can compose them the same
// way the Remotion path does — this is the apples-to-apples comparison.
function framerToChannels(props: Record<string, number | string>): ChannelValues {
  const v: ChannelValues = {}
  for (const [prop, raw] of Object.entries(props)) {
    if (prop === 'y' && typeof raw === 'string' && raw.endsWith('%')) {
      v.yp = parseFloat(raw)
    } else {
      v[prop as Channel] = typeof raw === 'string' ? parseFloat(raw) : raw
    }
  }
  return v
}

describe('Framer ⇔ Remotion agreement', () => {
  for (const name of names) {
    it(`${name}: both adapters agree at the start and end of the tween`, () => {
      const step = { target: 'el', preset: name }
      const spec = resolvePreset(name)
      const framer = stepToFramer(step)

      const framerStart = composeStyle(framerToChannels(framer.initial))
      const framerEnd = composeStyle(framerToChannels(framer.animate))

      const remotionStart = stepStyleAt(step, { frame: 0, fps: FPS })
      const remotionEnd = stepStyleAt(step, { frame: Math.round(spec.duration * FPS), fps: FPS })

      expect(remotionStart).toEqual(framerStart)
      expect(remotionEnd).toEqual(framerEnd)

      // Framer eases with the identical control points, so shared easing means
      // the whole tween matches, not just the endpoints.
      expect(framer.transition.ease).toEqual(spec.ease)
    })
  }

  it('holds a step steady before it starts and after it ends', () => {
    const step = { target: 'el', preset: 'fadeUp' as const, at: 1 }
    const spec = resolvePreset('fadeUp')
    const before = stepStyleAt(step, { frame: 0, fps: FPS }) // t=0, before at=1
    const after = stepStyleAt(step, { frame: Math.round((1 + spec.duration + 1) * FPS), fps: FPS })
    expect(before.opacity).toBe(0)
    expect(after.opacity).toBe(1)
  })

  it('computes the timeline end as the latest step end', () => {
    const end = timelineEnd([
      { target: 'a', preset: 'fadeUp', at: 0 },
      { target: 'b', preset: 'growX', at: 0.5 }, // 0.5 + 1.2 = 1.7
    ])
    expect(end).toBeCloseTo(1.7, 5)
  })
})
