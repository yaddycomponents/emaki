import { type AnimSpec, resolvePreset, type PresetName, type PresetParams } from './presets'

/**
 * A timeline step animates one named target, starting at `at` seconds. The
 * motion is either a named `preset` or an inline `spec` (the open animation
 * primitive) — both resolve to the same `AnimSpec`, so both render paths read it
 * identically.
 */
export interface TimelineStep {
  /** id of the element in the block layout this step drives. */
  target: string
  preset?: PresetName
  /** An inline, pre-resolved animation — takes precedence over `preset`. */
  spec?: AnimSpec
  /** delay before this step starts, in seconds. */
  at?: number
  params?: PresetParams
}

export type Timeline = readonly TimelineStep[]

/** The resolved animation for a step — inline spec wins, else the named preset. */
export function stepSpec(step: TimelineStep): AnimSpec {
  return step.spec ?? resolvePreset(step.preset ?? 'fadeIn', step.params)
}

/** When a single step finishes, in seconds. */
export function stepEnd(step: TimelineStep): number {
  return (step.at ?? 0) + stepSpec(step).duration
}

/**
 * When the whole timeline settles, in seconds. This is the animation-end time
 * the duration calculator max()es against so a scene never cuts mid-motion.
 */
export function timelineEnd(timeline: Timeline): number {
  return timeline.reduce((max, step) => Math.max(max, stepEnd(step)), 0)
}

/** All steps that target a given element id, in declared order. */
export function stepsFor(timeline: Timeline, target: string): TimelineStep[] {
  return timeline.filter((s) => s.target === target)
}
