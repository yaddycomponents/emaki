import { create } from 'zustand'
import { parseDeck, type Aspect, type Deck } from '@emaki/schema'
import { SAMPLE_DECK } from './sample'

export interface CommandEntry {
  command: string
  result: string
  ms: number
}

type ChromeTheme = 'dark' | 'light'

interface StudioState {
  /** The editable JSON text — the source of truth the inspector binds to. */
  text: string
  deck: Deck | null
  error: string | null

  selected: number
  playing: boolean
  loop: boolean
  cleanPreview: boolean
  chrome: ChromeTheme

  commandLog: CommandEntry[]

  setText: (text: string) => void
  select: (index: number) => void
  setAspect: (aspect: Aspect) => void
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  toggleLoop: () => void
  toggleClean: () => void
  toggleChrome: () => void
  log: (command: string, result?: string, ms?: number) => void
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

export const useStudio = create<StudioState>((set, get) => ({
  text: initialText,
  deck: initial.deck,
  error: initial.error,

  selected: 0,
  playing: false,
  loop: false,
  cleanPreview: false,
  chrome: 'dark',

  commandLog: [{ command: 'emaki studio deck.json', result: 'ready', ms: 8 }],

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
    set((s) => ({ commandLog: [...s.commandLog, { command, result, ms }].slice(-20) })),
}))
