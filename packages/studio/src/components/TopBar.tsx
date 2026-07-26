import * as Popover from '@radix-ui/react-popover'
import type { Aspect } from '@emaki/schema'
import { useStudio } from '../store'
import { McpPanel } from './McpPanel'
import { ChromeToggle } from './ChromeToggle'
import s from './TopBar.module.css'

const ASPECTS: Aspect[] = ['16:9', '1:1', '9:16']

export function TopBar() {
  const deck = useStudio((x) => x.deck)
  const error = useStudio((x) => x.error)
  const mcp = useStudio((x) => x.mcp)
  const reloadedAt = useStudio((x) => x.reloadedAt)
  const setAspect = useStudio((x) => x.setAspect)
  const setView = useStudio((x) => x.setView)
  const startRender = useStudio((x) => x.startRender)

  const aspect = deck?.aspect ?? '9:16'
  const count = deck?.scenes.length ?? 0

  return (
    <header className={s.bar}>
      <div className={s.mark}>e</div>
      <div className={s.name}>{deck?.title ?? 'Untitled'}</div>
      <div className={s.path}>./deck.json</div>
      {reloadedAt ? <span className={s.reloaded}>reloaded just now</span> : null}

      <div className={s.spacer} />

      <div className={s.seg} role="tablist" aria-label="aspect">
        {ASPECTS.map((a) => (
          <button
            key={a}
            type="button"
            className={a === aspect ? `${s.segItem} ${s.segOn}` : s.segItem}
            onClick={() => setAspect(a)}
          >
            {a}
          </button>
        ))}
      </div>

      <button type="button" className={s.theme} onClick={() => setView('theme-gallery')}>
        <span className={s.swatch} />
        {deck?.theme ?? 'warm-editorial'}
      </button>

      <div className={error ? `${s.status} ${s.statusErr}` : s.status}>
        <span className={error ? `${s.dot} ${s.dotErr}` : `${s.dot} ${s.dotOk}`} />
        {error ? 'schema error' : `schema ok · ${count} scenes`}
      </div>

      <span className={s.rule} />

      <Popover.Root>
        <Popover.Trigger asChild>
          <button type="button" className={mcp.connected ? `${s.mcp} ${s.mcpOn}` : s.mcp}>
            <span className={mcp.connected ? `${s.dot} ${s.dotOk}` : `${s.dot} ${s.dotIdle}`} />
            mcp · {mcp.connected ? mcp.clientName : 'no client'}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className={s.pop} sideOffset={8} align="end">
            <McpPanel onClose={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <ChromeToggle />

      <button type="button" className={s.render} onClick={startRender}>
        Render <span className={s.kbd}>⌘R</span>
      </button>
    </header>
  )
}
