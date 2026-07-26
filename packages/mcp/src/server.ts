import { extractHandover, extractRollup } from "@emaki/extract";
import {
  applyOps,
  Aspect,
  type BlockDef,
  BOOTSTRAP_BLOCKS,
  createRegistry,
  type Deck,
  deckJsonSchema,
  glyphWarning,
  parseDeck,
  SceneOp,
} from "@emaki/schema";
import { type BrandInput, buildTheme, THEMES } from "@emaki/themes";
import { CONTAINER_KINDS, ICON_NAMES, LEAF_KINDS } from "@emaki/ui";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as z from "zod";
import { AGENT_GUIDE } from "./guide";

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

/**
 * Several MCP clients serialize free-form object/array params to a JSON string.
 * Accept both: parse a string that looks like JSON, otherwise pass through.
 */
function coerceJson(x: unknown): unknown {
  if (typeof x !== "string") return x;
  const s = x.trim();
  if (!s || !/^[[{]/.test(s)) return x;
  try {
    return JSON.parse(s);
  } catch {
    return x;
  }
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

const REGISTRY = createRegistry(BOOTSTRAP_BLOCKS);

/** Prop names of a block, from the same Zod def that validates it. */
function propNames(block: BlockDef): string[] {
  const js = z.toJSONSchema(block.props, { target: "draft-7" }) as {
    properties?: Record<string, unknown>;
  };
  return Object.keys(js.properties ?? {});
}

const CATALOGUE = BOOTSTRAP_BLOCKS.map(
  (b) => `- ${b.type} — props: ${propNames(b).join(", ") || "(none)"}`,
).join("\n");

/** A readable prop reference for one block: name (type) [required] — description. */
function blockReference(type: string): string | null {
  const block = REGISTRY[type];
  if (!block) return null;
  const js = z.toJSONSchema(block.props, { target: "draft-7" }) as {
    properties?: Record<string, { type?: string; description?: string }>;
    required?: string[];
  };
  const required = new Set(js.required ?? []);
  const lines = Object.entries(js.properties ?? {}).map(([name, def]) => {
    const req = required.has(name) ? " [required]" : "";
    const t = def.type ? ` (${def.type})` : "";
    const desc = def.description ? ` — ${def.description}` : "";
    return `- ${name}${t}${req}${desc}`;
  });
  const tail =
    type === "ui-scene"
      ? "\n\n`root` is a node tree — call describe_ui_nodes for the vocabulary."
      : "";
  return `Block "${type}"\n${lines.join("\n")}${tail}`;
}

const UI_NODE_DOCS: Record<string, string> = {
  row: "horizontal flex container",
  col: "vertical flex container",
  split: "two panes side by side",
  panel: "boxed vertical container (surface, border)",
  card: "boxed container with padding + shadow",
  bar: "shimmer bar; add `text` to become real text once loaded (w, h, lite)",
  text: "real text (value, tone, size, weight, mono)",
  badge: "pill label (label, tone)",
  dot: "avatar circle (size, initials)",
  icon: "small icon from the allowlist (name, tone)",
  toggle: "switch (on)",
  count: "number, optionally counted up (to, prefix, suffix)",
  divider: "hairline rule",
  image: "a real logo/screenshot (src: local path, data: URI, or https; w, h, fit, radius)",
  field: "label + value pair",
  listRow:
    "avatar + title/sub rows + optional badge (title, sub, badge, active)",
};

function uiNodeReference(): string {
  const containers = CONTAINER_KINDS.map(
    (k) => `- ${k} — ${UI_NODE_DOCS[k] ?? "container"}`,
  ).join("\n");
  const leaves = LEAF_KINDS.map(
    (k) => `- ${k} — ${UI_NODE_DOCS[k] ?? "leaf"}`,
  ).join("\n");
  return [
    "A ui-scene `root` is a node tree. Constrained flex only — no grid/absolute/responsive.",
    "",
    "Containers (have `children`; optional w, gap, pad, stagger):",
    containers,
    "",
    "Leaves:",
    leaves,
    "",
    "states: [{ id, hold }] (e.g. skeleton -> loaded). `in:[state]` limits a node to those states.",
    "Reveal timing is derived from the tree — do not set per-node delays.",
    "",
    `icon names (allowlist): ${ICON_NAMES.join(", ")}.`,
    "dot/badge/icon accept a `color` (hex) that overrides the tone — e.g. coloured status dots.",
    "listRow: `subText` gives a real subtitle (subject/preview/company); `sub` alone is shimmer.",
  ].join("\n");
}

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
        "Emaki turns a deck.json into short motion films. Read the `emaki://guide` resource first. Loop: extract or build_deck (a source → a deck) → validate_deck → apply_ops (writes disk; Studio hot-reloads) → render. To turn a PDF/screenshot/handover into a film, YOU read it and emit a lenient handover, then call build_deck. Never fabricate specific metrics — pass grounding or use words. For ui-scene props call describe_ui_nodes; for any block call describe_block.",
    },
  );

  server.registerTool(
    "validate_deck",
    {
      description: "Validate a deck object against the Emaki schema.",
      inputSchema: { deck: z.unknown() },
    },
    async ({ deck }) => {
      const r = parseDeck(coerceJson(deck));
      if (!r.ok) return text(`✗ invalid:\n${r.message}`, true);
      const warn = glyphWarning(r.deck);
      return text(
        `✓ valid · ${r.deck.scenes.length} scenes · ${r.deck.aspect}${warn ? `\n${warn}` : ""}`,
      );
    },
  );

  server.registerTool(
    "list_blocks",
    {
      description:
        "List the block types available to compose scenes from, with their prop names.",
      inputSchema: {},
    },
    async () => text(`Available blocks:\n${CATALOGUE}`),
  );

  server.registerTool(
    "describe_block",
    {
      description:
        "The exact props of one block — name, type, required, description — from the schema. Call before authoring a scene.",
      inputSchema: { type: z.string() },
    },
    async ({ type }) => {
      const ref = blockReference(type);
      return ref
        ? text(ref)
        : text(
            `Unknown block "${type}". Known: ${BOOTSTRAP_BLOCKS.map((b) => b.type).join(", ")}.`,
            true,
          );
    },
  );

  server.registerTool(
    "describe_ui_nodes",
    {
      description:
        "The ui-scene node vocabulary — containers, leaves, states, and rules. Read this before building a ui-scene `root` tree.",
      inputSchema: {},
    },
    async () => text(uiNodeReference()),
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
    "list_icons",
    {
      description:
        "List the icon names an `icon` node may use (the allowlist). Any other name fails validation.",
      inputSchema: {},
    },
    async () => text(ICON_NAMES.map((n) => `- ${n}`).join("\n")),
  );

  server.registerTool(
    "theme_import",
    {
      description:
        "Turn a brand into a full, valid theme. YOU extract the brand from a logo/screenshot/brand guide (a name + one accent colour, optionally bg/text/fonts); Emaki derives surface, muted, the data palette, and the type scale. Write it to `themes/<id>.theme.json` beside the deck and set the deck's `theme` to that id — it will render. Writes to `out` if given, else returns the theme JSON.",
      inputSchema: {
        brand: z
          .unknown()
          .describe(
            'e.g. { name:"Acme", accent:"#5533ff", mode:"light", bg?, text?, fonts?:{ display?, body?, mono? } }',
          ),
        out: z.string().optional(),
      },
    },
    async ({ brand, out }) => {
      let theme;
      try {
        theme = buildTheme(coerceJson(brand) as BrandInput);
      } catch (e) {
        return text(`✗ ${(e as Error).message}`, true);
      }
      const json = JSON.stringify(theme, null, 2);
      if (out) {
        writeFileSync(resolve(out), json + "\n");
        return text(
          `✓ built theme "${theme.id}" → ${out} · set the deck's \`theme\` to "${theme.id}"`,
        );
      }
      return text(json);
    },
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
    async ({ grounding: rawGrounding }) => {
      const grounding = coerceJson(rawGrounding);
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
    "build_deck",
    {
      description:
        "Turn a lenient handover (scenes as { type, ...props }, no ids/version needed) into a validated deck. This is how a PDF/screenshot/chat handover becomes a film: YOU read the source and emit the handover; Emaki validates it per-scene and reports precise fixes. Writes to `out` if given, else returns the deck JSON.",
      inputSchema: {
        handover: z
          .unknown()
          .describe(
            'e.g. { title, aspect, theme, scenes: [{ type:"title", text:"…" }, { type:"ui-scene", root:{…} }] }',
          ),
        aspect: Aspect.optional(),
        theme: z.string().optional(),
        out: z.string().optional(),
      },
    },
    async ({ handover, aspect, theme, out }) => {
      const r = extractHandover(coerceJson(handover), { aspect, theme });
      if (!r.ok) {
        const detail = r.issues.length
          ? r.issues
              .map(
                (i) =>
                  `  · scene ${i.scene}${i.type ? ` (${i.type})` : ""}: ${i.message.split("\n")[0]}`,
              )
              .join("\n")
          : r.message;
        return text(`✗ handover did not validate:\n${detail}`, true);
      }
      const warn = glyphWarning(r.deck);
      const notes =
        (r.notes.length ? ` · ${r.notes.join(" ")}` : "") +
        (warn ? `\n${warn}` : "");
      if (out) {
        writeFileSync(resolve(out), JSON.stringify(r.deck, null, 2) + "\n");
        return text(
          `✓ built ${r.deck.scenes.length}-scene deck → ${out}${notes}`,
        );
      }
      return text(JSON.stringify(r.deck, null, 2) + (warn ? `\n${warn}` : ""));
    },
  );

  server.registerTool(
    "apply_ops",
    {
      description:
        "Apply scene ops to a deck file on disk and write it back. Studio hot-reloads.",
      inputSchema: {
        deckPath: z.string(),
        ops: z.union([z.string(), z.array(SceneOp)]),
      },
    },
    async ({ deckPath, ops }) => {
      const read = readDeck(deckPath);
      if (!read.ok) return text(`✗ ${read.message}`, true);
      const parsedOps = z.array(SceneOp).safeParse(coerceJson(ops));
      if (!parsedOps.success)
        return text(`✗ invalid ops:\n${z.prettifyError(parsedOps.error)}`, true);
      const result = applyOps(read.deck, parsedOps.data);
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
        "Extract a deck from a file: `rollup` (vite/rollup bundle stats → real sizes) or `handover` (a lenient handover JSON → validated deck). Writes to `out` if given, else returns the deck.",
      inputSchema: {
        source: z.string(),
        type: z.enum(["rollup", "handover"]).default("rollup"),
        out: z.string().optional(),
      },
    },
    async ({ source, type, out }) => {
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
      if (type === "handover") {
        const r = extractHandover(raw);
        if (!r.ok) return text(`✗ ${r.message}`, true);
        deck = r.deck;
      } else {
        try {
          deck = extractRollup(raw);
        } catch (e) {
          return text(`✗ ${(e as Error).message}`, true);
        }
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

  server.registerResource(
    "guide",
    "emaki://guide",
    {
      title: "Emaki agent guide",
      description: "How to drive Emaki: the loop, the rules, the vocabulary.",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        { uri: "emaki://guide", mimeType: "text/markdown", text: AGENT_GUIDE },
      ],
    }),
  );

  server.registerResource(
    "schema",
    "emaki://schema",
    {
      title: "Emaki deck JSON Schema",
      description: "The draft-7 JSON Schema every deck validates against.",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "emaki://schema",
          mimeType: "application/json",
          text: JSON.stringify(deckJsonSchema(), null, 2),
        },
      ],
    }),
  );

  return server;
}

/** Connect the server over stdio — used by the bin and `emaki mcp serve`. */
export async function runStdio(): Promise<void> {
  const server = createServer();
  await server.connect(new StdioServerTransport());
}
