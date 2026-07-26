import { createElement, type ReactNode } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { SceneTimeContext } from '@emaki/blocks'

/**
 * Provides the current scene time (seconds) to data-driven blocks. Inside a
 * Remotion <Sequence>, useCurrentFrame() is rebased to the sequence start, so
 * each scene's clock begins at 0 — a ui-scene's skeleton → loaded swap is
 * deterministic and matches the timeline the Anim components read.
 */
export function RemotionSceneClock({ children }: { children: ReactNode }): ReactNode {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return createElement(SceneTimeContext.Provider, { value: frame / fps }, children)
}
