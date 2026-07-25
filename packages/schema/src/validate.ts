import * as z from 'zod'
import { DeckSchema, type Deck } from './deck'

export interface ValidateOk {
  ok: true
  deck: Deck
}

export interface ValidateErr {
  ok: false
  /** Human-readable, path-annotated error text for the terminal. */
  message: string
  /** Structured issue tree for `--json` consumers. */
  issues: unknown
}

export type ValidateResult = ValidateOk | ValidateErr

/** Parse and validate an unknown value as a deck. Never throws. */
export function parseDeck(input: unknown): ValidateResult {
  const result = DeckSchema.safeParse(input)
  if (result.success) return { ok: true, deck: result.data }
  return {
    ok: false,
    message: z.prettifyError(result.error),
    issues: z.treeifyError(result.error),
  }
}
