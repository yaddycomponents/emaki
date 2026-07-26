import { extractRollup } from "@emaki/extract";
import {
  applyOps,
  Aspect,
  BOOTSTRAP_BLOCKS,
  type Deck,
  parseDeck,
  SceneOp,
} from "@emaki/schema";
import { THEMES } from "@emaki/themes";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as z from "zod";

const FIRST_PARTY_TEMPLATES = [
  "release-notes",
  "bundle-diff",
  "lighthouse-story",
  "changelog-scroll",
  "quote-card",
  "before-after",
];

function text(s: string, isError = false) {
  return {
    content: [{ type: "text" as const, text: s }],
    ...(isError ? { isError: true } : {}),
  };
}

function readDeck(
  deckPath: string,
): { ok: true; deck: Deck } | { ok: false; message: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(resolve(deckPath), "utf8"));
  } catch (e) {
    return {
      ok: false,
      message: `could not read ${deckPath}: ${(e as Error).message}`,
    };
  }
  const r = parseDeck(raw);
  return r.ok ? { ok: true, deck: r.deck } : { ok: false, message: r.message };
}

const CATALOGUE = BOOTSTRAP_BLOCKS.map((b) => `- ${b.type}`).join("\n");

/**
 * Build the Emaki MCP server. Every tool's schema comes from the same Zod defs
 * that validate the engine — no second source of truth. Emaki never calls a
 * model: the host does, and drives these tools.
 */
export function createServer(): McpServer {
  const server = new McpServer(
    { name: "emaki", version: "0.1.0" },
    {
      instructions:
        "Emaki turns a deck.json into short motion films. Propose edits as ops, then apply_ops writes them to disk; Studio hot-reloads. Never fabricate specific metrics — pass grounding (rollup/lighthouse/git) or use extract.",
    },
  );

  server.registerTool(
    "validate_deck",
    {
      description: "Validate a deck object against the Emaki schema.",
      inputSchema: { deck: z.unknown() },
    },
    async ({ deck }) => {
      const r = parseDeck(deck);
      return r.ok
        ? text(`✓ valid · ${r.deck.scenes.length} scenes · ${r.deck.aspect}`)
        : text(`✗ invalid:\n${r.message}`, true);
    },
  );

  server.registerTool(
    "list_blocks",
    {
      description: "List the block types available to compose scenes from.",
      inputSchema: {},
    },
    async () => text(`Available blocks:\n${CATALOGUE}`),
  );

  server.registerTool(
    "list_themes",
    { description: "List installed themes.", inputSchema: {} },
    async () =>
      text(
        Object.values(THEMES)
          .map((t) => `- ${t.id} (${t.name})`)
          .join("\n"),
      ),
  );

  server.registerTool(
    "list_templates",
    { description: "List first-party templates.", inputSchema: {} },
    async () => text(FIRST_PARTY_TEMPLATES.map((t) => `- ${t}`).join("\n")),
  );

  server.registerTool(
    "propose_scenes",
    {
      description:
        'Propose scene ops from an intent. Read-only — proposes only, never writes. Returns a "no matching block" note rather than forcing a bad fit, and refuses to fabricate specific metrics when no grounding is passed.',
      inputSchema: {
        intent: z.string(),
        grounding: z
          .unknown()
          .optional()
          .describe("e.g. a rollup stats object — supplies real numbers"),
      },
    },
    async ({ grounding }) => {
      if (grounding && typeof grounding === "object") {
        try {
          const deck = extractRollup(grounding);
          const ops = deck.scenes.map((s, i) => ({
            op: "insertAfter" as const,
            afterId: i === 0 ? null : deck.scenes[i - 1]!.id,
            scene: s,
          }));
          return text(
            JSON.stringify(
              {
                ops,
                rationale: "Sequenced from grounding data (real numbers only).",
              },
              null,
              2,
            ),
          );
        } catch (e) {
          return text(
            `No matching block for this grounding: ${(e as Error).message}`,
            true,
          );
        }
      }
      return text(
        `No grounding passed. I can sequence these blocks — ${BOOTSTRAP_BLOCKS.map((b) => b.type).join(", ")} — but I won't invent specific metrics. Pass rollup/lighthouse/git grounding, or give exact copy for each scene.`,
      );
    },
  );

  server.registerTool(
    "apply_ops",
    {
      description:
        "Apply scene ops to a deck file on disk and write it back. Studio hot-reloads.",
      inputSchema: { deckPath: z.string(), ops: z.array(SceneOp) },
    },
    async ({ deckPath, ops }) => {
      const read = readDeck(deckPath);
      if (!read.ok) return text(`✗ ${read.message}`, true);
      const result = applyOps(read.deck, ops);
      if (!result.ok)
        return text(
          `✗ ops would produce an invalid deck:\n${result.error}`,
          true,
        );
      writeFileSync(
        resolve(deckPath),
        JSON.stringify(result.deck, null, 2) + "\n",
      );
      const skip = result.skipped.length
        ? ` · skipped ${result.skipped.length} (${result.skipped.map((s) => s.reason).join("; ")})`
        : "";
      return text(`✓ applied ${result.applied} ops to ${deckPath}${skip}`);
    },
  );

  server.registerTool(
    "extract",
    {
      description:
        "Extract a partial deck from build output (rollup stats). Writes to `out` if given, else returns the deck.",
      inputSchema: {
        source: z.string(),
        type: z.enum(["rollup"]).default("rollup"),
        out: z.string().optional(),
      },
    },
    async ({ source, out }) => {
      let raw: unknown;
      try {
        raw = JSON.parse(readFileSync(resolve(source), "utf8"));
      } catch (e) {
        return text(
          `✗ could not read ${source}: ${(e as Error).message}`,
          true,
        );
      }
      let deck: Deck;
      try {
        deck = extractRollup(raw);
      } catch (e) {
        return text(`✗ ${(e as Error).message}`, true);
      }
      if (out) {
        writeFileSync(resolve(out), JSON.stringify(deck, null, 2) + "\n");
        return text(`✓ wrote ${deck.scenes.length}-scene deck → ${out}`);
      }
      return text(JSON.stringify(deck, null, 2));
    },
  );

  server.registerTool(
    "render",
    {
      description: "Render a deck file to an MP4 via Remotion (local).",
      inputSchema: {
        deckPath: z.string(),
        aspect: Aspect.optional(),
        out: z.string().default("film.mp4"),
      },
    },
    async ({ deckPath, aspect, out }) => {
      const { renderDeck } = await import("@emaki/render");
      try {
        const res = await renderDeck({
          deckPath: resolve(deckPath),
          out: resolve(out),
          aspect,
        });
        return text(
          `✓ ${res.out} · ${res.width}×${res.height} · ${res.durationInFrames}f @ ${res.fps}fps`,
        );
      } catch (e) {
        return text(`✗ render failed: ${(e as Error).message}`, true);
      }
    },
  );

  return server;
}

/** Connect the server over stdio — used by the bin and `emaki mcp serve`. */
export async function runStdio(): Promise<void> {
  const server = createServer();
  await server.connect(new StdioServerTransport());
}
