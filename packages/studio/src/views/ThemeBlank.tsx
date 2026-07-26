import { useState } from 'react'
import { useStudio } from '../store'
import { SAMPLE_DECK } from '../sample'
import { Thumb } from '../components/Thumb'
import { ChromeToggle } from '../components/ChromeToggle'
import s from './ThemeStudio.module.css'

const COLORS: [string, string][] = [
  ['Background', '#f4e7d6'],
  ['Heading text', '#5e3b46'],
  ['Body text', '#8a6470'],
  ['Highlight', '#a8536a'],
  ['Positive', '#5b7d77'],
  ['Negative', '#a8536a'],
  ['Rules & lines', '#d8b9ab'],
]

const FONTS = ['Yeseva One', 'Fraunces', 'DM Serif Display']

export function ThemeBlank() {
  const setView = useStudio((x) => x.setView)
  const [focus, setFocus] = useState(0)

  return (
    <div className={s.screen}>
      <header className={s.head}>
        <button type="button" className={s.back} onClick={() => setView('theme-gallery')}>
          ←
        </button>
        <span className={s.title}>New theme</span>
        <span className={s.sub}>Updates as you change anything · scene 2 of 6</span>
        <div className={s.spacer} />
        <ChromeToggle />
        <button type="button" className={s.ghost} onClick={() => setView('theme-gallery')}>
          Cancel
        </button>
        <button type="button" className={s.primary} onClick={() => setView('theme-gallery')}>
          Save
        </button>
      </header>

      <div className={s.buildBody}>
        <div className={s.builder}>
          <div className={s.section}>Colours</div>
          {COLORS.map(([label, hex], i) => (
            <button
              key={label}
              type="button"
              className={i === focus ? `${s.colorRow} ${s.colorRowOn}` : s.colorRow}
              onClick={() => setFocus(i)}
            >
              <span className={s.colorSwatch} style={{ background: hex }} />
              <span className={s.colorLabel}>{label}</span>
              <span className={s.colorHex}>{hex}</span>
            </button>
          ))}

          <div className={s.section}>Display</div>
          <div className={s.fontPicker}>
            {FONTS.map((f, i) => (
              <button key={f} type="button" className={i === 0 ? `${s.font} ${s.fontOn}` : s.font} style={{ fontFamily: `'${f}', serif` }}>
                {f}
              </button>
            ))}
          </div>

          <div className={s.section}>Body</div>
          <div className={s.fontPicker}>
            <button type="button" className={`${s.font} ${s.fontOn}`} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
              Josefin Sans
            </button>
          </div>

          <p className={s.reassure}>Both fonts ship with your films, so viewers see them exactly as you do.</p>
        </div>

        <div className={s.preview}>
          <div className={s.previewFilm}>
            <Thumb deck={{ ...SAMPLE_DECK, theme: 'warm-editorial' }} sceneIndex={1} aspect="16:9" cover={false} />
          </div>
          <div className={s.previewCap}>Updates as you change anything · scene 2 of 6</div>
        </div>
      </div>
    </div>
  )
}
