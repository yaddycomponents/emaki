import * as Tabs from '@radix-ui/react-tabs'
import { Inspector } from './Inspector'
import { JsonEditor } from './JsonEditor'
import { Narration } from './Narration'
import s from './RightPane.module.css'

export function RightPane() {
  return (
    <Tabs.Root defaultValue="inspector" className={s.pane}>
      <Tabs.List className={s.tabs} aria-label="scene tools">
        <Tabs.Trigger value="inspector" className={s.tab}>
          Inspector
        </Tabs.Trigger>
        <Tabs.Trigger value="json" className={s.tab}>
          JSON
        </Tabs.Trigger>
        <Tabs.Trigger value="narration" className={s.tab}>
          Narration
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="inspector" className={s.content}>
        <Inspector />
      </Tabs.Content>
      <Tabs.Content value="json" className={s.content} forceMount>
        <JsonEditor />
      </Tabs.Content>
      <Tabs.Content value="narration" className={s.content}>
        <Narration />
      </Tabs.Content>
    </Tabs.Root>
  )
}
