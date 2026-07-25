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
