import type { UiNode, ContainerNode, State, UiSceneProps } from './schema'
import { CONTAINER_KINDS } from './schema'

export const DEFAULT_STAGGER = 0.08
/** Seconds held after the last element reveals before the scene is "settled". */
const ENTRANCE_TAIL = 0.4

export interface Placed {
  node: UiNode
  /** Stable id from the tree path, e.g. "0.1.2" — used as the animation target. */
  path: string
  /** Derived reveal time, in seconds. */
  reveal: number
}

const CONTAINER = new Set<string>(CONTAINER_KINDS)
export function isContainer(node: UiNode): node is ContainerNode {
  return CONTAINER.has(node.kind)
}

/**
 * Reveal order comes from tree traversal, timing from a stagger constant — the
 * hand-authored `delay={0.65}` on every element is exactly what this deletes.
 *   reveal(node) = parentReveal + siblingIndex * stagger + (node.at ?? 0)
 */
export function sequence(root: UiNode, opts: { stagger?: number } = {}): { placed: Placed[]; entranceEnd: number } {
  const placed: Placed[] = []
  const rootStagger = opts.stagger ?? DEFAULT_STAGGER

  function walk(node: UiNode, path: string, parentReveal: number, index: number, siblingStagger: number): void {
    const reveal = parentReveal + index * siblingStagger + (node.at ?? 0)
    placed.push({ node, path, reveal })
    if (isContainer(node)) {
      const childStagger = node.stagger ?? rootStagger
      node.children.forEach((child, i) => walk(child, `${path}.${i}`, reveal, i, childStagger))
    }
  }

  walk(root, '0', 0, 0, rootStagger)
  const entranceEnd = placed.reduce((max, p) => Math.max(max, p.reveal), 0) + ENTRANCE_TAIL
  return { placed, entranceEnd }
}

export interface StateWindow {
  id: string
  start: number
  end: number
}

/** Cumulative [start, end) windows for the state list. */
export function stateWindows(states: State[]): StateWindow[] {
  let start = 0
  return states.map((s) => {
    const w = { id: s.id, start, end: start + s.hold }
    start += s.hold
    return w
  })
}

/** Which state is active at time t (seconds). */
export function stateAt(states: State[], t: number): string {
  const windows = stateWindows(states)
  for (const w of windows) if (t < w.end) return w.id
  return windows[windows.length - 1]?.id ?? states[0]!.id
}

/** A node renders in a state unless it restricts itself via `in`. */
export function visibleIn(node: UiNode, stateId: string): boolean {
  return node.in ? node.in.includes(stateId) : true
}

export function statesDuration(states: State[]): number {
  return states.reduce((sum, s) => sum + s.hold, 0)
}

/**
 * Total scene duration for the deck-duration calc — the states drive the length;
 * the derived entrance must fit inside it. This is what finally replaces the
 * `const animationEnd = 0` stub for ui scenes.
 */
export function uiSceneDuration(props: UiSceneProps): number {
  return Math.max(statesDuration(props.states), sequence(props.root).entranceEnd)
}
