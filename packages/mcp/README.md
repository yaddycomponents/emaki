# @emaki/mcp

The Emaki MCP server — validate/propose/apply/render/extract tools, schemas from the same Zod defs.

Part of **[Emaki](https://github.com/yaddycomponents/emaki)** — local-first motion films from a `deck.json`. AI comes in through MCP; Emaki never calls a model or stores a key.

## Install

```bash
npm i @emaki/mcp@beta
```

## Use it

The Emaki MCP server lets an AI host (Claude Code / Claude Desktop) drive Emaki
without ever calling a model itself. Add it via the CLI:

```bash
claude mcp add emaki -- npx -y @emaki/cli@beta mcp serve
```

Tools: `build_deck`, `validate_deck`, `apply_ops`, `extract`, `render`,
`theme_import`, `describe_block`, `describe_ui_nodes`, `list_*`. Read the
`emaki://guide` resource first.

## License

MIT © Emaki
