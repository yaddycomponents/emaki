import { timelineEnd } from "@emaki/core";
import { type Aspect, parseDeck } from "@emaki/schema";
import { saasProduct, warmEditorial } from "@emaki/themes";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ALL_BLOCK_TYPES,
  Block,
  blockAnimationEnd,
  BLOCKS,
  ThemeProvider,
  uiSceneTimelineFor,
} from "../src";

const parsed = parseDeck({
  version: 1,
  scenes: [
    {
      id: "t",
      type: "title",
      props: { kicker: "Emaki", text: "Films from a JSON file." },
    },
    {
      id: "s",
      type: "statement",
      props: { text: "We cleared the debt.", emphasis: ["cleared"] },
    },
    {
      id: "n",
      type: "stat",
      props: {
        value: "5,400",
        label: "lines deleted",
        caption: "across three repos",
      },
    },
    {
      id: "c",
      type: "compare-bars",
      props: {
        title: "Bundle",
        unit: "kB",
        rows: [{ label: "raw", before: 247, after: 114 }],
      },
    },
    {
      id: "ch",
      type: "chapter",
      props: { number: "01", title: "The migration" },
    },
    {
      id: "l",
      type: "list",
      props: { title: "Steps", items: ["scan", "plan", "ship"] },
    },
    {
      id: "u",
      type: "ui-mock",
      props: {
        app: "inbox",
        title: "the drafted reply",
        lines: ["Hi Sam,", "Thanks —"],
      },
    },
    {
      id: "us",
      type: "ui-scene",
      props: {
        caption: "One reply, sent & logged",
        states: [
          { id: "skeleton", hold: 1 },
          { id: "loaded", hold: 2.5 },
        ],
        root: {
          kind: "split",
          children: [
            {
              kind: "col",
              w: 300,
              children: [
                { kind: "listRow", title: "52%", sub: "80%", active: true },
                { kind: "listRow", title: "46%", sub: "80%", badge: "AI Replied" },
              ],
            },
            {
              kind: "col",
              children: [
                { kind: "bar", w: "52%", h: 14, text: "Acme Corp · Invoice #4021" },
                {
                  kind: "card",
                  in: ["loaded"],
                  children: [
                    { kind: "text", value: "Activity created · PTP001", tone: "primary" },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
  ],
});
if (!parsed.ok) throw new Error("fixture deck should be valid");
const deck = parsed.deck;

const aspects: Aspect[] = ["16:9", "9:16"];

describe("block rendering", () => {
  it("registers all block types with a 16:9 layout", () => {
    expect(ALL_BLOCK_TYPES.sort()).toEqual([
      "chapter",
      "compare-bars",
      "list",
      "stat",
      "statement",
      "title",
      "ui-mock",
      "ui-scene",
    ]);
    for (const b of Object.values(BLOCKS))
      expect(b.layouts["16:9"]).toBeTruthy();
  });

  for (const aspect of aspects) {
    for (const scene of deck.scenes) {
      it(`renders ${scene.type} at ${aspect} to non-empty static markup`, () => {
        const html = renderToStaticMarkup(
          createElement(Block, { scene, aspect }),
        );
        expect(html.length).toBeGreaterThan(20);
      });
    }
  }

  it("renders the emphasised substring inside the statement", () => {
    const scene = deck.scenes[1]!;
    const html = renderToStaticMarkup(
      createElement(Block, { scene, aspect: "16:9" }),
    );
    expect(html).toContain("cleared");
  });

  it("gives every block motion — a static timeline or a derived one", () => {
    for (const type of ALL_BLOCK_TYPES) {
      const block = BLOCKS[type]!;
      if (block.timelineFor) {
        expect(blockAnimationEnd(type)).toBe(0); // data-driven: no static timeline
      } else {
        expect(blockAnimationEnd(type)).toBeGreaterThan(0);
      }
    }
  });

  it("derives a positive timeline for the ui-scene from its node tree", () => {
    const scene = deck.scenes.find((s) => s.type === "ui-scene")!;
    const timeline = uiSceneTimelineFor(scene.props as never);
    expect(timeline.length).toBeGreaterThan(0);
    expect(timelineEnd(timeline)).toBeGreaterThan(0);
  });

  it("renders the same block differently under two themes (one engine)", () => {
    const scene = deck.scenes[0]!; // title
    const warm = renderToStaticMarkup(
      createElement(ThemeProvider, {
        theme: warmEditorial,
        children: createElement(Block, { scene, aspect: "16:9" }),
      }),
    );
    const saas = renderToStaticMarkup(
      createElement(ThemeProvider, {
        theme: saasProduct,
        children: createElement(Block, { scene, aspect: "16:9" }),
      }),
    );
    expect(warm).toContain(warmEditorial.colors.bg); // #f4e7d6
    expect(saas).toContain(saasProduct.colors.bg); // #f3f4f7
    expect(warm).not.toEqual(saas);
  });
});
