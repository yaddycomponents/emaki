import * as z from 'zod'
import { defineBlock } from './registry'

/**
 * Bootstrap blocks.
 *
 * These are minimal prop schemas so `emaki validate` is genuinely useful in
 * Week 1 (a hand-written deck fails with a real error). The full blocks — with
 * per-aspect `layouts` and a `timeline` — move to `@emaki/blocks` in Week 2.
 * Keep the prop names stable; that is the contract templates depend on.
 */

export const titleBlock = defineBlock({
  type: 'title',
  props: z
    .object({
      text: z.string().min(1).meta({ description: 'The headline.' }),
      kicker: z.string().optional().meta({ description: 'Small label shown above the title.' }),
    })
    .meta({ id: 'TitleProps' }),
  text: (p) => [p.kicker, p.text].filter(Boolean).join(' '),
})

export const statementBlock = defineBlock({
  type: 'statement',
  props: z
    .object({
      text: z.string().min(1).meta({ description: 'A single load-bearing sentence.' }),
      emphasis: z
        .array(z.string())
        .optional()
        .meta({ description: 'Substrings of `text` to accent.' }),
    })
    .meta({ id: 'StatementProps' }),
  text: (p) => p.text,
})

export const statBlock = defineBlock({
  type: 'stat',
  props: z
    .object({
      value: z.string().min(1).meta({ description: 'The big number, e.g. "5,400".' }),
      label: z.string().min(1).meta({ description: 'What the number counts.' }),
      caption: z.string().optional().meta({ description: 'One line of context under the stat.' }),
    })
    .meta({ id: 'StatProps' }),
  text: (p) => [p.value, p.label, p.caption].filter(Boolean).join(' '),
})

/** The registered set the canonical `DeckSchema` validates against in Week 1. */
export const BOOTSTRAP_BLOCKS = [titleBlock, statementBlock, statBlock] as const
