import { resolvePreset, type PresetName, type PresetParams } from './presets'

/**
 * A timeline step animates one named target with one preset, starting at `at`
 * seconds. A block declares a single `Timeline`; both render paths read it.
 */
export interface TimelineStep {
  /** id of the element in the block layout this step drives. */
  target: string
  preset: PresetName
  /** delay before this step starts, in seconds. */
  at?: number
  params?: PresetParams
}

export type Timeline = readonly TimelineStep[]

/** When a single step finishes, in seconds. */
export function stepEnd(step: TimelineStep): number {
  return (step.at ?? 0) + resolvePreset(step.preset, step.params).duration
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
