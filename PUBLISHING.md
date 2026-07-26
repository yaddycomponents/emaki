# Publishing the beta

8 packages publish (`@emaki/studio` stays private). Versions are `0.1.0-beta.0`,
dist-tag `beta`.

## One-time
1. Create a free **`emaki` org** on npmjs.com (Settings → add org → free/public),
   or use an org you own and rename the scope.
2. `npm login`  (must be a member/owner of the `emaki` org)

## Publish (from repo root)
```bash
pnpm install && pnpm build
pnpm -r publish --access public --tag beta --no-git-checks
```
pnpm publishes in dependency order and rewrites `workspace:*` → `0.1.0-beta.0`.

## Your designer then runs
```bash
# add the MCP server to Claude Code / Desktop
claude mcp add emaki -- npx -y @emaki/cli@beta mcp serve
```
Or install the CLI: `npm i -g @emaki/cli@beta` then `emaki mcp serve`.

## Tools the MCP exposes
validate_deck · list_blocks/themes/templates · propose_scenes · apply_ops
(writes deck.json) · extract (rollup stats → deck) · render (needs local Chrome,
downloaded on first run).
