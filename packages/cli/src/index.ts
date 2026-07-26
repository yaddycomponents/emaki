#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { parseDeck, deckDuration, deckJsonSchema } from '@emaki/schema'

const VERSION = '0.1.0'

const HELP = `emaki v${VERSION} — films from a JSON file

Usage
  emaki validate <deck.json> [--json]     validate a deck; exit 1 on error
  emaki dur <deck.json> [--json]          print per-scene and total duration
  emaki schema [--out <file>]             print the deck JSON Schema (wire Monaco to it)
  emaki init [--out <file>] [--force]     scaffold a starter deck.json
  emaki render <deck.json> [--aspect <16:9|1:1|9:16>] [--out <file.mp4>]
  emaki extract [rollup|handover] <file.json> [--out <deck.json>] [--aspect] [--theme]
  emaki mcp serve                         start the MCP server (add to Claude Code)

Every command accepts --json for machine-readable output.
`

const STARTER_DECK = {
  version: 1,
  title: 'Untitled',
  aspect: '9:16',
  theme: 'warm-editorial',
  scenes: [
    { id: 'open', type: 'title', props: { kicker: 'Emaki', text: 'Your headline here.' } },
    { id: 'point', type: 'statement', props: { text: 'One load-bearing sentence.' } },
    { id: 'proof', type: 'stat', props: { value: '100%', label: 'what you measured' } },
  ],
}

function fail(message: string): never {
  process.stderr.write(message.endsWith('\n') ? message : message + '\n')
  process.exit(1)
}

function readDeckFile(path: string): unknown {
  const abs = resolve(process.cwd(), path)
  if (!existsSync(abs)) fail(`✗ file not found: ${path}`)
  let raw: string
  try {
    raw = readFileSync(abs, 'utf8')
  } catch (e) {
    return fail(`✗ could not read ${path}: ${(e as Error).message}`)
  }
  try {
    return JSON.parse(raw)
  } catch (e) {
    return fail(`✗ ${path} is not valid JSON: ${(e as Error).message}`)
  }
}

function cmdValidate(args: string[]): void {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: { json: { type: 'boolean', default: false } },
  })
  const file = positionals[0]
  if (!file) fail('✗ usage: emaki validate <deck.json> [--json]')

  const result = parseDeck(readDeckFile(file))

  if (!result.ok) {
    if (values.json) {
      process.stdout.write(JSON.stringify({ ok: false, issues: result.issues }, null, 2) + '\n')
    } else {
      process.stderr.write(`✗ ${file} is not a valid deck\n\n${result.message}\n`)
    }
    process.exit(1)
  }

  const { deck } = result
  const timing = deckDuration(deck)
  if (values.json) {
    process.stdout.write(
      JSON.stringify({ ok: true, aspect: deck.aspect, scenes: deck.scenes.length, duration: timing.total }, null, 2) + '\n',
    )
  } else {
    process.stdout.write(
      `✓ ${file} is valid · ${deck.scenes.length} scenes · ${deck.aspect} · ${timing.total}s\n`,
    )
  }
}

function cmdDur(args: string[]): void {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: { json: { type: 'boolean', default: false } },
  })
  const file = positionals[0]
  if (!file) fail('✗ usage: emaki dur <deck.json> [--json]')

  const result = parseDeck(readDeckFile(file))
  if (!result.ok) fail(`✗ ${file} is not a valid deck\n\n${result.message}`)

  const timing = deckDuration(result.deck)
  if (values.json) {
    process.stdout.write(JSON.stringify(timing, null, 2) + '\n')
  } else {
    for (const s of timing.scenes) {
      process.stdout.write(`  ${s.dur.toFixed(2)}s  ${s.type.padEnd(10)} ${s.id}\n`)
    }
    process.stdout.write(`  ─────\n  ${timing.total.toFixed(2)}s  total\n`)
  }
}

function cmdSchema(args: string[]): void {
  const { values } = parseArgs({
    args,
    allowPositionals: true,
    options: { out: { type: 'string' }, json: { type: 'boolean', default: false } },
  })
  const json = JSON.stringify(deckJsonSchema(), null, 2)
  if (values.out) {
    writeFileSync(resolve(process.cwd(), values.out), json + '\n')
    process.stdout.write(`✓ wrote deck JSON Schema → ${values.out}\n`)
  } else {
    process.stdout.write(json + '\n')
  }
}

function cmdInit(args: string[]): void {
  const { values } = parseArgs({
    args,
    allowPositionals: true,
    options: { out: { type: 'string', default: 'deck.json' }, force: { type: 'boolean', default: false } },
  })
  const out = values.out ?? 'deck.json'
  const abs = resolve(process.cwd(), out)
  if (existsSync(abs) && !values.force) fail(`✗ ${out} already exists (use --force to overwrite)`)
  writeFileSync(abs, JSON.stringify(STARTER_DECK, null, 2) + '\n')
  process.stdout.write(`✓ scaffolded ${out}\n  next: emaki validate ${out}\n`)
}

async function cmdRender(args: string[]): Promise<void> {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: { aspect: { type: 'string' }, out: { type: 'string', default: 'film.mp4' } },
  })
  const file = positionals[0]
  if (!file) fail('✗ usage: emaki render <deck.json> [--aspect 9:16] [--out film.mp4]')
  const out = values.out ?? 'film.mp4'
  const aspect = values.aspect as '16:9' | '1:1' | '9:16' | undefined
  if (aspect && !['16:9', '1:1', '9:16'].includes(aspect)) fail(`✗ unknown aspect: ${aspect}`)

  // Surface the command being run (studio/CLI parity), then render.
  process.stdout.write(`▸ emaki render ${file}${aspect ? ` --aspect ${aspect}` : ''} --out ${out}\n`)
  const { renderDeck } = await import('@emaki/render')

  let lastPct = -1
  const result = await renderDeck({
    deckPath: resolve(process.cwd(), file),
    out: resolve(process.cwd(), out),
    aspect,
    onProgress: (p) => {
      const pct = Math.round(p * 100)
      if (pct !== lastPct) {
        lastPct = pct
        process.stderr.write(`\r  rendering ${pct}%`)
      }
    },
  })
  process.stderr.write('\r')
  process.stdout.write(
    `✓ ${out} · ${result.width}×${result.height} · ${result.durationInFrames} frames @ ${result.fps}fps\n`,
  )
}

async function cmdExtract(args: string[]): Promise<void> {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      out: { type: 'string' },
      type: { type: 'string', default: 'rollup' },
      aspect: { type: 'string' },
      theme: { type: 'string' },
    },
  })
  // support `emaki extract [rollup|handover] <file>` and `emaki extract <file>`
  const kinds = new Set(['rollup', 'handover'])
  const kind = kinds.has(positionals[0] ?? '') ? positionals[0]! : (values.type as string)
  const source = kinds.has(positionals[0] ?? '') ? positionals[1] : positionals[0]
  if (!source) fail('✗ usage: emaki extract [rollup|handover] <file> [--out deck.json]')

  const { extractRollup, extractHandover } = await import('@emaki/extract')
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(resolve(process.cwd(), source), 'utf8'))
  } catch (e) {
    return fail(`✗ could not read ${source}: ${(e as Error).message}`)
  }
  const aspect = values.aspect as '16:9' | '1:1' | '9:16' | undefined
  let deck
  try {
    if (kind === 'handover') {
      const r = extractHandover(raw, { aspect, theme: values.theme })
      if (!r.ok) {
        const detail = r.issues.length
          ? r.issues.map((i) => `  · scene ${i.scene}${i.type ? ` (${i.type})` : ''}: ${i.message.split('\n')[0]}`).join('\n')
          : r.message
        return fail(`✗ handover did not validate:\n${detail}`)
      }
      deck = r.deck
    } else {
      deck = extractRollup(raw, { aspect, theme: values.theme })
    }
  } catch (e) {
    return fail(`✗ ${(e as Error).message}`)
  }
  const json = JSON.stringify(deck, null, 2)
  if (values.out) {
    writeFileSync(resolve(process.cwd(), values.out), json + '\n')
    process.stdout.write(`✓ ${deck.scenes.length}-scene deck → ${values.out}\n`)
  } else {
    process.stdout.write(json + '\n')
  }
}

async function cmdMcp(args: string[]): Promise<void> {
  if (args[0] !== 'serve') fail('✗ usage: emaki mcp serve')
  // stdout is the MCP protocol channel from here — print nothing else.
  const { runStdio } = await import('@emaki/mcp')
  await runStdio()
}

function main(argv: string[]): void {
  const [cmd, ...rest] = argv
  switch (cmd) {
    case 'validate':
      return cmdValidate(rest)
    case 'dur':
      return cmdDur(rest)
    case 'schema':
      return cmdSchema(rest)
    case 'init':
      return cmdInit(rest)
    case 'render':
      cmdRender(rest).catch((e: unknown) => fail(`✗ render failed: ${(e as Error).message}`))
      return
    case 'extract':
      cmdExtract(rest).catch((e: unknown) => fail(`✗ extract failed: ${(e as Error).message}`))
      return
    case 'mcp':
      cmdMcp(rest).catch((e: unknown) => fail(`✗ mcp failed: ${(e as Error).message}`))
      return
    case '-v':
    case '--version':
      process.stdout.write(VERSION + '\n')
      return
    case undefined:
    case '-h':
    case '--help':
      process.stdout.write(HELP)
      return
    default:
      fail(`✗ unknown command: ${cmd}\n\n${HELP}`)
  }
}

main(process.argv.slice(2))
