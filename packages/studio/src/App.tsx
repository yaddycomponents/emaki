import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Toolbar } from './components/Toolbar'
import { SceneTree } from './components/SceneTree'
import { Player } from './components/Player'
import { Inspector } from './components/Inspector'
import { CommandBar } from './components/CommandBar'
import s from './App.module.css'

export function App() {
  return (
    <div className={s.app}>
      <Toolbar />
      <PanelGroup direction="horizontal" className={s.body}>
        <Panel defaultSize={20} minSize={14}>
          <SceneTree />
        </Panel>
        <PanelResizeHandle className={s.handle} />
        <Panel defaultSize={52} minSize={30}>
          <Player />
        </Panel>
        <PanelResizeHandle className={s.handle} />
        <Panel defaultSize={28} minSize={20}>
          <Inspector />
        </Panel>
      </PanelGroup>
      <CommandBar />
    </div>
  )
}
