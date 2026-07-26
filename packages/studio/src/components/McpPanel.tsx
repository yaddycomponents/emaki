import { useStudio } from '../store'
import s from './McpPanel.module.css'

const TOOLS: [string, string][] = [
  ['propose_scenes', 'returns ops for you to approve'],
  ['apply_ops', 'writes approved ops to disk'],
  ['extract', 'rollup · lighthouse · git log'],
  ['create_theme_from_image', 'brand → theme file'],
  ['render', 'local render, same as the CLI'],
]

export function McpPanel({ onClose }: { onClose?: () => void }) {
  const mcp = useStudio((x) => x.mcp)
  const connect = useStudio((x) => x.connectMcp)
  const simulate = useStudio((x) => x.simulateMcpEdit)
  const connected = mcp.connected

  return (
    <div className={s.panel}>
      <div className={s.head}>
        <span className={connected ? `${s.dot} ${s.ok}` : `${s.dot} ${s.idle}`} />
        <span className={s.title}>{connected ? 'claude-code attached' : 'No MCP client attached'}</span>
        {connected ? <span className={s.since}>since 14:02 · 3 calls</span> : null}
      </div>

      <p className={s.body}>
        {connected
          ? 'Emaki never calls a model — your client runs the tools and writes to deck.json. Studio just reacts.'
          : 'Everything here works without one. Connect a client only when you want AI to propose edits.'}
      </p>

      <div className={s.label}>Add the server</div>
      <div className={s.cmdRow}>
        <code className={s.cmd}>claude mcp add emaki -- emaki mcp serve</code>
        <button
          type="button"
          className={s.copy}
          onClick={() => navigator.clipboard?.writeText('claude mcp add emaki -- emaki mcp serve').catch(() => {})}
        >
          copy
        </button>
      </div>

      {connected ? (
        <>
          <div className={s.label}>Tools exposed</div>
          <div className={s.tools}>
            {TOOLS.map(([name, desc]) => (
              <div key={name} className={s.tool}>
                <span className={s.tname}>{name}</span>
                <span className={s.tdesc}>{desc}</span>
              </div>
            ))}
          </div>
          <div className={s.status}>
            <div>project ~/src/site</div>
            <div>watching ./decks/*.deck.json</div>
            <div>{mcp.lastCall ? `last ${mcp.lastCall.tool} · just now · ${mcp.lastCall.ops} ops` : 'no calls yet'}</div>
          </div>
          <div className={s.footer}>
            <code className={s.cmdSmall}>emaki mcp status</code>
            <div className={s.spacer} />
            <button
              type="button"
              className={s.demo}
              onClick={() => {
                simulate()
                onClose?.()
              }}
            >
              Simulate apply_ops →
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={s.hint}>then restart your client · Studio picks it up automatically</div>
          <div className={s.footer}>
            <div className={s.spacer} />
            <button type="button" className={s.demo} onClick={connect}>
              Simulate connection →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
