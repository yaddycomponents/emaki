import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundle } from '@remotion/bundler'
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer'
import { parseDeck, type Aspect, type Deck } from '@emaki/schema'

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

/** Read + validate a deck file, applying an optional aspect override. */
function loadDeck(deckPath: string, aspect?: Aspect): Deck {
  const raw = JSON.parse(readFileSync(resolve(deckPath), 'utf8')) as Record<string, unknown>
  if (aspect) raw.aspect = aspect
  const parsed = parseDeck(raw)
  if (!parsed.ok) throw new Error(`Invalid deck:\n${parsed.message}`)
  return parsed.deck
}

/** Bundle once and select the deck composition for a given deck. */
async function prepare(deck: Deck) {
  const serveUrl = await bundle({ entryPoint: resolveEntry() })
  const inputProps = { deck }
  const composition = await selectComposition({ serveUrl, id: 'deck', inputProps })
  return { serveUrl, inputProps, composition }
}

/** Render a deck to an MP4 via Remotion. Validates the deck first. */
export async function renderDeck(options: RenderOptions): Promise<RenderResult> {
  const deck = loadDeck(options.deckPath, options.aspect)
  const { serveUrl, inputProps, composition } = await prepare(deck)

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

export interface StillOptions {
  deckPath: string
  out: string
  frame: number
  aspect?: Aspect
}

/** Render a single frame of a deck to a PNG — the unit of the frame-diff suite. */
export async function renderDeckStill(options: StillOptions): Promise<{ out: string; width: number; height: number }> {
  const deck = loadDeck(options.deckPath, options.aspect)
  const { serveUrl, inputProps, composition } = await prepare(deck)
  const frame = Math.max(0, Math.min(options.frame, composition.durationInFrames - 1))

  await renderStill({ composition, serveUrl, output: resolve(options.out), frame, inputProps })

  return { out: resolve(options.out), width: composition.width, height: composition.height }
}

export interface StillShot {
  frame: number
  out: string
}

/** Bundle a deck once and render many frames — used by the frame-diff suite. */
export async function renderDeckStills(options: {
  deckPath: string
  aspect?: Aspect
  shots: StillShot[]
}): Promise<{ width: number; height: number; durationInFrames: number }> {
  const deck = loadDeck(options.deckPath, options.aspect)
  const { serveUrl, inputProps, composition } = await prepare(deck)
  for (const shot of options.shots) {
    const frame = Math.max(0, Math.min(shot.frame, composition.durationInFrames - 1))
    await renderStill({ composition, serveUrl, output: resolve(shot.out), frame, inputProps })
  }
  return { width: composition.width, height: composition.height, durationInFrames: composition.durationInFrames }
}
