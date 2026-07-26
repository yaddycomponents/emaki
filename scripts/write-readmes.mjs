// Generate a README.md for each public @emaki/* package from its package.json.
//   pnpm readmes
// npm always packs README.md, so these surface on the next publish.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const PKGS = 'packages'
const REPO = 'https://github.com/yaddycomponents/emaki'

// A one-line "what it's for" beyond the package.json description, where useful.
const EXTRA = {
  '@emaki/cli': `## Use it

\`\`\`bash
npx @emaki/cli@beta validate deck.json
npx @emaki/cli@beta render deck.json --aspect 9:16 --out film.mp4
\`\`\`

Add the MCP server to Claude so it can author decks for you:

\`\`\`bash
claude mcp add emaki -- npx -y @emaki/cli@beta mcp serve
\`\`\``,
  '@emaki/mcp': `## Use it

The Emaki MCP server lets an AI host (Claude Code / Claude Desktop) drive Emaki
without ever calling a model itself. Add it via the CLI:

\`\`\`bash
claude mcp add emaki -- npx -y @emaki/cli@beta mcp serve
\`\`\`

Tools: \`build_deck\`, \`validate_deck\`, \`apply_ops\`, \`extract\`, \`render\`,
\`theme_import\`, \`describe_block\`, \`describe_ui_nodes\`, \`list_*\`. Read the
\`emaki://guide\` resource first.`,
}

function readme(pkg) {
  const install = `## Install

\`\`\`bash
npm i ${pkg.name}@beta
\`\`\``
  const extra = EXTRA[pkg.name] ? `\n\n${EXTRA[pkg.name]}` : ''
  return `# ${pkg.name}

${pkg.description ?? ''}

Part of **[Emaki](${REPO})** — local-first motion films from a \`deck.json\`. AI comes in through MCP; Emaki never calls a model or stores a key.

${install}${extra}

## License

MIT © Emaki
`
}

let count = 0
for (const dir of readdirSync(PKGS)) {
  const pkgPath = `${PKGS}/${dir}/package.json`
  let pkg
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  } catch {
    continue
  }
  if (pkg.private) continue
  writeFileSync(`${PKGS}/${dir}/README.md`, readme(pkg))
  count++
}
process.stdout.write(`✓ wrote ${count} package READMEs\n`)
