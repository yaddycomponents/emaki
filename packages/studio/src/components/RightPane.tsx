import { useEffect, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Inspector } from './Inspector'
import { JsonEditor } from './JsonEditor'
import { Narration } from './Narration'
import { useStudio } from '../store'
import s from './RightPane.module.css'

export function RightPane() {
  const changes = useStudio((x) => x.changes)
  const reloadedAt = useStudio((x) => x.reloadedAt)
  const dismiss = useStudio((x) => x.dismissChanges)
  const [tab, setTab] = useState('inspector')

  useEffect(() => {
    if (reloadedAt) setTab('json')
  }, [reloadedAt])

  const changed = Object.keys(changes).length > 0
  const rationale = Object.values(changes).find((c) => c.rationale)?.rationale

  return (
    <div className={s.pane}>
      {changed ? (
        <div className={s.prov}>
          <div className={s.provHead}>
            <span className={s.provLabel}>From an MCP tool call</span>
            <button type="button" className={s.provDismiss} onClick={dismiss}>
              dismiss
            </button>
          </div>
          {rationale ? <p className={s.provText}>{rationale}</p> : null}
          <div className={s.provMeta}>apply_ops · patch scene 02 · claude-code · just now · 3 ops</div>
        </div>
      ) : null}

      <Tabs.Root value={tab} onValueChange={setTab} className={s.tabsRoot}>
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
    </div>
  )
}
