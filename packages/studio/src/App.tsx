import { useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { TopBar } from './components/TopBar'
import { SceneList } from './components/SceneList'
import { Player } from './components/Player'
import { RightPane } from './components/RightPane'
import { Transport } from './components/Transport'
import { CommandBar } from './components/CommandBar'
import { useStudio } from './store'
import s from './App.module.css'

export function App() {
  const chrome = useStudio((x) => x.chrome)
  const clean = useStudio((x) => x.cleanPreview)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', chrome)
  }, [chrome])

  if (clean) {
    return (
      <div className={s.clean}>
        <Player />
      </div>
    )
  }

  return (
    <div className={s.app}>
      <TopBar />
      <PanelGroup direction="horizontal" className={s.body}>
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
      </PanelGroup>
      <Transport />
      <CommandBar />
    </div>
  )
}
