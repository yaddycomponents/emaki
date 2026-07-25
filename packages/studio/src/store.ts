import { type Aspect, type Deck, parseDeck } from "@emaki/schema";
import { create } from "zustand";
import { SAMPLE_DECK } from "./sample";

interface StudioState {
  /** The editable JSON text — the source of truth the inspector binds to. */
  text: string;
  /** Last successfully parsed deck; kept while text is mid-edit/invalid. */
  deck: Deck | null;
  error: string | null;
  selected: number;
  playing: boolean;

  setText: (text: string) => void;
  select: (index: number) => void;
  setAspect: (aspect: Aspect) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
}

const initialText = JSON.stringify(SAMPLE_DECK, null, 2);

function parse(text: string): { deck: Deck | null; error: string | null } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { deck: null, error: (e as Error).message };
  }
  const result = parseDeck(raw);
  return result.ok
    ? { deck: result.deck, error: null }
    : { deck: null, error: result.message };
}

const initial = parse(initialText);

export const useStudio = create<StudioState>((set, get) => ({
  text: initialText,
  deck: initial.deck,
  error: initial.error,
  selected: 0,
  playing: false,

  setText: (text) => {
    const { deck, error } = parse(text);
    set((s) => ({
      text,
      // keep the last good deck visible while the edit is invalid
      deck: deck ?? s.deck,
      error,
      selected: deck
        ? Math.min(s.selected, deck.scenes.length - 1)
        : s.selected,
    }));
  },

  select: (index) => set({ selected: index, playing: false }),

  setAspect: (aspect) => {
    const { deck } = get();
    if (!deck) return;
    const next = JSON.stringify({ ...deck, aspect }, null, 2);
    get().setText(next);
  },

  togglePlay: () => set((s) => ({ playing: !s.playing })),
  setPlaying: (playing) => set({ playing }),
}));
