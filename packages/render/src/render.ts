import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { parseDeck, type Aspect } from '@emaki/schema'

export interface RenderOptions {
  deckPath: string
  out: string
  aspect?: Aspect
  onProgress?: (progress: number) => void
}

export interface RenderResult {
  out: string
  durationInFrames: number
  width: number
  height: number
  fps: number
}

/** Resolve the Remotion entry — source when run from the workspace, built otherwise. */
function resolveEntry(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [join(here, 'entry.tsx'), join(here, 'entry.js'), join(here, '..', 'src', 'entry.tsx')]
  const found = candidates.find((p) => existsSync(p))
  if (!found) throw new Error('Could not locate the Remotion entry (entry.tsx).')
  return found
}

/** Render a deck to an MP4 via Remotion. Validates the deck first. */
export async function renderDeck(options: RenderOptions): Promise<RenderResult> {
  const raw = JSON.parse(readFileSync(resolve(options.deckPath), 'utf8')) as Record<string, unknown>
  if (options.aspect) raw.aspect = options.aspect

  const parsed = parseDeck(raw)
  if (!parsed.ok) throw new Error(`Invalid deck:\n${parsed.message}`)
  const deck = parsed.deck

  const serveUrl = await bundle({ entryPoint: resolveEntry() })
  const inputProps = { deck }

  const composition = await selectComposition({ serveUrl, id: 'deck', inputProps })

  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: resolve(options.out),
    inputProps,
    onProgress: options.onProgress ? ({ progress }) => options.onProgress!(progress) : undefined,
  })

  return {
    out: resolve(options.out),
    durationInFrames: composition.durationInFrames,
    width: composition.width,
    height: composition.height,
    fps: composition.fps,
  }
}
