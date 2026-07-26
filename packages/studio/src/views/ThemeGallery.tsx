import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { Plus } from 'lucide-react'
import { THEMES } from '@emaki/themes'
import { useStudio } from '../store'
import { SAMPLE_DECK } from '../sample'
import { Thumb } from '../components/Thumb'
import { ChromeToggle } from '../components/ChromeToggle'
import s from './Gallery.module.css'

export function ThemeGallery() {
  const deck = useStudio((x) => x.deck)
  const setView = useStudio((x) => x.setView)
  const setText = useStudio((x) => x.setText)
  const log = useStudio((x) => x.log)
  const inUse = deck?.theme ?? 'warm-editorial'

  const apply = (id: string) => {
    if (deck) setText(JSON.stringify({ ...deck, theme: id }, null, 2))
    log(`theme → ${id}`, 'ok', 3)
    setView('studio')
  }

  const themeDeck = (id: string) => ({ ...SAMPLE_DECK, theme: id })

  return (
    <div className={s.screen}>
      <header className={s.top}>
        <button type="button" className={s.back} onClick={() => setView('studio')}>
          ←
        </button>
        <span className={s.title}>Themes</span>
        <span className={s.sub}>./themes · 2 local</span>
        <div className={s.spacer} />
        <Dropdown.Root>
          <Dropdown.Trigger asChild>
            <button type="button" className={s.primary}>
              + Create
            </button>
          </Dropdown.Trigger>
          <Dropdown.Portal>
            <Dropdown.Content className={s.menu} sideOffset={6} align="end">
              <Dropdown.Item className={s.menuItem} onSelect={() => setView('studio')}>
                <span className={s.menuTitle}>Choose from theme</span>
                <span className={s.menuDesc}>start from one that already exists</span>
              </Dropdown.Item>
              <Dropdown.Item className={s.menuItem} onSelect={() => setView('theme-import')}>
                <span className={s.menuTitle}>Import from brand</span>
                <span className={s.menuDesc}>a site, a screenshot, or a brand PDF</span>
              </Dropdown.Item>
              <Dropdown.Item className={s.menuItem} onSelect={() => setView('theme-blank')}>
                <span className={s.menuTitle}>Start blank</span>
                <span className={s.menuDesc}>pick colours and fonts yourself</span>
              </Dropdown.Item>
            </Dropdown.Content>
          </Dropdown.Portal>
        </Dropdown.Root>
        <ChromeToggle />
      </header>

      <div className={s.grid}>
        {Object.values(THEMES).map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === inUse ? `${s.card} ${s.cardOn}` : s.card}
            onClick={() => apply(t.id)}
          >
            <div className={s.thumb}>
              <Thumb deck={themeDeck(t.id)} aspect="16:9" />
            </div>
            <div className={s.meta}>
              <span className={s.name}>{t.name}</span>
              <span className={s.metaLine}>seed theme · edited 3d ago</span>
            </div>
          </button>
        ))}
        <button type="button" className={s.card} onClick={() => setView('theme-import')}>
          <div className={s.thumb}>
            <Thumb deck={themeDeck('saas-product')} sceneIndex={1} aspect="16:9" />
          </div>
          <div className={s.meta}>
            <span className={s.name}>acme-brand (draft)</span>
            <span className={s.metaLine}>
              from brand · 4h ago <span className={s.warnChip}>2 slots empty</span>
            </span>
          </div>
        </button>
        <div className={s.addTile}>
          <Plus size={18} />
          <span>New theme</span>
        </div>
      </div>

      <footer className={s.footer}>
        <span className={s.footName}>{inUse}</span>
        <span className={s.footMeta}>in use · applies to every scene</span>
        <div className={s.spacer} />
        <button type="button" className={s.ghost} onClick={() => setView('studio')}>
          Back to studio
        </button>
      </footer>
    </div>
  )
}
