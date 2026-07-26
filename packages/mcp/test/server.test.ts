import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/server";

async function connect(): Promise<Client> {
  const server = createServer();
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0" });
  await Promise.all([server.connect(serverT), client.connect(clientT)]);
  return client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function textOf(res: any): string {
  return (res.content as { text: string }[]).map((c) => c.text).join("\n");
}

describe("emaki mcp server", () => {
  it("exposes the tool set incl. the extraction + describe tools", async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "build_deck",
        "describe_block",
        "describe_ui_nodes",
        "extract",
        "validate_deck",
        "apply_ops",
        "render",
      ]),
    );
  });

  it("build_deck turns a lenient handover into a validated deck", async () => {
    const client = await connect();
    const res = await client.callTool({
      name: "build_deck",
      arguments: {
        handover: {
          aspect: "9:16",
          scenes: [
            { type: "title", text: "Hi." },
            { type: "ui-scene", root: { kind: "col", children: [{ kind: "bar", w: "50%" }] } },
          ],
        },
      },
    });
    const deck = JSON.parse(textOf(res));
    expect(deck.scenes).toHaveLength(2);
    expect(deck.scenes[1].type).toBe("ui-scene");
  });

  it("build_deck reports a broken scene precisely", async () => {
    const client = await connect();
    const res = await client.callTool({
      name: "build_deck",
      arguments: { handover: { scenes: [{ type: "stat", value: "92%" }] } }, // missing label
    });
    expect(res.isError).toBe(true);
    expect(textOf(res)).toMatch(/scene 0/);
  });

  it("build_deck pinpoints a bad ui-scene node (leaf + field)", async () => {
    const client = await connect();
    const res = await client.callTool({
      name: "build_deck",
      arguments: {
        handover: {
          scenes: [
            { type: "ui-scene", root: { kind: "col", children: [{ kind: "text", value: "Compose", size: "rowLabel" }] } },
          ],
        },
      },
    });
    expect(res.isError).toBe(true);
    const t = textOf(res);
    expect(t).toMatch(/root\.children\[0\] \(text\): size/);
  });

  it("describe_ui_nodes returns the node vocabulary", async () => {
    const client = await connect();
    const res = await client.callTool({
      name: "describe_ui_nodes",
      arguments: {},
    });
    const t = textOf(res);
    expect(t).toMatch(/listRow/);
    expect(t).toMatch(/split/);
  });

  it("describe_block returns a block's props", async () => {
    const client = await connect();
    const res = await client.callTool({
      name: "describe_block",
      arguments: { type: "ui-scene" },
    });
    expect(textOf(res)).toMatch(/describe_ui_nodes/);
  });

  it("theme_import turns a brand into a full theme", async () => {
    const client = await connect();
    const res = await client.callTool({
      name: "theme_import",
      arguments: { brand: { name: "Acme Corp", accent: "#5533ff" } },
    });
    const theme = JSON.parse(textOf(res));
    expect(theme.id).toBe("acme-corp");
    expect(theme.colors.accent).toBe("#5533ff");
    expect(theme.colors.surface).toMatch(/^#/);
  });

  it("accepts object params sent as JSON strings (MCP client quirk)", async () => {
    const client = await connect();
    // theme_import with the brand serialized to a string
    const t = await client.callTool({
      name: "theme_import",
      arguments: { brand: JSON.stringify({ name: "StrCo", accent: "#123456" }) },
    });
    expect(JSON.parse(textOf(t)).id).toBe("strco");
    // build_deck with the handover serialized to a string
    const b = await client.callTool({
      name: "build_deck",
      arguments: { handover: JSON.stringify({ scenes: [{ type: "title", text: "Hi." }] }) },
    });
    expect(JSON.parse(textOf(b)).scenes).toHaveLength(1);
  });

  it("warns about tofu glyphs on build_deck", async () => {
    const client = await connect();
    const res = await client.callTool({
      name: "build_deck",
      arguments: { handover: { scenes: [{ type: "title", text: "Compose ＋ reply →" }] } },
    });
    expect(textOf(res)).toMatch(/glyph/i);
  });

  it("list_icons returns the allowlist", async () => {
    const client = await connect();
    const res = await client.callTool({ name: "list_icons", arguments: {} });
    const t = textOf(res);
    expect(t).toMatch(/search/);
    expect(t).toMatch(/chevron-right/);
  });

  it("theme_import rejects a brand with no accent", async () => {
    const client = await connect();
    const res = await client.callTool({
      name: "theme_import",
      arguments: { brand: { name: "No Accent" } },
    });
    expect(res.isError).toBe(true);
    expect(textOf(res)).toMatch(/accent/);
  });

  it("serves the guide and schema resources", async () => {
    const client = await connect();
    const { resources } = await client.listResources();
    const uris = resources.map((r) => r.uri);
    expect(uris).toContain("emaki://guide");
    expect(uris).toContain("emaki://schema");
    const guide = await client.readResource({ uri: "emaki://guide" });
    expect((guide.contents[0]!.text as string)).toMatch(/agent guide/i);
  });
});
