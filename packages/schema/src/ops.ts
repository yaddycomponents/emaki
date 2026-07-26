import * as z from 'zod'
import { SceneSchema, DeckSchema, type Deck, type Scene } from './deck'

/**
 * A scene operation — the unit an MCP tool proposes and `apply_ops` writes.
 * Small and composable: insert / replace / patch / remove. The AI host builds
 * these; Studio never mutates the deck directly, only through applyOps.
 */
export const SceneOp = z
  .discriminatedUnion('op', [
    z.object({
      op: z.literal('insertAfter'),
      afterId: z.string().nullable().meta({ description: 'Insert after this scene id; null = at the start.' }),
      scene: SceneSchema,
    }),
    z.object({ op: z.literal('replace'), id: z.string(), scene: SceneSchema }),
    z.object({
      op: z.literal('patch'),
      id: z.string(),
      props: z.record(z.string(), z.unknown()).meta({ description: 'Shallow-merged into the scene props.' }),
    }),
    z.object({ op: z.literal('remove'), id: z.string() }),
  ])
  .meta({ id: 'SceneOp' })

export type SceneOp = z.infer<typeof SceneOp>

export interface OpsResult {
  ok: boolean
  deck: Deck
  applied: number
  /** Ops that could not be applied, with why — never silently dropped. */
  skipped: { op: SceneOp; reason: string }[]
  /** Set when the resulting deck fails schema validation. */
  error?: string
}

/**
 * Apply a list of ops to a deck, then revalidate. Pure — returns a new deck and
 * a report; the caller decides whether to write it. Unknown ids are reported in
 * `skipped`, not thrown.
 */
export function applyOps(deck: Deck, ops: SceneOp[]): OpsResult {
  const scenes: Scene[] = structuredClone(deck.scenes)
  const skipped: OpsResult['skipped'] = []
  let applied = 0
  const indexOf = (id: string) => scenes.findIndex((s) => s.id === id)

  for (const op of ops) {
    if (op.op === 'insertAfter') {
      const at = op.afterId === null ? 0 : indexOf(op.afterId)
      if (op.afterId !== null && at === -1) {
        skipped.push({ op, reason: `no scene "${op.afterId}"` })
        continue
      }
      scenes.splice(op.afterId === null ? 0 : at + 1, 0, op.scene)
      applied++
    } else if (op.op === 'replace') {
      const at = indexOf(op.id)
      if (at === -1) {
        skipped.push({ op, reason: `no scene "${op.id}"` })
        continue
      }
      scenes[at] = op.scene
      applied++
    } else if (op.op === 'patch') {
      const at = indexOf(op.id)
      if (at === -1) {
        skipped.push({ op, reason: `no scene "${op.id}"` })
        continue
      }
      const target = scenes[at]!
      scenes[at] = { ...target, props: { ...(target.props as object), ...op.props } } as Scene
      applied++
    } else {
      const at = indexOf(op.id)
      if (at === -1) {
        skipped.push({ op, reason: `no scene "${op.id}"` })
        continue
      }
      scenes.splice(at, 1)
      applied++
    }
  }

  const candidate = { ...deck, scenes }
  const parsed = DeckSchema.safeParse(candidate)
  if (!parsed.success) {
    return { ok: false, deck, applied, skipped, error: z.prettifyError(parsed.error) }
  }
  return { ok: true, deck: parsed.data, applied, skipped }
}
