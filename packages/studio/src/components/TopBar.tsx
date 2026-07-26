import * as Tooltip from '@radix-ui/react-tooltip'
import { Moon, Sun } from 'lucide-react'
import type { Aspect } from '@emaki/schema'
import { useStudio } from '../store'
import s from './TopBar.module.css'

const ASPECTS: Aspect[] = ['16:9', '1:1', '9:16']

export function TopBar() {
  const deck = useStudio((x) => x.deck)
  const error = useStudio((x) => x.error)
  const chrome = useStudio((x) => x.chrome)
  const setAspect = useStudio((x) => x.setAspect)
  const toggleChrome = useStudio((x) => x.toggleChrome)
  const log = useStudio((x) => x.log)

  const aspect = deck?.aspect ?? '9:16'
  const count = deck?.scenes.length ?? 0

  return (
    <Tooltip.Provider delayDuration={300}>
      <header className={s.bar}>
        <div className={s.mark} />
        <div className={s.name}>{deck?.title ?? 'Untitled'}</div>
        <div className={s.path}>./deck.json</div>

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

        <div className={s.theme}>
          <span className={s.swatch} />
          {deck?.theme ?? 'warm-editorial'}
        </div>

        <div className={error ? `${s.status} ${s.statusErr}` : s.status}>
          <span className={error ? `${s.dot} ${s.dotErr}` : `${s.dot} ${s.dotOk}`} />
          {error ? 'schema error' : `schema ok · ${count} scenes`}
        </div>

        <span className={s.rule} />

        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <div className={s.mcp}>
              <span className={`${s.dot} ${s.dotIdle}`} />
              mcp · no client
            </div>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className={s.tip} sideOffset={6}>
              No MCP client attached — connect Claude Code with{' '}
              <code>emaki mcp serve</code>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        <button type="button" className={s.iconBtn} onClick={toggleChrome} aria-label="toggle theme">
          {chrome === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        <button type="button" className={s.render} onClick={() => log(`emaki render deck.json --aspect ${aspect}`, 'queued', 2)}>
          Render <span className={s.kbd}>⌘R</span>
        </button>
      </header>
    </Tooltip.Provider>
  )
}
