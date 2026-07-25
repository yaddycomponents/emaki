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
  ],
});
if (!parsed.ok) throw new Error("fixture deck should be valid");
const deck = parsed.deck;

const aspects: Aspect[] = ["16:9", "9:16"];

describe("block rendering", () => {
  it("registers all seven block types with a 16:9 layout", () => {
    expect(ALL_BLOCK_TYPES.sort()).toEqual([
      "chapter",
      "compare-bars",
      "list",
      "stat",
      "statement",
      "title",
      "ui-mock",
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

  it("gives every block a positive animation-end time", () => {
    for (const type of ALL_BLOCK_TYPES)
      expect(blockAnimationEnd(type)).toBeGreaterThan(0);
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
