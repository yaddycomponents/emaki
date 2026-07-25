# Emaki

Films from a JSON file. A **local-first** CLI + studio for code-as-template motion decks — bring your own AI key, render on your own machine, keep the whole thing offline.

```bash
emaki init                                   # scaffold deck.json
emaki validate deck.json                     # schema errors, exit 1 on fail
emaki dur deck.json                          # per-scene + total duration
emaki schema --out deck.schema.json          # JSON Schema (wire Monaco to it)
# soon:
# emaki dev deck.json                        # HMR preview
# emaki studio [deck.json]                   # full UI
# emaki render deck.json --aspect 9:16 --out film.mp4
```

The CLI is the product; the studio is a window onto it. Every studio action maps
to a command against a file, so nothing is studio-only and everything is
scriptable and CI-able.

## Why local-first

- **Render needs real CPU.** Remotion runs on your Node process — no queue, no workers, no per-minute bill.
- **BYO key only means something locally.** The AI call originates on localhost; your key lives in `.env.local` and never ships to a browser.
- **Your decks hold real data.** Chunk names, customer numbers, unreleased framing. Local-first is the correct architecture, not a compromise.

## Repo layout

```
packages/
  schema/    zod deck definition, dur calculator, JSON Schema export   ← built first
  core/      tokens contract, motion presets, primitives, Stage        (Week 1–2)
  blocks/    the ~9 block types + per-aspect layouts + timelines        (Week 2)
  themes/    warm-editorial, saas-product                               (Week 3)
  render/    remotion host + record.mjs fallback                        (Week 2)
  extract/   rollup stats · lighthouse · git log → partial decks        (Week 5)
  studio/    the local UI (Vite + CSS Modules + Radix + Monaco)         (Week 4)
  cli/       emaki studio | render | init | validate
templates/   first-party packs
fixtures/    regression decks + frame-diff goldens
```

## Status — Week 1: schema first

Done: the deck schema (`@emaki/schema`), the duration calculator, JSON Schema
export, and `emaki validate | dur | schema | init`.

**Gate:** hand-write a `deck.json` and get a useful error when it's wrong.

```bash
pnpm install
pnpm build
pnpm --filter @emaki/cli dev validate ../../fixtures/hello.deck.json
```

## Develop

```bash
pnpm install
pnpm build         # turbo: schema → cli
pnpm test          # vitest
pnpm typecheck
```

Run the CLI from source (no build) with the `development` export condition:

```bash
pnpm --filter @emaki/cli dev validate fixtures/hello.deck.json
```
