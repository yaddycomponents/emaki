import type { FC } from 'react'
import type { TitleProps } from '@emaki/schema'
import type { Timeline } from '@emaki/core'
import { useAnim } from '../engine'
import { frame, eyebrow, display, mask } from '../styles'

export const titleTimeline: Timeline = [
  { target: 'kicker', preset: 'fadeUp', at: 0 },
  { target: 'title', preset: 'maskReveal', at: 0.15 },
]

export const Title16x9: FC<TitleProps> = ({ text, kicker }) => {
  const A = useAnim()
  return (
    <div style={frame()}>
      {kicker ? (
        <A target="kicker" as="div" style={eyebrow}>
          {kicker}
        </A>
      ) : null}
      <div style={mask}>
        <A target="title" as="h1" style={display}>
          {text}
        </A>
      </div>
    </div>
  )
}

export const Title9x16: FC<TitleProps> = ({ text, kicker }) => {
  const A = useAnim()
  return (
    <div style={frame({ padding: '12% 8%' })}>
      {kicker ? (
        <A target="kicker" as="div" style={eyebrow}>
          {kicker}
        </A>
      ) : null}
      <div style={mask}>
        <A target="title" as="h1" style={{ ...display, fontSize: 'clamp(48px, 12vw, 128px)' }}>
          {text}
        </A>
      </div>
    </div>
  )
}
