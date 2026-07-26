import { useEffect, useRef, useState } from 'react'
import { Block, AnimContext, FramerAnim, ThemeProvider } from '@emaki/blocks'
import { resolveTheme } from '@emaki/themes'
import { ASPECT_DIMENSIONS } from '@emaki/schema'
import { useStudio } from '../store'
import { sceneFrames, FPS } from '../timing'
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
  const clean = useStudio((x) => x.cleanPreview)
  const select = useStudio((x) => x.select)
  const setPlaying = useStudio((x) => x.setPlaying)
  const loop = useStudio((x) => x.loop)

  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)
  const dim = ASPECT_DIMENSIONS[deck?.aspect ?? '9:16']

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const fit = () => {
      const cw = el.clientWidth - 56
      const ch = el.clientHeight - 56
      if (cw > 0 && ch > 0) setScale(Math.min(cw / dim.width, ch / dim.height))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [dim.width, dim.height])

  useEffect(() => {
    if (!playing || !deck) return
    const secs = sceneFrames(deck)[selected]! / FPS
    const t = setTimeout(() => {
      if (selected < deck.scenes.length - 1) select(selected + 1)
      else if (loop) select(0)
      else setPlaying(false)
    }, secs * 1000)
    return () => clearTimeout(t)
  }, [playing, selected, deck, select, setPlaying, loop])

  const scene = deck?.scenes[selected]
  const frames = deck ? sceneFrames(deck) : []
  const totalF = frames.reduce((a, b) => a + b, 0)

  return (
    <div className={s.wrap}>
      <div ref={stageRef} className={s.stage}>
        {deck && scene ? (
          <div
            className={s.frame}
            style={{ width: dim.width, height: dim.height, transform: `translate(-50%, -50%) scale(${scale})` }}
          >
            <div key={`${selected}-${deck.aspect}-${deck.theme}`} className={s.scene}>
              <ThemeProvider theme={safeTheme(deck.theme)}>
                <AnimContext.Provider value={FramerAnim}>
                  <Block scene={scene} aspect={deck.aspect} />
                </AnimContext.Provider>
              </ThemeProvider>
            </div>
          </div>
        ) : (
          <div className={s.empty}>Fix the deck to preview</div>
        )}
      </div>
      {!clean ? (
        <div className={s.info}>
          {dim.width}×{dim.height} · {FPS} fps · scene {String(selected + 1).padStart(2, '0')} ·{' '}
          {frames[selected] ?? 0}f / {totalF}f
        </div>
      ) : null}
    </div>
  )
}
