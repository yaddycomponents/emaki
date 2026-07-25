import * as z from 'zod'
import { Aspect } from './aspect'
import { titleBlock, statementBlock, statBlock, compareBarsBlock } from './blocks'
import { createRegistry, type BlockDef } from './registry'

export const DECK_VERSION = 1
export const DEFAULT_WORDS_PER_SECOND = 2.2

/** The shared per-scene envelope: identity, block type, props, timing overrides. */
function sceneEnvelope<T extends string, P extends z.ZodType>(type: T, props: P) {
  return z.object({
    id: z.string().min(1).meta({ description: 'Unique, stable scene id.' }),
    type: z.literal(type),
    props,
    dur: z
      .number()
      .positive()
      .optional()
      .meta({ description: 'Override the computed duration, in seconds.' }),
    hold: z
      .number()
      .min(0)
      .optional()
      .meta({ description: 'Extra seconds held after motion settles.' }),
  })
}

// Canonical scene union — built explicitly from the bootstrap blocks so `Deck`
// infers precise per-branch prop types.
const TitleScene = sceneEnvelope('title', titleBlock.props)
const StatementScene = sceneEnvelope('statement', statementBlock.props)
const StatScene = sceneEnvelope('stat', statBlock.props)
const CompareScene = sceneEnvelope('compare-bars', compareBarsBlock.props)

export const SceneSchema = z
  .discriminatedUnion('type', [TitleScene, StatementScene, StatScene, CompareScene])
  .meta({ id: 'Scene' })

function deckSchema<S extends z.ZodType>(scene: S) {
  return z
    .object({
      version: z
        .literal(DECK_VERSION)
        .meta({ description: 'Deck schema version. Currently 1.' }),
      title: z.string().optional().meta({ description: 'Human label for the deck.' }),
      aspect: Aspect.default('9:16'),
      theme: z
        .string()
        .default('warm-editorial')
        .meta({ description: 'Theme id from @emaki/themes.' }),
      wordsPerSecond: z
        .number()
        .positive()
        .default(DEFAULT_WORDS_PER_SECOND)
        .meta({ description: 'Narration pace used to compute scene durations.' }),
      scenes: z.array(scene).min(1, 'A deck needs at least one scene.'),
    })
    .meta({
      id: 'Deck',
      title: 'Emaki Deck',
      description: 'A deck is an ordered list of scenes rendered at one aspect ratio.',
    })
}

/** The canonical deck schema — the single source of truth for types + JSON Schema. */
export const DeckSchema = deckSchema(SceneSchema)

export type Deck = z.infer<typeof DeckSchema>
export type Scene = z.infer<typeof SceneSchema>

/**
 * Build a deck schema against an arbitrary block registry. Used by the studio
 * and third-party template packs, which register their own blocks. Typed
 * loosely on purpose — the canonical `DeckSchema`/`Deck` above stay strict.
 */
export function buildDeckSchema(blocks: readonly BlockDef[]) {
  const reg = createRegistry(blocks)
  const members = Object.values(reg).map((b) => sceneEnvelope(b.type, b.props))
  if (members.length === 0) throw new Error('buildDeckSchema needs at least one block.')
  // A plain union (not discriminatedUnion): dynamic block types are generic
  // strings, not the string literals discriminatedUnion requires. The canonical
  // DeckSchema above keeps the discriminated union for precise error messages.
  const scene =
    members.length === 1
      ? members[0]!
      : z.union(members as unknown as [z.ZodType, z.ZodType, ...z.ZodType[]])
  return deckSchema(scene as z.ZodType)
}
