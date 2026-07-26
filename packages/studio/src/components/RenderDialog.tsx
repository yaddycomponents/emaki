import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useStudio } from '../store'
import { totalFrames, timecode } from '../timing'
import s from './RenderDialog.module.css'

export function RenderDialog() {
  const render = useStudio((x) => x.render)
  const deck = useStudio((x) => x.deck)
  const setFrame = useStudio((x) => x.setRenderFrame)
  const finish = useStudio((x) => x.finishRender)
  const cancel = useStudio((x) => x.cancelRender)

  const open = render.status === 'running' || render.status === 'failed'
  const aspect = deck?.aspect ?? '9:16'

  useEffect(() => {
    if (render.status === 'running' && render.total === 0 && deck) {
      useStudio.setState({ render: { ...useStudio.getState().render, total: totalFrames(deck) } })
    }
  }, [render.status, render.total, deck])

  useEffect(() => {
    if (render.status !== 'running') return
    const total = render.total || (deck ? totalFrames(deck) : 555)
    const id = setInterval(() => {
      const cur = useStudio.getState().render
      if (cur.status !== 'running') return
      const nf = cur.frame + Math.max(3, Math.round(total / 45))
      if (nf >= total) {
        setFrame(total)
        finish()
      } else setFrame(nf)
    }, 80)
    return () => clearInterval(id)
  }, [render.status, render.total, deck, setFrame, finish])

  const total = render.total || 555
  const pct = Math.min(100, Math.round((render.frame / total) * 100))
  const failed = render.status === 'failed'

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && cancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className={s.overlay} />
        <Dialog.Content className={s.content} aria-describedby={undefined}>
          {failed ? (
            <>
              <div className={s.head}>
                <span className={`${s.dot} ${s.dotErr}`} />
                <Dialog.Title className={s.title}>Render failed</Dialog.Title>
                <span className={s.chipMuted}>at frame {render.frame} · 00:23</span>
              </div>
              <div className={s.track}>
                <div className={`${s.fill} ${s.fillErr}`} style={{ width: `${pct}%` }} />
              </div>
              <pre className={s.error}>{render.error}</pre>
              <div className={s.retry}>
                <div className={s.retryLabel}>RETRY WITH</div>
                <code className={s.retryCmd}>
                  emaki render deck.json --aspect {aspect} --from-frame {render.frame} --log verbose
                </code>
              </div>
              <div className={s.footer}>
                <span className={s.note}>partial output discarded</span>
                <div className={s.spacer} />
                <button type="button" className={s.ghost} onClick={cancel}>
                  Close
                </button>
                <button type="button" className={s.primary} onClick={cancel}>
                  Fix and retry
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={s.head}>
                <Dialog.Title className={s.title}>Rendering</Dialog.Title>
                <span className={s.chip}>{aspect}</span>
                <span className={s.chipMuted}>12 workers</span>
              </div>
              <div className={s.row}>
                <span className={s.mono}>
                  {render.frame} / {total} frames
                </span>
                <span className={s.mono}>{pct}%</span>
              </div>
              <div className={s.track}>
                <div className={s.fill} style={{ width: `${pct}%` }} />
              </div>
              <div className={s.rowMuted}>
                <span>elapsed {timecode(render.frame)}</span>
                <span>eta 00:17 · 9.4 fps</span>
              </div>
              <div className={s.specs}>
                <div className={s.spec}>
                  <span>fps</span>
                  <b>30</b>
                </div>
                <div className={s.spec}>
                  <span>scale</span>
                  <b>1× · {aspect === '9:16' ? '1080×1920' : aspect === '1:1' ? '1080×1080' : '1920×1080'}</b>
                </div>
                <div className={s.spec}>
                  <span>codec</span>
                  <b>h264 · crf 18</b>
                </div>
                <div className={s.spec}>
                  <span>audio</span>
                  <b>narration.wav</b>
                </div>
              </div>
              <code className={s.out}>~/src/site/out/film.mp4</code>
              <div className={s.footer}>
                <span className={s.note}>runs in the terminal too — safe to close</span>
                <div className={s.spacer} />
                <button type="button" className={s.ghost} onClick={cancel}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
