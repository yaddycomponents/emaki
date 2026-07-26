import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { parseDeck, type Aspect, type Deck } from '@emaki/schema'
import { SAMPLE_DECK, TEMPLATE_DECKS } from './sample'

export type View =
  | 'first-run'
  | 'studio'
  | 'templates'
  | 'theme-gallery'
  | 'theme-import'
  | 'theme-blank'
  | 'inventory'

export interface CommandEntry {
  command: string
  result: string
  ms: number
}

export type ChangeKind = 'updated' | 'new' | 'removed'
export interface Change {
  kind: ChangeKind
  rationale?: string
  at: number
}

export interface RenderState {
  status: 'idle' | 'setup' | 'running' | 'done' | 'failed'
  frame: number
  total: number
  output: string
  error?: string
}

export interface McpState {
  connected: boolean
  clientName: string
  lastCall?: { tool: string; at: number; ops: number }
}

type ChromeTheme = 'dark' | 'light'

interface StudioState {
  view: View
  text: string
  deck: Deck | null
  error: string | null

  selected: number
  playing: boolean
  loop: boolean
  cleanPreview: boolean
  chrome: ChromeTheme

  commandLog: CommandEntry[]
  render: RenderState
  mcp: McpState
  changes: Record<string, Change>
  reloadedAt: number | null

  setView: (view: View) => void
  openDeck: (deck: Deck, command: string) => void
  setText: (text: string) => void
  select: (index: number) => void
  addScene: () => void
  removeScene: (index: number) => void
  moveScene: (from: number, to: number) => void
  setAspect: (aspect: Aspect) => void
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  toggleLoop: () => void
  toggleClean: () => void
  toggleChrome: () => void
  log: (command: string, result?: string, ms?: number) => void

  startRender: () => void
  setRenderOutput: (output: string) => void
  beginRender: () => void
  setRenderFrame: (frame: number) => void
  finishRender: () => void
  cancelRender: () => void

  connectMcp: () => void
  disconnectMcp: () => void
  simulateMcpEdit: () => void
  dismissChanges: () => void
}

const initialText = JSON.stringify(SAMPLE_DECK, null, 2)

function parse(text: string): { deck: Deck | null; error: string | null } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    return { deck: null, error: (e as Error).message }
  }
  const result = parseDeck(raw)
  return result.ok ? { deck: result.deck, error: null } : { deck: null, error: result.message }
}

const initial = parse(initialText)
const now = () => Date.now()

function initialView(): View {
  try {
    const v = new URLSearchParams(window.location.search).get('view')
    const ok: View[] = ['first-run', 'studio', 'templates', 'theme-gallery', 'theme-import', 'theme-blank', 'inventory']
    if (v && (ok as string[]).includes(v)) return v as View
  } catch {
    /* no window */
  }
  return 'first-run'
}

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
  view: initialView(),
  text: initialText,
  deck: initial.deck,
  error: initial.error,

  selected: 0,
  playing: false,
  loop: false,
  cleanPreview: false,
  chrome: 'light',

  commandLog: [{ command: 'emaki studio', result: 'ready', ms: 8 }],
  render: { status: 'idle', frame: 0, total: 0, output: 'out/film.mp4' },
  mcp: { connected: false, clientName: 'claude-code' },
  changes: {},
  reloadedAt: null,

  setView: (view) => set({ view }),

  openDeck: (deck, command) => {
    set({
      view: 'studio',
      text: JSON.stringify(deck, null, 2),
      deck,
      error: null,
      selected: 0,
      changes: {},
      reloadedAt: null,
    })
    get().log(command, 'ok', 12)
  },

  setText: (text) => {
    const { deck, error } = parse(text)
    set((s) => ({
      text,
      deck: deck ?? s.deck,
      error,
      selected: deck ? Math.min(s.selected, deck.scenes.length - 1) : s.selected,
    }))
  },

  select: (index) => set({ selected: index, playing: false }),

  addScene: () => {
    const { deck, selected } = get()
    if (!deck) return
    const next = structuredClone(deck)
    const at = Math.min(selected + 1, next.scenes.length)
    const id = `scene-${now().toString(36)}`
    next.scenes.splice(at, 0, { id, type: 'statement', props: { text: 'New scene.' } })
    get().setText(JSON.stringify(next, null, 2))
    set({ selected: at })
    get().log('add scene · statement', 'ok', 2)
  },

  removeScene: (index) => {
    const { deck } = get()
    if (!deck || deck.scenes.length <= 1) return
    const next = structuredClone(deck)
    next.scenes.splice(index, 1)
    get().setText(JSON.stringify(next, null, 2))
    set((s) => ({ selected: Math.max(0, Math.min(s.selected, next.scenes.length - 1)) }))
    get().log('remove scene', 'ok', 2)
  },

  moveScene: (from, to) => {
    const { deck } = get()
    if (!deck || from === to || from < 0 || to < 0 || to >= deck.scenes.length) return
    const next = structuredClone(deck)
    const [moved] = next.scenes.splice(from, 1)
    if (!moved) return
    next.scenes.splice(to, 0, moved)
    get().setText(JSON.stringify(next, null, 2))
    set({ selected: to })
    get().log('reorder scenes', 'ok', 2)
  },

  setAspect: (aspect) => {
    const { deck } = get()
    if (!deck) return
    get().setText(JSON.stringify({ ...deck, aspect }, null, 2))
    get().log(`emaki studio deck.json --aspect ${aspect}`, 'ok', 4)
  },

  togglePlay: () => set((s) => ({ playing: !s.playing })),
  setPlaying: (playing) => set({ playing }),
  toggleLoop: () => set((s) => ({ loop: !s.loop })),
  toggleClean: () => set((s) => ({ cleanPreview: !s.cleanPreview })),
  toggleChrome: () => set((s) => ({ chrome: s.chrome === 'dark' ? 'light' : 'dark' })),

  log: (command, result = 'ok', ms = 0) =>
    set((s) => ({ commandLog: [...s.commandLog, { command, result, ms }].slice(-30) })),

  startRender: () => {
    const { deck, error, render } = get()
    if (error || !deck) {
      set({
        render: {
          ...render,
          status: 'failed',
          frame: 214,
          total: 555,
          error:
            "TypeError: Cannot read properties of undefined (reading 'length')\n  at CodeBlock (blocks/code.tsx:41:22)\n  body.emphasis references line 3 of a 2-line source",
        },
      })
      get().log(`emaki render deck.json --aspect ${deck?.aspect ?? '9:16'}`, 'failed', 0)
      return
    }
    // ask for the output path before running
    set({ render: { ...render, status: 'setup', frame: 0, total: 0, error: undefined } })
  },
  setRenderOutput: (output) => set((s) => ({ render: { ...s.render, output } })),
  beginRender: () => {
    const { deck, render } = get()
    if (!deck) return
    set({ render: { ...render, status: 'running', frame: 0, total: 0 } })
    get().log(`emaki render deck.json --aspect ${deck.aspect} --out ${render.output}`, 'running', 2)
  },
  setRenderFrame: (frame) => set((s) => ({ render: { ...s.render, frame } })),
  finishRender: () =>
    set((s) => {
      get().log(`emaki render deck.json --out ${s.render.output}`, `done · ${s.render.total}f`, 0)
      return { render: { ...s.render, status: 'done' } }
    }),
  cancelRender: () => set((s) => ({ render: { ...s.render, status: 'idle', frame: 0, total: 0, error: undefined } })),

  connectMcp: () =>
    set({ mcp: { connected: true, clientName: 'claude-code', lastCall: undefined } }),
  disconnectMcp: () => set({ mcp: { connected: false, clientName: 'claude-code' } }),

  // Stands in for a real apply_ops write picked up by the file-watcher (tomorrow):
  // patches a scene, inserts one, removes one — and marks the changes.
  simulateMcpEdit: () => {
    const { deck } = get()
    if (!deck || deck.scenes.length < 2) return
    const next = structuredClone(deck)
    const patched = next.scenes[1]!
    if (patched.type === 'statement') {
      ;(patched.props as { text: string }).text = 'Two years of debt, cleared in one branch.'
    }
    const inserted = {
      id: `scene-${next.scenes.length + 1}`,
      type: 'stat' as const,
      props: { value: '16', label: 'debts closed', caption: 'across three repos' },
    }
    next.scenes.splice(2, 0, inserted)
    const changes: Record<string, Change> = {
      [patched.id]: {
        kind: 'updated',
        rationale: 'The caption restated the title, so I replaced it with the number the title doesn’t give.',
        at: now(),
      },
      [inserted.id]: { kind: 'new', at: now() },
    }
    set({
      view: 'studio',
      text: JSON.stringify(next, null, 2),
      deck: next,
      error: null,
      changes,
      reloadedAt: now(),
      mcp: { connected: true, clientName: 'claude-code', lastCall: { tool: 'apply_ops', at: now(), ops: 3 } },
    })
    get().log('deck.json changed on disk · reloaded', 'ok', 31)
  },
  dismissChanges: () => set({ changes: {}, reloadedAt: null }),
    }),
    {
      name: 'emaki-studio',
      // Persist only the durable bits; transient UI (playing, render, changes) resets.
      partialize: (s) => ({ text: s.text, chrome: s.chrome, selected: s.selected, view: s.view }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const { deck, error } = parse(state.text)
        state.deck = deck
        state.error = error
        // never rehydrate straight into full-screen preview
        state.cleanPreview = false
      },
    },
  ),
)

export { TEMPLATE_DECKS }
