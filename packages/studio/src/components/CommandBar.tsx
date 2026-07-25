import { useState } from 'react'
import { useStudio } from '../store'
import s from './CommandBar.module.css'

// The studio surfaces the CLI command its current state maps to — devs learn the
// CLI by using the GUI, and the GUI stops being a black box (spec §0b rule 3).
export function CommandBar() {
  const deck = useStudio((x) => x.deck)
  const aspect = deck?.aspect ?? '9:16'
  const cmd = `emaki render deck.json --aspect ${aspect} --out film.mp4`
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <footer className={s.bar}>
      <span className={s.label}>CLI</span>
      <code className={s.cmd}>{cmd}</code>
      <div className={s.spacer} />
      <button type="button" className={s.copy} onClick={copy}>
        {copied ? 'copied' : 'copy'}
      </button>
    </footer>
  )
}
