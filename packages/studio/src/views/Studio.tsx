import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { TopBar } from '../components/TopBar'
import { SceneList } from '../components/SceneList'
import { Player } from '../components/Player'
import { RightPane } from '../components/RightPane'
import { Transport } from '../components/Transport'
import { VerticalTransport } from '../components/VerticalTransport'
import { Filmstrip } from '../components/Filmstrip'
import { CommandBar } from '../components/CommandBar'
import { RenderDialog } from '../components/RenderDialog'
import { useStudio } from '../store'
import s from '../App.module.css'

export function Studio() {
  const clean = useStudio((x) => x.cleanPreview)
  const deck = useStudio((x) => x.deck)
  const vertical = deck?.aspect === '9:16'

  if (clean) {
    return (
      <div className={s.clean}>
        <Player />
        <RenderDialog />
      </div>
    )
  }

  return (
    <div className={s.app}>
      <TopBar />
      {/* key remounts the group when the pane count changes (3-pane ⇄ 9:16
          4-pane) — react-resizable-panels can't reconcile a changed child set. */}
      <PanelGroup key={vertical ? 'vertical' : 'horizontal'} direction="horizontal" className={s.body}>
        {vertical ? (
          <>
            <Panel defaultSize={15} minSize={11} maxSize={22}>
              <Filmstrip />
            </Panel>
            <PanelResizeHandle className={s.handle} />
            <Panel defaultSize={53} minSize={28}>
              <Player />
            </Panel>
            <PanelResizeHandle className={s.handle} />
            <Panel defaultSize={11} minSize={9} maxSize={15}>
              <VerticalTransport />
            </Panel>
            <PanelResizeHandle className={s.handle} />
            <Panel defaultSize={21} minSize={15} maxSize={30}>
              <RightPane />
            </Panel>
          </>
        ) : (
          <>
            <Panel defaultSize={17} minSize={12} maxSize={26}>
              <SceneList />
            </Panel>
            <PanelResizeHandle className={s.handle} />
            <Panel defaultSize={60} minSize={30}>
              <Player />
            </Panel>
            <PanelResizeHandle className={s.handle} />
            <Panel defaultSize={23} minSize={16} maxSize={34}>
              <RightPane />
            </Panel>
          </>
        )}
      </PanelGroup>
      {!vertical ? <Transport /> : null}
      <CommandBar />
      <RenderDialog />
    </div>
  )
}
