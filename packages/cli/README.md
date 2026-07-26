# @emaki/cli

The emaki command line — validate, inspect, and (soon) render decks.

Part of **[Emaki](https://github.com/yaddycomponents/emaki)** — local-first motion films from a `deck.json`. AI comes in through MCP; Emaki never calls a model or stores a key.

## Install

```bash
npm i @emaki/cli@beta
```

## Use it

```bash
npx @emaki/cli@beta validate deck.json
npx @emaki/cli@beta render deck.json --aspect 9:16 --out film.mp4
```

Add the MCP server to Claude so it can author decks for you:

```bash
claude mcp add emaki -- npx -y @emaki/cli@beta mcp serve
```

## License

MIT © Emaki
