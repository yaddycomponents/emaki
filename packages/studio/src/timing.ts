import { deckDuration, type Deck } from '@emaki/schema'
import { blockAnimationEnd } from '@emaki/blocks'

// Browser-safe duration math — mirrors @emaki/render's timing without pulling
// Remotion (node-only) into the studio bundle.
export const FPS = 30
const TAIL = 0.4

export function sceneSeconds(deck: Deck): number[] {
  const reading = deckDuration(deck)
  return deck.scenes.map((s, i) => Math.max(reading.scenes[i]?.dur ?? 1.5, blockAnimationEnd(s.type) + TAIL))
}

export function sceneFrames(deck: Deck): number[] {
  return sceneSeconds(deck).map((s) => Math.max(1, Math.round(s * FPS)))
}

export function totalFrames(deck: Deck): number {
  return sceneFrames(deck).reduce((a, b) => a + b, 0)
}

/** mm:ss.ff timecode from a frame index. */
export function timecode(frame: number): string {
  const totalSec = frame / FPS
  const m = Math.floor(totalSec / 60)
  const s = Math.floor(totalSec % 60)
  const f = Math.round(frame % FPS)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(m)}:${pad(s)}.${pad(f)}`
}
