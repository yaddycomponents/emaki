// Frame-diff "taste suite". Renders one still per block (sampled at each scene's
// midpoint) for two showcase decks — warm-editorial @16:9 and saas-product @9:16
// — covering every block × both themes × both aspects.
//
//   node scripts/goldens.mjs generate   # write fixtures/goldens/*.png
//   node scripts/goldens.mjs check      # re-render and pixel-diff vs goldens
//
// `check` exits 1 on any mismatch above threshold — wire it into CI so a layout
// regression in a shared primitive shows up as a failing image, not a surprise.
import { readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { parseDeck } from '@emaki/schema'
import { renderDeckStills, sceneFrameList, FPS } from '@emaki/render'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const MODE = process.argv[2] ?? 'generate'
const GOLD_DIR = 'fixtures/goldens'
const TMP_DIR = '.goldens-tmp'
const MISMATCH_RATIO = 0.002 // 0.2% of pixels may differ (font hinting jitter)

const DECKS = [
  { path: 'fixtures/showcase-warm.deck.json', tag: 'warm' },
  { path: 'fixtures/showcase-saas.deck.json', tag: 'saas' },
]

function shotsFor(deckPath, outDir, tag) {
  const parsed = parseDeck(JSON.parse(readFileSync(resolve(deckPath), 'utf8')))
  if (!parsed.ok) throw new Error(`${deckPath} invalid:\n${parsed.message}`)
  const frames = sceneFrameList(parsed.deck, FPS)
  let start = 0
  return parsed.deck.scenes.map((scene, i) => {
    const mid = start + Math.floor(frames[i] / 2)
    start += frames[i]
    return { frame: mid, out: join(outDir, `${tag}-${scene.id}.png`), name: `${tag}-${scene.id}` }
  })
}

function readPng(path) {
  return PNG.sync.read(readFileSync(path))
}

async function generate() {
  mkdirSync(GOLD_DIR, { recursive: true })
  for (const deck of DECKS) {
    const shots = shotsFor(deck.path, GOLD_DIR, deck.tag)
    process.stdout.write(`▸ ${deck.tag}: ${shots.length} goldens…\n`)
    await renderDeckStills({ deckPath: deck.path, shots })
  }
  process.stdout.write(`✓ wrote goldens → ${GOLD_DIR}\n`)
}

async function check() {
  rmSync(TMP_DIR, { recursive: true, force: true })
  mkdirSync(TMP_DIR, { recursive: true })
  const failures = []
  for (const deck of DECKS) {
    const shots = shotsFor(deck.path, TMP_DIR, deck.tag)
    await renderDeckStills({ deckPath: deck.path, shots })
    for (const shot of shots) {
      const goldPath = join(GOLD_DIR, `${shot.name}.png`)
      if (!existsSync(goldPath)) {
        failures.push(`${shot.name}: no golden (run: node scripts/goldens.mjs generate)`)
        continue
      }
      const gold = readPng(goldPath)
      const cur = readPng(shot.out)
      if (gold.width !== cur.width || gold.height !== cur.height) {
        failures.push(`${shot.name}: size ${cur.width}×${cur.height} ≠ golden ${gold.width}×${gold.height}`)
        continue
      }
      const diff = new PNG({ width: gold.width, height: gold.height })
      const changed = pixelmatch(gold.data, cur.data, diff.data, gold.width, gold.height, { threshold: 0.1 })
      const ratio = changed / (gold.width * gold.height)
      const status = ratio <= MISMATCH_RATIO ? '✓' : '✗'
      process.stdout.write(`  ${status} ${shot.name} — ${(ratio * 100).toFixed(3)}% changed\n`)
      if (ratio > MISMATCH_RATIO) failures.push(`${shot.name}: ${(ratio * 100).toFixed(3)}% changed`)
    }
  }
  rmSync(TMP_DIR, { recursive: true, force: true })
  if (failures.length) {
    process.stderr.write(`\n✗ frame-diff failures:\n${failures.map((f) => `  - ${f}`).join('\n')}\n`)
    process.exit(1)
  }
  process.stdout.write(`✓ all goldens match\n`)
}

await (MODE === 'check' ? check() : generate())
