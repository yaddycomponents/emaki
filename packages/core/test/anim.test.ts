import { describe, it, expect } from 'vitest'
import { buildAnim, sampleSpec, stepStyleAt, stepToFramer, stepSpec, type TimelineStep } from '../src'

describe('sampleSpec — the motion-layer interpolator', () => {
  const spec = buildAnim({ from: { x: -40, opacity: 0 }, dur: 0.5, ease: 'linear' })
  it('is the from-state at progress 0 and settled at 1', () => {
    const at0 = sampleSpec(spec, 0)
    expect(at0.opacity).toBeCloseTo(0)
    expect(at0.transform).toContain('-40px')
    const at1 = sampleSpec(spec, 1)
    expect(at1.opacity).toBeCloseTo(1)
    expect(at1.transform).toContain('translate(0px, 0px)')
  })
})

describe('inline animation (the open primitive)', () => {
  it('builds an AnimSpec from composed offsets, easing to identity', () => {
    const spec = buildAnim({ from: { x: -40, opacity: 0 }, dur: 0.6, ease: 'back' })
    expect(spec.duration).toBe(0.6)
    expect(spec.channels.x).toEqual({ from: -40, to: 0 })
    expect(spec.channels.opacity).toEqual({ from: 0, to: 1 })
  })

  it('flows through the same adapters as a preset (inline spec on a step)', () => {
    const step: TimelineStep = { target: 'x', spec: buildAnim({ from: { y: 20, opacity: 0 }, dur: 0.5 }), at: 0 }
    // resolved spec is what stepSpec returns
    expect(stepSpec(step).duration).toBe(0.5)
    // start of the animation: offset + transparent
    const start = stepStyleAt(step, { frame: 0, fps: 30 })
    expect(start.opacity).toBeCloseTo(0)
    expect(start.transform).toContain('translate')
    // end: settled
    const end = stepStyleAt(step, { frame: 30, fps: 30 })
    expect(end.opacity).toBeCloseTo(1)
    // framer adapter sees the same duration
    expect(stepToFramer(step).transition.duration).toBe(0.5)
  })

  it('a step with neither spec nor preset falls back to a valid fade', () => {
    expect(stepSpec({ target: 'x' }).duration).toBeGreaterThan(0)
  })
})
