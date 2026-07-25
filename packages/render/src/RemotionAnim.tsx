import { createElement } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { targetStyleAt } from '@emaki/core'
import { useTimeline, type AnimComponent } from '@emaki/blocks'

/**
 * The render-path animator. Inside a Remotion <Sequence>, useCurrentFrame() is
 * rebased to the sequence start, so each scene's timeline begins at frame 0.
 * targetStyleAt() is the same core adapter proven to agree with Framer, so the
 * MP4 matches the preview.
 */
export const RemotionAnim: AnimComponent = ({ target, as = 'div', className, style, children }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const timeline = useTimeline()
  const animated = targetStyleAt(timeline, target, { frame, fps })
  return createElement(as, { className, style: { ...style, ...animated } }, children)
}
