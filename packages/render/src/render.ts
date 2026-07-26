import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundle } from '@remotion/bundler'
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer'
import { parseDeck, type Aspect, type Deck } from '@emaki/schema'
import { assertThemeValid, type Theme } from '@emaki/themes'

/**
 * Load imported themes from a `themes/` folder beside the deck (each a
 * `*.theme.json` validated against the contract). These render even though they
 * aren't compiled into @emaki/themes — the map travels with the deck.
 */
function loadThemesDir(deckPath: string): Record<string, Theme> {
  const dir = join(dirname(resolve(deckPath)), 'themes')
  if (!existsSync(dir)) return {}
  const themes: Record<string, Theme> = {}
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue
    try {
      const theme = JSON.parse(readFileSync(join(dir, file), 'utf8')) as Theme
      assertThemeValid(theme)
      themes[theme.id] = theme
    } catch {
      // A malformed theme file is skipped, not fatal — the deck may not use it.
    }
  }
  return themes
}

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

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

/**
 * Inline local `image` node sources as data URIs, resolved relative to the deck.
 * The Remotion bundle has no `public/` dir, so a bare file path wouldn't load;
 * data: and http(s): sources pass through untouched. A missing file is left as-is
 * (renders blank) with a warning, never fatal.
 */
function inlineImages(deck: Deck, baseDir: string): Deck {
  const clone = JSON.parse(JSON.stringify(deck)) as Deck
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) {
      v.forEach(walk)
    } else if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      if (o.kind === 'image' && typeof o.src === 'string' && !/^(data:|https?:)/.test(o.src)) {
        const file = resolve(baseDir, o.src)
        if (existsSync(file)) {
          const ext = file.slice(file.lastIndexOf('.')).toLowerCase()
          const b64 = readFileSync(file).toString('base64')
          o.src = `data:${MIME[ext] ?? 'image/png'};base64,${b64}`
        } else {
          process.stderr.write(`⚠ image not found, left blank: ${o.src}\n`)
        }
      }
      Object.values(o).forEach(walk)
    }
  }
  walk(clone.scenes)
  return clone
}

/** Read + validate a deck file, applying an optional aspect override. */
function loadDeck(deckPath: string, aspect?: Aspect): Deck {
  const raw = JSON.parse(readFileSync(resolve(deckPath), 'utf8')) as Record<string, unknown>
  if (aspect) raw.aspect = aspect
  const parsed = parseDeck(raw)
  if (!parsed.ok) throw new Error(`Invalid deck:\n${parsed.message}`)
  return inlineImages(parsed.deck, dirname(resolve(deckPath)))
}

/** Bundle once and select the deck composition for a given deck. */
async function prepare(deck: Deck, themes: Record<string, Theme>) {
  const serveUrl = await bundle({ entryPoint: resolveEntry() })
  const inputProps = { deck, themes }
  const composition = await selectComposition({ serveUrl, id: 'deck', inputProps })
  return { serveUrl, inputProps, composition }
}

/** Render a deck to an MP4 via Remotion. Validates the deck first. */
export async function renderDeck(options: RenderOptions): Promise<RenderResult> {
  const deck = loadDeck(options.deckPath, options.aspect)
  const { serveUrl, inputProps, composition } = await prepare(deck, loadThemesDir(options.deckPath))

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
  const { serveUrl, inputProps, composition } = await prepare(deck, loadThemesDir(options.deckPath))
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
  const { serveUrl, inputProps, composition } = await prepare(deck, loadThemesDir(options.deckPath))
  for (const shot of options.shots) {
    const frame = Math.max(0, Math.min(shot.frame, composition.durationInFrames - 1))
    await renderStill({ composition, serveUrl, output: resolve(shot.out), frame, inputProps })
  }
  return { width: composition.width, height: composition.height, durationInFrames: composition.durationInFrames }
}
