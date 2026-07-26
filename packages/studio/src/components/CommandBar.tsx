import { useStudio } from '../store'
import s from './CommandBar.module.css'

// Every meaningful action writes here — the command it maps to, its result, and
// elapsed time. A trust device, not decoration (design §3 / spec §0b rule 3).
export function CommandBar() {
  const log = useStudio((x) => x.commandLog)
  const last = log[log.length - 1]

  const copy = () => {
    if (last) navigator.clipboard?.writeText(last.command).catch(() => {})
  }

  return (
    <footer className={s.bar}>
      <span className={s.prompt}>›</span>
      <code className={s.cmd}>{last?.command ?? ''}</code>
      {last ? (
        <span className={s.result}>
          {last.result}
          {last.ms ? ` · ${last.ms}ms` : ''}
        </span>
      ) : null}
      <div className={s.spacer} />
      <button type="button" className={s.link} onClick={copy}>
        copy
      </button>
      <span className={s.sep}>·</span>
      <span className={s.muted}>history ({log.length})</span>
      <span className={s.sep}>·</span>
      <span className={s.muted}>⌘K palette</span>
    </footer>
  )
}
