import { deckDuration, type Deck } from '@emaki/schema'
import { blockAnimationEnd } from '@emaki/blocks'

export const FPS = 30
/** Seconds held after a scene's motion settles before the cut. */
const TAIL = 0.4

/**
 * Frames per scene: the max of the reading time (from the schema duration calc)
 * and the block's animation-end time + a tail, so a scene never cuts mid-motion.
 * Shared by the composition and by calculateMetadata so both agree exactly.
 */
export function sceneFrameList(deck: Deck, fps: number): number[] {
  const reading = deckDuration(deck)
  return deck.scenes.map((scene, i) => {
    const readSec = reading.scenes[i]?.dur ?? 1.5
    const motionSec = blockAnimationEnd(scene.type) + TAIL
    return Math.max(1, Math.round(Math.max(readSec, motionSec) * fps))
  })
}

export function deckFrames(deck: Deck, fps: number): number {
  return sceneFrameList(deck, fps).reduce((a, b) => a + b, 0)
}
