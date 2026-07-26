import { useStudio } from '../store'
import { SAMPLE_DECK } from '../sample'
import { Thumb } from '../components/Thumb'
import { ChromeToggle } from '../components/ChromeToggle'
import s from './ThemeStudio.module.css'

const SUGGEST = ['#dd7568', '#c4564a', '#b23b30']
const FONTS = ['Inter Tight', 'Public Sans', 'Sora']
const BRAND: [string, string][] = [
  ['Background', '#f3f4f7'],
  ['Heading text', '#1d2130'],
  ['Body text', '#4f5763'],
  ['Highlight', '#531dab'],
  ['Positive trend', '#17935f'],
  ['Muted fill', '#e9edf4'],
  ['Rules & lines', '#dde0e7'],
  ['Card surface', '#ffffff'],
]

export function ThemeImport() {
  const setView = useStudio((x) => x.setView)

  return (
    <div className={s.screen}>
      <header className={s.head}>
        <button type="button" className={s.back} onClick={() => setView('theme-gallery')}>
          ←
        </button>
        <span className={s.title}>acme-brand</span>
        <span className={s.sub}>created from a screenshot · 6 minutes ago</span>
        <span className={s.pill}>10 of 12 filled automatically</span>
        <div className={s.spacer} />
        <ChromeToggle />
        <button type="button" className={s.ghost} onClick={() => setView('theme-gallery')}>
          Discard
        </button>
        <button type="button" className={s.primary} onClick={() => setView('studio')}>
          Save theme
        </button>
      </header>

      <div className={s.body}>
        <div className={s.preview}>
          <div className={s.previewFilm}>
            <Thumb deck={{ ...SAMPLE_DECK, theme: 'saas-product' }} aspect="16:9" cover={false} />
          </div>
          <div className={s.previewCap}>Previewing your real film with this theme — it updates as you fill slots.</div>
        </div>

        <aside className={s.rail}>
          <div className={s.section}>Two things to pick</div>

          <div className={s.gap}>
            <p className={s.gapText}>
              We couldn't find a colour for <b>negative trends</b> — pick one.
            </p>
            <div className={s.swatchRow}>
              {SUGGEST.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  className={i === 0 ? `${s.swatch} ${s.swatchOn}` : s.swatch}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
              <button type="button" className={s.swatchAdd}>
                +
              </button>
            </div>
            <span className={s.gapHint}>suggested from your palette</span>
          </div>

          <div className={s.gap}>
            <p className={s.gapText}>
              Your site's <b>display font</b> isn't one we can embed. Closest matches:
            </p>
            <div className={s.fonts}>
              {FONTS.map((f, i) => (
                <button
                  key={f}
                  type="button"
                  className={i === 0 ? `${s.font} ${s.fontOn}` : s.font}
                  style={{ fontFamily: `'${f}', sans-serif` }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className={s.section}>Taken from your brand</div>
          <div className={s.brand}>
            {BRAND.map(([label, hex]) => (
              <div key={label} className={s.brandRow}>
                <span className={s.brandSwatch} style={{ background: hex }} />
                <span className={s.brandLabel}>{label}</span>
              </div>
            ))}
          </div>
          <div className={s.footNote}>Written by create_theme_from_image · Studio picked up the file</div>
        </aside>
      </div>
    </div>
  )
}
