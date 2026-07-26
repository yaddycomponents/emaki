import { Moon, Sun } from 'lucide-react'
import { useStudio } from '../store'
import s from './ChromeToggle.module.css'

/** Dark/light chrome toggle — available on every screen's top bar. */
export function ChromeToggle() {
  const chrome = useStudio((x) => x.chrome)
  const toggle = useStudio((x) => x.toggleChrome)
  return (
    <button type="button" className={s.btn} onClick={toggle} aria-label="toggle light/dark" title="Toggle light / dark">
      {chrome === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
