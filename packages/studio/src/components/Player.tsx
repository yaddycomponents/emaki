import { useEffect, useRef, useState } from 'react'
import { Block, AnimContext, FramerAnim, ThemeProvider } from '@emaki/blocks'
import { resolveTheme } from '@emaki/themes'
import { ASPECT_DIMENSIONS, deckDuration } from '@emaki/schema'
import { useStudio } from '../store'
import s from './Player.module.css'

function safeTheme(id: string) {
  try {
    return resolveTheme(id)
  } catch {
    return resolveTheme('warm-editorial')
  }
}

export function Player() {
  const deck = useStudio((x) => x.deck)
  const selected = useStudio((x) => x.selected)
  const playing = useStudio((x) => x.playing)
  const select = useStudio((x) => x.select)
  const setPlaying = useStudio((x) => x.setPlaying)

  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const dim = ASPECT_DIMENSIONS[deck?.aspect ?? '9:16']

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const fit = () => {
      const cw = el.clientWidth
      const ch = el.clientHeight
      if (cw && ch) setScale(Math.min(cw / dim.width, ch / dim.height) * 0.9)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [dim.width, dim.height])

  useEffect(() => {
    if (!playing || !deck) return
    const secs = deckDuration(deck).scenes[selected]?.dur ?? 3
    const t = setTimeout(() => {
      if (selected < deck.scenes.length - 1) select(selected + 1)
      else setPlaying(false)
    }, secs * 1000)
    return () => clearTimeout(t)
  }, [playing, selected, deck, select, setPlaying])

  if (!deck) {
    return (
      <div ref={wrapRef} className={s.stage}>
        <div className={s.empty}>Fix the deck to preview</div>
      </div>
    )
  }

  const scene = deck.scenes[selected]
  const theme = safeTheme(deck.theme)

  return (
    <div ref={wrapRef} className={s.stage}>
      <div className={s.frame} style={{ width: dim.width, height: dim.height, transform: `translate(-50%, -50%) scale(${scale})` }}>
        {/* key replays the scene's entrance on any change */}
        <div key={`${selected}-${deck.aspect}-${deck.theme}`} className={s.scene}>
          {scene ? (
            <ThemeProvider theme={theme}>
              <AnimContext.Provider value={FramerAnim}>
                <Block scene={scene} aspect={deck.aspect} />
              </AnimContext.Provider>
            </ThemeProvider>
          ) : null}
        </div>
      </div>
    </div>
  )
}
