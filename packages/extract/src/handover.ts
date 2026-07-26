import { type Aspect, type Deck, parseDeck } from '@emaki/schema'

/**
 * A *handover* is the lenient authoring format the host model produces when it
 * "extracts" a film from a source — a PDF, a screenshot, or a chat handover.
 * Emaki never looks at the source itself; the model does, and hands over a
 * compact description. This converts that description into a validated deck,
 * deterministically:
 *
 *   - no `id` needed (assigned s1, s2, …), no `version` needed
 *   - props may be inline (`{ type:'title', text:'…' }`) or nested (`{…, props:{…}}`)
 *   - invalid scenes are reported per-scene so the model can fix precisely
 *
 * It invents nothing — every value comes from the handover. If a metric isn't in
 * the handover it isn't in the deck.
 */

export interface HandoverOptions {
  aspect?: Aspect
  theme?: string
  title?: string
}

export interface HandoverIssue {
  /** 0-based index into the handover's scenes; -1 for a deck-level issue. */
  scene: number
  id?: string
  type?: string
  message: string
}

export type HandoverResult =
  | { ok: true; deck: Deck; notes: string[] }
  | { ok: false; issues: HandoverIssue[]; message: string }

interface NormalScene {
  id: string
  type: string
  props: Record<string, unknown>
  dur?: number
  hold?: number
}

const RESERVED = new Set(['id', 'type', 'props', 'dur', 'hold'])

function normalizeScene(raw: unknown, i: number): NormalScene | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const type = typeof o.type === 'string' ? o.type : ''
  const id = typeof o.id === 'string' && o.id ? o.id : `s${i + 1}`

  let props: Record<string, unknown>
  if (o.props && typeof o.props === 'object' && !Array.isArray(o.props)) {
    props = o.props as Record<string, unknown>
  } else {
    props = {}
    for (const [k, v] of Object.entries(o)) if (!RESERVED.has(k)) props[k] = v
  }

  const scene: NormalScene = { id, type, props }
  if (typeof o.dur === 'number') scene.dur = o.dur
  if (typeof o.hold === 'number') scene.hold = o.hold
  return scene
}

export function extractHandover(handover: unknown, opts: HandoverOptions = {}): HandoverResult {
  const h = (handover ?? {}) as Record<string, unknown>
  const rawScenes = Array.isArray(h.scenes) ? h.scenes : []
  if (rawScenes.length === 0) {
    return {
      ok: false,
      issues: [],
      message: 'Handover has no scenes. Expected { scenes: [{ type, ...props }] }.',
    }
  }

  const scenes: NormalScene[] = []
  for (let i = 0; i < rawScenes.length; i++) {
    const s = normalizeScene(rawScenes[i], i)
    if (s === null) {
      return {
        ok: false,
        issues: [{ scene: i, message: 'scene is not an object' }],
        message: `scene ${i} is not an object`,
      }
    }
    scenes.push(s)
  }

  const aspect = opts.aspect ?? h.aspect
  const theme = opts.theme ?? h.theme
  const title = opts.title ?? (typeof h.title === 'string' ? h.title : undefined)

  const full = parseDeck({ version: 1, title, aspect, theme, scenes })
  if (full.ok) {
    const notes: string[] = []
    if (rawScenes.some((s) => !(s as Record<string, unknown>)?.id)) {
      notes.push('Assigned scene ids (s1, s2, …); none were provided.')
    }
    return { ok: true, deck: full.deck, notes }
  }

  // The full parse failed — localise each broken scene so the model gets a
  // precise "scene 2 (ui-scene): …" instead of one deep union error.
  const issues: HandoverIssue[] = []
  for (let i = 0; i < scenes.length; i++) {
    const one = parseDeck({ version: 1, scenes: [scenes[i]] })
    if (!one.ok) {
      issues.push({ scene: i, id: scenes[i]!.id, type: scenes[i]!.type, message: one.message })
    }
  }
  if (issues.length === 0) issues.push({ scene: -1, message: full.message })
  return { ok: false, issues, message: full.message }
}
