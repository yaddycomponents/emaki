import { DeckSchema, type Aspect, type Deck } from '@emaki/schema'

interface Chunk {
  name: string
  bytes: number
}

/** Pull a {name, bytes}[] out of the common rollup/vite/bundle stats shapes. */
function normalize(stats: unknown): Chunk[] {
  const s = stats as Record<string, unknown>
  const fromArray = (arr: unknown[]): Chunk[] =>
    arr
      .map((c) => {
        const o = c as Record<string, unknown>
        const name = String(o.fileName ?? o.name ?? o.id ?? 'chunk')
        const bytes = Number(o.bytes ?? o.size ?? o.renderedLength ?? o.gzip ?? 0)
        return { name, bytes }
      })
      .filter((c) => c.bytes > 0)

  if (Array.isArray(s?.bundles)) return fromArray(s.bundles)
  if (Array.isArray(s?.chunks)) return fromArray(s.chunks)
  if (Array.isArray(stats)) return fromArray(stats)
  if (s?.output && typeof s.output === 'object') {
    return Object.entries(s.output as Record<string, unknown>)
      .map(([name, o]) => ({ name, bytes: Number((o as Record<string, unknown>)?.bytes ?? (o as Record<string, unknown>)?.size ?? 0) }))
      .filter((c) => c.bytes > 0)
  }
  return []
}

const kb = (bytes: number) => `${Math.round(bytes / 1024)} kB`

export interface ExtractOptions {
  aspect?: Aspect
  theme?: string
  title?: string
}

/**
 * A partial deck from a rollup/vite stats file: a title, the total size as a
 * stat, and the heaviest chunks as a list. Deterministic — no model, no invented
 * numbers (everything comes from the stats).
 */
export function extractRollup(stats: unknown, opts: ExtractOptions = {}): Deck {
  const chunks = normalize(stats).sort((a, b) => b.bytes - a.bytes)
  if (chunks.length === 0) {
    throw new Error('No chunk sizes found in stats. Expected {bundles|chunks|output} with byte sizes.')
  }
  const total = chunks.reduce((sum, c) => sum + c.bytes, 0)
  const top = chunks.slice(0, 4)

  return DeckSchema.parse({
    version: 1,
    title: opts.title ?? 'Bundle',
    aspect: opts.aspect ?? '9:16',
    theme: opts.theme ?? 'saas-product',
    scenes: [
      { id: 'open', type: 'title', props: { kicker: 'Bundle', text: 'What the build weighs.' } },
      { id: 'total', type: 'stat', props: { value: kb(total), label: 'total raw', caption: `${chunks.length} chunks` } },
      {
        id: 'chunks',
        type: 'list',
        props: { title: 'Heaviest chunks', items: top.map((c) => `${c.name} · ${kb(c.bytes)}`) },
      },
    ],
  })
}
