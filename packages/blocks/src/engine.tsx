import { createContext, useContext, createElement, type FC, type ReactNode, type CSSProperties } from 'react'
import { stepToFramer, stepsFor, type Timeline } from '@emaki/core'
import { motion } from 'framer-motion'

/**
 * A block layout renders animated elements as `<A target="title" as="h1">…`.
 * The `Anim` component it gets is injected by the runtime:
 *   - StaticAnim   — final state, no motion (default; SSR, tests, thumbnails)
 *   - FramerAnim   — preview/HMR (this package)
 *   - RemotionAnim — deterministic render (provided by @emaki/render)
 *
 * Because all three read the SAME timeline and the SAME core adapters, a block
 * is written once and looks identical across paths.
 */
export interface AnimProps {
  target: string
  as?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export type AnimComponent = FC<AnimProps>

export const StaticAnim: AnimComponent = ({ as = 'div', className, style, children }) =>
  createElement(as, { className, style }, children)

/** Framer preview: one motion element per target, driven by the first step. */
export const FramerAnim: AnimComponent = ({ target, as = 'div', className, style, children }) => {
  const timeline = useTimeline()
  const steps = stepsFor(timeline, target)
  if (steps.length === 0) return createElement(as, { className, style }, children)
  const props = stepToFramer(steps[0]!)
  const M = (motion as unknown as Record<string, FC<Record<string, unknown>>>)[as] ?? motion.div
  return createElement(
    M,
    { className, style, initial: props.initial, animate: props.animate, transition: props.transition },
    children,
  )
}

export const AnimContext = createContext<AnimComponent>(StaticAnim)
export const TimelineContext = createContext<Timeline>([])

export function useAnim(): AnimComponent {
  return useContext(AnimContext)
}

export function useTimeline(): Timeline {
  return useContext(TimelineContext)
}
