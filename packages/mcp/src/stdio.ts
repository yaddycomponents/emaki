#!/usr/bin/env node
import { runStdio } from './server'

// Entry point spawned by an MCP host (Claude Code / Desktop) or `emaki mcp serve`.
runStdio().catch((err) => {
  process.stderr.write(`emaki mcp failed: ${(err as Error).message}\n`)
  process.exit(1)
})
