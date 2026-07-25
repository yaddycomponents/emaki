import * as z from 'zod'
import { DeckSchema } from './deck'

/**
 * The deck JSON Schema, emitted from the same Zod definition. Point Monaco at
 * this in the studio to get block-type autocomplete, inline validation, and
 * hover docs (sourced from the `.meta({ description })` calls) for free.
 *
 * draft-7 is what Monaco's JSON language service understands best.
 */
export function deckJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(DeckSchema, { target: 'draft-7' }) as Record<string, unknown>
}
