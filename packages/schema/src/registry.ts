import * as z from 'zod'

/**
 * A block is the unit a scene renders. In Week 1 a block only needs a props
 * schema and (optionally) the narratable text used to compute duration.
 *
 * Week 2 adds `layouts` (per-aspect) and a single `timeline` descriptor here —
 * declared as optional now so the deck shape is stable before blocks land in
 * `@emaki/blocks`.
 */
export interface BlockDef<P extends z.ZodType = z.ZodType> {
  type: string
  props: P
  /** The words spoken/read in this block — words / wordsPerSecond drives dur. */
  text?: (props: z.infer<P>) => string
}

export function defineBlock<P extends z.ZodType>(def: BlockDef<P>): BlockDef<P> {
  return def
}

export type BlockRegistry = Record<string, BlockDef>

export function createRegistry(blocks: readonly BlockDef[]): BlockRegistry {
  const reg: BlockRegistry = {}
  for (const b of blocks) {
    if (reg[b.type]) throw new Error(`Duplicate block type registered: ${b.type}`)
    reg[b.type] = b
  }
  return reg
}
