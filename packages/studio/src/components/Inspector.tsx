import { useStudio } from '../store'
import s from './Inspector.module.css'

export function Inspector() {
  const text = useStudio((x) => x.text)
  const error = useStudio((x) => x.error)
  const setText = useStudio((x) => x.setText)

  return (
    <div className={s.panel}>
      <div className={s.header}>
        <span>Inspector</span>
        <span className={s.file}>deck.json</span>
      </div>
      <textarea
        className={s.editor}
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
      {error ? <div className={s.error}>{error.split('\n')[0]}</div> : null}
    </div>
  )
}
