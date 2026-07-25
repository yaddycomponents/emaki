/**
 * A cubic-bezier evaluator — the single source of easing truth. Framer receives
 * the same [p1x, p1y, p2x, p2y] control points (it eases identically), and the
 * Remotion adapter uses this function to interpolate frame-by-frame. Because
 * both paths share these control points, preview and render agree.
 *
 * Control-point y values may exceed [0,1] (e.g. a back-out overshoot), which is
 * how `popIn` gets its bounce deterministically without a spring.
 */
export type BezierPoints = readonly [number, number, number, number]

const NEWTON_ITERATIONS = 8
const NEWTON_MIN_SLOPE = 0.001
const SUBDIVISION_PRECISION = 1e-7
const SUBDIVISION_MAX = 12

const A = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1
const B = (a1: number, a2: number) => 3 * a2 - 6 * a1
const C = (a1: number) => 3 * a1

const bezier = (t: number, a1: number, a2: number) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t
const slope = (t: number, a1: number, a2: number) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1)

function tForX(x: number, x1: number, x2: number): number {
  let lo = 0
  let hi = 1
  // Newton-Raphson first
  let t = x
  for (let i = 0; i < NEWTON_ITERATIONS; i++) {
    const s = slope(t, x1, x2)
    if (s < NEWTON_MIN_SLOPE) break
    const err = bezier(t, x1, x2) - x
    t -= err / s
  }
  if (t >= 0 && t <= 1 && Math.abs(bezier(t, x1, x2) - x) < SUBDIVISION_PRECISION) return t
  // Binary subdivision fallback
  t = x
  for (let i = 0; i < SUBDIVISION_MAX; i++) {
    const cx = bezier(t, x1, x2)
    if (Math.abs(cx - x) < SUBDIVISION_PRECISION) return t
    if (cx < x) lo = t
    else hi = t
    t = (lo + hi) / 2
  }
  return t
}

/** Returns an easing function y(x) for x in [0,1] given the four control points. */
export function cubicBezier([x1, y1, x2, y2]: BezierPoints): (x: number) => number {
  if (x1 === y1 && x2 === y2) return (x) => x // linear
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    return bezier(tForX(x, x1, x2), y1, y2)
  }
}

export function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}
