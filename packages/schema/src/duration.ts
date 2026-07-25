import { BOOTSTRAP_BLOCKS } from './blocks'
import { createRegistry, type BlockDef } from './registry'
import { DEFAULT_WORDS_PER_SECOND, type Deck, type Scene } from './deck'

/** No scene reads faster than this, however few words it has. */
export const MIN_SCENE_SECONDS = 1.5

export function countWords(text: string): number {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

export interface DurationOptions {
  wordsPerSecond?: number
  /** Registry to resolve block text from. Defaults to the bootstrap blocks. */
  blocks?: readonly BlockDef[]
}

/**
 * Duration of one scene, in seconds. An explicit `dur` wins; otherwise it is the
 * reading time (words / wordsPerSecond), floored at MIN_SCENE_SECONDS, plus any
 * `hold`. Week 2 also max()es against the block timeline's animation-end time.
 */
export function sceneDuration(scene: Scene, opts: DurationOptions = {}): number {
  if (typeof scene.dur === 'number') return scene.dur
  const reg = createRegistry(opts.blocks ?? BOOTSTRAP_BLOCKS)
  const def = reg[scene.type]
  const wps = opts.wordsPerSecond ?? DEFAULT_WORDS_PER_SECOND
  const words = def?.text ? countWords(def.text(scene.props as never)) : 0
  const reading = words / wps
  const animationEnd = 0 // Week 2: derive from the block timeline
  const hold = scene.hold ?? 0
  return round2(Math.max(MIN_SCENE_SECONDS, reading, animationEnd) + hold)
}

export interface DeckDuration {
  total: number
  scenes: { id: string; type: string; dur: number }[]
}

/** Per-scene and total duration for a whole deck. */
export function deckDuration(deck: Deck, opts: DurationOptions = {}): DeckDuration {
  const wordsPerSecond = opts.wordsPerSecond ?? deck.wordsPerSecond
  const scenes = deck.scenes.map((s) => ({
    id: s.id,
    type: s.type,
    dur: sceneDuration(s, { ...opts, wordsPerSecond }),
  }))
  return { total: round2(scenes.reduce((a, s) => a + s.dur, 0)), scenes }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
