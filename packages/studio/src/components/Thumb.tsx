import { useEffect, useRef, useState } from 'react'
import { Block, ThemeProvider } from '@emaki/blocks'
import { resolveTheme } from '@emaki/themes'
import { ASPECT_DIMENSIONS, type Aspect, type Deck } from '@emaki/schema'

function safeTheme(id: string) {
  try {
    return resolveTheme(id)
  } catch {
    return resolveTheme('warm-editorial')
  }
}

/** A static (final-state) representative film frame — thumbnails + previews. */
export function Thumb({ deck, sceneIndex = 0, aspect, cover = true }: { deck: Deck; sceneIndex?: number; aspect?: Aspect; cover?: boolean }) {
  const a = aspect ?? deck.aspect
  const dim = ASPECT_DIMENSIONS[a]
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.1)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      const cw = el.clientWidth
      const ch = el.clientHeight
      if (cw && ch) {
        const s = cover ? Math.max(cw / dim.width, ch / dim.height) : Math.min(cw / dim.width, ch / dim.height)
        setScale(s)
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [dim.width, dim.height, cover])

  const scene = deck.scenes[Math.min(sceneIndex, deck.scenes.length - 1)]

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: dim.width,
          height: dim.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {scene ? (
          <ThemeProvider theme={safeTheme(deck.theme)}>
            <Block scene={scene} aspect={a} />
          </ThemeProvider>
        ) : null}
      </div>
    </div>
  )
}
