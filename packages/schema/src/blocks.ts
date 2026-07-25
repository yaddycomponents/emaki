import * as z from "zod";
import { defineBlock } from "./registry";

/**
 * Bootstrap blocks.
 *
 * These are minimal prop schemas so `emaki validate` is genuinely useful in
 * Week 1 (a hand-written deck fails with a real error). The full blocks — with
 * per-aspect `layouts` and a `timeline` — move to `@emaki/blocks` in Week 2.
 * Keep the prop names stable; that is the contract templates depend on.
 */

export const titleBlock = defineBlock({
  type: "title",
  props: z
    .object({
      text: z.string().min(1).meta({ description: "The headline." }),
      kicker: z
        .string()
        .optional()
        .meta({ description: "Small label shown above the title." }),
    })
    .meta({ id: "TitleProps" }),
  text: (p) => [p.kicker, p.text].filter(Boolean).join(" "),
});

export const statementBlock = defineBlock({
  type: "statement",
  props: z
    .object({
      text: z
        .string()
        .min(1)
        .meta({ description: "A single load-bearing sentence." }),
      emphasis: z
        .array(z.string())
        .optional()
        .meta({ description: "Substrings of `text` to accent." }),
    })
    .meta({ id: "StatementProps" }),
  text: (p) => p.text,
});

export const statBlock = defineBlock({
  type: "stat",
  props: z
    .object({
      value: z
        .string()
        .min(1)
        .meta({ description: 'The big number, e.g. "5,400".' }),
      label: z.string().min(1).meta({ description: "What the number counts." }),
      caption: z
        .string()
        .optional()
        .meta({ description: "One line of context under the stat." }),
    })
    .meta({ id: "StatProps" }),
  text: (p) => [p.value, p.label, p.caption].filter(Boolean).join(" "),
});

export const compareBarsBlock = defineBlock({
  type: "compare-bars",
  props: z
    .object({
      title: z
        .string()
        .optional()
        .meta({ description: "Label above the comparison." }),
      unit: z
        .string()
        .optional()
        .meta({ description: 'Unit suffix on each value, e.g. "kB".' }),
      rows: z
        .array(
          z.object({
            label: z.string().min(1),
            before: z.number().meta({ description: "The before-state value." }),
            after: z.number().meta({ description: "The after-state value." }),
          }),
        )
        .min(1)
        .meta({
          description: "One or more before/after rows on a shared axis.",
        }),
    })
    .meta({ id: "CompareBarsProps" }),
  text: (p) =>
    [p.title, ...p.rows.map((r) => r.label)].filter(Boolean).join(" "),
});

export const chapterBlock = defineBlock({
  type: "chapter",
  props: z
    .object({
      number: z
        .string()
        .optional()
        .meta({ description: 'Section number, e.g. "01".' }),
      title: z.string().min(1).meta({ description: "The chapter title." }),
    })
    .meta({ id: "ChapterProps" }),
  text: (p) => [p.number, p.title].filter(Boolean).join(" "),
});

export const listBlock = defineBlock({
  type: "list",
  props: z
    .object({
      title: z
        .string()
        .optional()
        .meta({ description: "Label above the list." }),
      items: z
        .array(z.string().min(1))
        .min(1)
        .meta({ description: "The list items, in order." }),
    })
    .meta({ id: "ListProps" }),
  text: (p) => [p.title, ...p.items].filter(Boolean).join(" "),
});

export const uiMockBlock = defineBlock({
  type: "ui-mock",
  props: z
    .object({
      title: z
        .string()
        .optional()
        .meta({ description: "Caption under the mock." }),
      app: z
        .string()
        .optional()
        .meta({ description: "App name shown in the mock title bar." }),
      lines: z
        .array(z.string())
        .optional()
        .meta({
          description: "Rows of UI text; omit for skeleton placeholders.",
        }),
    })
    .meta({ id: "UiMockProps" }),
  text: (p) => [p.title, p.app, ...(p.lines ?? [])].filter(Boolean).join(" "),
});

/** The registered block set the canonical `DeckSchema` validates against. */
export const BOOTSTRAP_BLOCKS = [
  titleBlock,
  statementBlock,
  statBlock,
  compareBarsBlock,
  chapterBlock,
  listBlock,
  uiMockBlock,
] as const;

export type TitleProps = z.infer<typeof titleBlock.props>;
export type StatementProps = z.infer<typeof statementBlock.props>;
export type StatProps = z.infer<typeof statBlock.props>;
export type CompareBarsProps = z.infer<typeof compareBarsBlock.props>;
export type ChapterProps = z.infer<typeof chapterBlock.props>;
export type ListProps = z.infer<typeof listBlock.props>;
export type UiMockProps = z.infer<typeof uiMockBlock.props>;
