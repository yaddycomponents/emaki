import type { FC } from 'react'
import type { StatementProps } from '@emaki/schema'
import type { Timeline } from '@emaki/core'
import { useAnim } from '../engine'
import { frame, statement as statementType, mask, tokens } from '../styles'

export const statementTimeline: Timeline = [{ target: 'text', preset: 'maskReveal', at: 0 }]

/** Wrap emphasised substrings in the accent colour. */
function render(text: string, emphasis?: string[]) {
  if (!emphasis || emphasis.length === 0) return text
  const escaped = emphasis.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'g'))
  return parts.map((part, i) =>
    emphasis.includes(part) ? (
      <span key={i} style={{ color: tokens.colors.accent }}>
        {part}
      </span>
    ) : (
      part
    ),
  )
}

const Body: FC<StatementProps & { fontSize?: string }> = ({ text, emphasis, fontSize }) => {
  const A = useAnim()
  return (
    <div style={mask}>
      <A target="text" as="p" style={{ ...statementType, ...(fontSize ? { fontSize } : {}) }}>
        {render(text, emphasis)}
      </A>
    </div>
  )
}

export const Statement16x9: FC<StatementProps> = (p) => (
  <div style={frame()}>
    <Body {...p} />
  </div>
)

export const Statement9x16: FC<StatementProps> = (p) => (
  <div style={frame({ padding: '14% 8%' })}>
    <Body {...p} fontSize="clamp(40px, 10vw, 104px)" />
  </div>
)
