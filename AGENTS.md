# Emaki — agent guide

Emaki turns a `deck.json` into a short motion film (9:16, 1:1, or 16:9). You (the
host model) do the thinking; Emaki's tools are deterministic and never call a
model. Your job: understand the source, describe it as a deck, then let Emaki
validate and render it.

## Golden rules
1. **Never fabricate specific metrics.** A number, percentage, or size must come
   from grounding (a rollup/lighthouse/git file) or the user's own words. No
   grounding → use words, not invented figures. `extract` and `propose_scenes`
   enforce this; don't route around them.
2. **Match the schema, don't fight it.** Call `describe_block` before guessing
   props. Call `build_deck`/`validate_deck` and fix exactly what they report.
3. **One idea per scene.** Short films: ~5–9 scenes, each with one load-bearing
   point. Reading time drives duration — keep copy tight.
4. **A ui-scene is a CONSTRAINED mock, not a website.** Flex only (row/col/split);
   no grid, absolute, or responsive layout. Abstract with shimmer bars; use real
   text only where it carries meaning.

## The loop
1. **Draft** — turn a source into a deck.
   - Build output (rollup/vite stats file) → `extract { type:"rollup" }`.
   - A PDF, screenshot, or chat handover → YOU read it and emit a *handover*,
     then call `build_deck`. A handover is lenient: no `id`, no `version`,
     props inline. Emaki assigns ids, fills defaults, and validates per-scene.
2. **Validate** — `build_deck` already validates; `validate_deck` re-checks any
   hand-edited deck object.
3. **Apply** — `apply_ops` writes ops to the deck file on disk; Studio hot-reloads.
4. **Render** — `render` produces a local Remotion MP4.

## Blocks
`list_blocks` for the set with prop names; `describe_block <type>` for exact
props and descriptions. The set: title, statement, stat, compare-bars, chapter,
list, ui-mock, ui-scene.

## ui-scene: UI as data
A `ui-scene` scene's `root` prop is a node tree. `describe_ui_nodes` returns the
live vocabulary. In brief:
- **Containers** (have `children`): `row`, `col`, `split` (two panes side by side),
  `panel`, `card`. Optional: `w` (px number or "52%"), `gap`, `pad`, `stagger`.
- **Leaves**: `bar` (a shimmer bar; add `text` and it becomes real text once
  loaded), `text`, `badge`, `dot`, `icon`, `toggle`, `count`, `divider`,
  `field`, `listRow`.
- **states**: `[{ id, hold }]`, e.g. skeleton → loaded. A node with
  `in: ["loaded"]` only appears in those states.
- **Timing is derived** from the tree — never set per-node delays.

### Example — a screenshot of an inbox becomes a ui-scene
```json
{ "type": "ui-scene", "caption": "One reply, sent & logged",
  "states": [{ "id": "skeleton", "hold": 1 }, { "id": "loaded", "hold": 2.5 }],
  "root": { "kind": "split", "children": [
    { "kind": "col", "w": 300, "children": [
      { "kind": "listRow", "title": "52%", "sub": "80%", "active": true },
      { "kind": "listRow", "title": "46%", "sub": "72%", "badge": "AI Replied" } ] },
    { "kind": "col", "children": [
      { "kind": "bar", "w": "52%", "h": 14, "text": "Acme Corp · Invoice #4021" },
      { "kind": "card", "in": ["loaded"], "children": [
        { "kind": "text", "value": "Activity created · PTP001", "tone": "primary" } ] } ] } ] } }
```

## Themes
`list_themes` for installed themes; set a deck-wide `theme` id. One accent per
theme. Don't hardcode colours in nodes; tones (`primary`, `muted`, `good`,
`danger`) resolve against the theme.

**Bring your own brand** — `theme_import`. YOU extract the brand from a logo,
screenshot, or brand guide (a name and one accent colour, optionally bg/text/
fonts); Emaki derives the rest into a valid theme. Write it to
`themes/<id>.theme.json` beside the deck and set the deck's `theme` to that id —
render and preview pick it up from that folder. Invent nothing: pull the accent
from the actual brand, don't guess it.
