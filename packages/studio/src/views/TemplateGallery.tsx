import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStudio, TEMPLATE_DECKS } from '../store'
import { TEMPLATES } from '../sample'
import { Thumb } from '../components/Thumb'
import { ChromeToggle } from '../components/ChromeToggle'
import s from './Gallery.module.css'

const FILTERS = ['all', '16:9', '9:16'] as const

export function TemplateGallery() {
  const setView = useStudio((x) => x.setView)
  const openDeck = useStudio((x) => x.openDeck)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [selected, setSelected] = useState(TEMPLATES[0]!.id)

  const shown = TEMPLATES.filter((t) => filter === 'all' || t.aspects.includes(filter))
  const sel = TEMPLATES.find((t) => t.id === selected)!
  const deckFor = (id: string) => TEMPLATE_DECKS[id] ?? TEMPLATE_DECKS['release-notes']!

  const use = () => openDeck(deckFor(selected), `emaki new --template ${selected}`)

  return (
    <div className={s.screen}>
      <header className={s.top}>
        <button type="button" className={s.back} onClick={() => setView('first-run')}>
          ←
        </button>
        <span className={s.title}>Templates</span>
        <span className={s.sub}>./templates · 6 local</span>
        <div className={s.spacer} />
        <div className={s.seg}>
          {FILTERS.map((f) => (
            <button key={f} type="button" className={f === filter ? `${s.segItem} ${s.segOn}` : s.segItem} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        <input className={s.filter} placeholder="Filter templates" />
        <button type="button" className={s.addPath}>
          Add from path
        </button>
        <ChromeToggle />
      </header>

      <div className={s.grid}>
        {shown.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === selected ? `${s.card} ${s.cardOn}` : s.card}
            onClick={() => setSelected(t.id)}
            onDoubleClick={use}
          >
            <div className={s.thumb}>
              <Thumb deck={deckFor(t.id)} aspect="16:9" />
              {t.id === selected ? <span className={s.loop}>▶ looping</span> : null}
            </div>
            <div className={s.meta}>
              <span className={s.name}>{t.name}</span>
              <span className={s.metaLine}>
                {t.author} · {t.scenes} scenes · {t.aspects}
              </span>
            </div>
          </button>
        ))}
        <div className={s.addTile}>
          <Plus size={18} />
          <span>Add a template folder</span>
        </div>
      </div>

      <footer className={s.footer}>
        <span className={s.footName}>{sel.name}</span>
        <span className={s.footMeta}>
          templates/{sel.name} · {sel.scenes} scenes
        </span>
        <div className={s.spacer} />
        <button type="button" className={s.ghost}>
          Preview
        </button>
        <button type="button" className={s.primary} onClick={use}>
          Use template
        </button>
      </footer>
    </div>
  )
}
