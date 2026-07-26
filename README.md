# Emaki

**Films from a JSON file.** Emaki turns build output — bundle stats, git logs, plain numbers — into short motion-graphic films (the kind you'd post to socials). The film is a `deck.json` on disk; rendering is local; and AI comes in through **MCP** — so Emaki never calls a model or stores a key. Your AI app (Claude Code / Claude Desktop) drives the tools; Emaki just does the work.

> Status: **public beta** — install any package with the `@beta` tag. The engine, CLI, and MCP server are live on npm. The visual Studio is in progress.

---

## For designers — use it inside Claude (2 minutes)

You don't clone anything. Add Emaki's MCP server to Claude once:

```bash
claude mcp add emaki -- npx -y @emaki/cli@beta mcp serve
```

That's it. Now in Claude Code (or Claude Desktop) you can just ask, and it'll call Emaki's tools for you:

> **"Use emaki: extract my rollup stats at `dist/stats.json`, propose a bundle-diff film, apply it to `deck.json`, then render it 9:16."**

Claude will:
1. `extract` your stats into a starting deck,
2. `propose_scenes` (you approve the edits — right in Claude's tool UI),
3. `apply_ops` to write `deck.json`,
4. `render` it to an MP4.

**Nothing leaves your machine.** No key to paste, no account, no upload.

### What Emaki can do (the MCP tools)

| Tool | What it does |
|---|---|
| `extract` | rollup/vite bundle stats → a starting deck (real numbers only) |
| `propose_scenes` | suggests scene edits (won't invent metrics without real data) |
| `apply_ops` | writes the approved edits to `deck.json` |
| `validate_deck` | checks a deck is well-formed |
| `render` | renders the deck to an MP4 (local, via Remotion) |
| `list_blocks` / `list_themes` / `list_templates` | what's available to build with |

### The blocks you're composing with
`title` · `statement` · `stat` · `compare-bars` · `chapter` · `list` · `ui-mock` — each adapts across **16:9 / 1:1 / 9:16**. Two themes ship: **warm-editorial** and **saas-product**.

> First `render` downloads a small headless Chrome (one time). The editing tools (`extract`/`propose`/`apply`/`validate`) need nothing extra.

---

## For developers — the CLI

```bash
npm i -g @emaki/cli@beta        # or: npx @emaki/cli@beta <command>

emaki init                       # scaffold a deck.json
emaki validate deck.json         # schema errors, exit 1 on fail
emaki dur deck.json              # per-scene + total duration
emaki extract rollup dist/stats.json --out deck.json
emaki render deck.json --aspect 9:16 --out film.mp4
emaki schema --out deck.schema.json   # JSON Schema (wire Monaco/editors to it)
emaki mcp serve                  # start the MCP server (what `claude mcp add` runs)
```

A deck is just data:

```json
{
  "version": 1,
  "aspect": "9:16",
  "theme": "saas-product",
  "scenes": [
    { "id": "open",  "type": "title",  "props": { "kicker": "Bundle", "text": "We cut it in half." } },
    { "id": "bars",  "type": "compare-bars", "props": { "title": "Raw size", "unit": "kB",
      "rows": [{ "label": "raw", "before": 247, "after": 114 }] } },
    { "id": "proof", "type": "stat",   "props": { "value": "−54%", "label": "gzipped" } }
  ]
}
```

Hand-edit it, `emaki render`, post the MP4.

---

## Why local-first + MCP

- **Render needs real CPU.** It runs on your machine — no queue, no per-minute bill.
- **Your decks hold real data** (chunk names, customer numbers). Local-first is the correct architecture, not a compromise.
- **BYO AI is literal.** You connect Emaki to the AI app you already pay for; there's no key to store and nothing to leave your machine.

## Packages
`@emaki/schema` · `core` · `blocks` · `themes` · `render` · `extract` · `mcp` · `cli` — all on npm under the `beta` tag.

## License
MIT
