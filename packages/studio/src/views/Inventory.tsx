import type { ReactNode } from 'react'
import { useStudio } from '../store'
import { ChromeToggle } from '../components/ChromeToggle'
import s from './Inventory.module.css'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={s.section}>
      <div className={s.sectionTitle}>{title}</div>
      <div className={s.row}>{children}</div>
    </section>
  )
}

export function Inventory() {
  const setView = useStudio((x) => x.setView)
  return (
    <div className={s.screen}>
      <header className={s.top}>
        <button type="button" className={s.back} onClick={() => setView('studio')}>
          ←
        </button>
        <span className={s.title}>Component inventory</span>
        <span className={s.sub}>1i · foundations</span>
        <span style={{ flex: 1 }} />
        <ChromeToggle />
      </header>

      <div className={s.body}>
        <Section title="Buttons">
          <button className={s.primary}>Primary</button>
          <button className={s.secondary}>Secondary</button>
          <button className={s.ghost}>Ghost</button>
          <button className={s.destructive}>Destructive</button>
          <button className={s.secondary} disabled style={{ opacity: 0.5 }}>
            Disabled
          </button>
        </Section>

        <Section title="Inputs & selects">
          <input className={s.input} placeholder="Resting" />
          <input className={`${s.input} ${s.inputFocus}`} defaultValue="Focused" />
          <input className={`${s.input} ${s.inputInvalid}`} defaultValue="Invalid" />
          <span className={s.select}>
            stacked <span className={s.caret}>▾</span>
          </span>
          <span className={s.toggle}>
            <span className={s.knob} />
          </span>
        </Section>

        <Section title="Tabs / segmented / tooltip">
          <div className={s.tabs}>
            <span className={`${s.tab} ${s.tabOn}`}>Inspector</span>
            <span className={s.tab}>JSON</span>
            <span className={s.tab}>Narration</span>
          </div>
          <div className={s.seg}>
            <span className={`${s.segItem} ${s.segOn}`}>16:9</span>
            <span className={s.segItem}>1:1</span>
            <span className={s.segItem}>9:16</span>
          </div>
          <span className={s.tip}>tooltip · mono</span>
        </Section>

        <Section title="Change indicators">
          <span className={s.chipUpdated}>updated</span>
          <span className={s.chipNew}>new</span>
          <span className={s.chipRemoved}>removed</span>
        </Section>

        <Section title="Validation">
          <div className={s.valErr}>
            <b>scene 05 · body.headline</b> — expected string, received undefined <span className={s.valLink}>go to field →</span>
          </div>
          <div className={s.valOk}>schema ok · 6 scenes</div>
        </Section>

        <Section title="Progress & command chip">
          <div className={s.progress}>
            <div className={s.progressFill} style={{ width: '62%' }} />
          </div>
          <code className={s.cmdChip}>
            <span className={s.cmdPrompt}>›</span> emaki render deck.json --aspect 9:16 <span className={s.cmdCopy}>copy</span>
          </code>
        </Section>
      </div>
    </div>
  )
}
