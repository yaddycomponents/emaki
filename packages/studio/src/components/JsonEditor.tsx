import { useState } from 'react'
import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react'
import { deckJsonSchema } from '@emaki/schema'
import '../monaco-setup'
import { useStudio } from '../store'
import s from './JsonEditor.module.css'

const schema = deckJsonSchema()

const beforeMount: BeforeMount = (monaco) => {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    schemas: [{ uri: 'emaki://deck.schema.json', fileMatch: ['*'], schema }],
  })
  monaco.editor.defineTheme('emaki', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '8f9ad6' },
      { token: 'string.value.json', foreground: '4fae8c' },
      { token: 'number.json', foreground: 'd3a457' },
      { token: 'keyword.json', foreground: 'd3a457' },
    ],
    colors: {
      'editor.background': '#0c0e12',
      'editor.foreground': '#eef1f6',
      'editorLineNumber.foreground': '#4a5059',
      'editorLineNumber.activeForeground': '#a5adba',
      'editor.lineHighlightBackground': '#8f9ad614',
      'editor.selectionBackground': '#8f9ad633',
      'editorCursor.foreground': '#8f9ad6',
      'editorIndentGuide.background1': '#20242b',
      'editorWidget.background': '#1c2027',
      'editorWidget.border': '#383e49',
    },
  })
}

export function JsonEditor() {
  const text = useStudio((x) => x.text)
  const setText = useStudio((x) => x.setText)
  const error = useStudio((x) => x.error)
  const [pos, setPos] = useState({ line: 1, col: 1 })

  const onMount: OnMount = (editor) => {
    editor.onDidChangeCursorPosition((e) => setPos({ line: e.position.lineNumber, col: e.position.column }))
  }

  return (
    <div className={s.wrap}>
      <div className={s.editor}>
        <Editor
          language="json"
          theme="emaki"
          value={text}
          onChange={(v) => setText(v ?? '')}
          beforeMount={beforeMount}
          onMount={onMount}
          options={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            lineHeight: 19,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 10, bottom: 10 },
            overviewRulerLanes: 0,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'line',
            scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          }}
        />
      </div>
      <div className={s.status}>
        <span>
          Ln {pos.line}, Col {pos.col} · json
        </span>
        <span className={error ? s.problem : s.clean}>{error ? '1 problem' : 'no problems'}</span>
      </div>
    </div>
  )
}
