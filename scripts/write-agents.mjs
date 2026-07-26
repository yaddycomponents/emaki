// Regenerate AGENTS.md from the canonical guide in @emaki/mcp.
//   pnpm agents
import { writeFileSync } from 'node:fs'
import { AGENT_GUIDE } from '../packages/mcp/src/guide.ts'

writeFileSync(new URL('../AGENTS.md', import.meta.url), AGENT_GUIDE)
process.stdout.write('✓ wrote AGENTS.md from @emaki/mcp guide\n')
