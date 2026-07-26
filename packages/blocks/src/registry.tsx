import { type Timeline, timelineEnd } from "@emaki/core";
import type { Aspect, Deck, Scene } from "@emaki/schema";
import { createElement, type FC } from "react";
import { Chapter16x9, Chapter9x16, chapterTimeline } from "./blocks/chapter";
import {
  CompareBars16x9,
  CompareBars9x16,
  compareBarsTimeline,
} from "./blocks/compareBars";
import { List16x9, List9x16, listTimeline } from "./blocks/list";
import { Stat16x9, Stat9x16, statTimeline } from "./blocks/stat";
import {
  Statement16x9,
  Statement9x16,
  statementTimeline,
} from "./blocks/statement";
import { Title16x9, Title9x16, titleTimeline } from "./blocks/title";
import { UiMock16x9, UiMock9x16, uiMockTimeline } from "./blocks/uiMock";
import { UiScene16x9, UiScene9x16, uiSceneTimelineFor } from "./blocks/uiScene";
import { TimelineContext } from "./engine";

export interface EmakiBlock {
  type: string;
  timeline: Timeline;
  /**
   * Derive the timeline from a scene's props. Used by data-driven blocks like
   * `ui-scene` whose timeline depends on the node tree; takes precedence over
   * the static `timeline` when present.
   */
  timelineFor?: (props: unknown) => Timeline;
  /** '16:9' is the fallback layout; declare others as they diverge. */
  layouts: Partial<Record<Aspect, FC<never>>>;
}

export const BLOCKS: Record<string, EmakiBlock> = {
  title: {
    type: "title",
    timeline: titleTimeline,
    layouts: {
      "16:9": Title16x9 as FC<never>,
      "1:1": Title16x9 as FC<never>,
      "9:16": Title9x16 as FC<never>,
    },
  },
  statement: {
    type: "statement",
    timeline: statementTimeline,
    layouts: {
      "16:9": Statement16x9 as FC<never>,
      "1:1": Statement16x9 as FC<never>,
      "9:16": Statement9x16 as FC<never>,
    },
  },
  stat: {
    type: "stat",
    timeline: statTimeline,
    layouts: {
      "16:9": Stat16x9 as FC<never>,
      "1:1": Stat16x9 as FC<never>,
      "9:16": Stat9x16 as FC<never>,
    },
  },
  "compare-bars": {
    type: "compare-bars",
    timeline: compareBarsTimeline,
    layouts: {
      "16:9": CompareBars16x9 as FC<never>,
      "1:1": CompareBars16x9 as FC<never>,
      "9:16": CompareBars9x16 as FC<never>,
    },
  },
  chapter: {
    type: "chapter",
    timeline: chapterTimeline,
    layouts: {
      "16:9": Chapter16x9 as FC<never>,
      "1:1": Chapter16x9 as FC<never>,
      "9:16": Chapter9x16 as FC<never>,
    },
  },
  list: {
    type: "list",
    timeline: listTimeline,
    layouts: {
      "16:9": List16x9 as FC<never>,
      "1:1": List16x9 as FC<never>,
      "9:16": List9x16 as FC<never>,
    },
  },
  "ui-mock": {
    type: "ui-mock",
    timeline: uiMockTimeline,
    layouts: {
      "16:9": UiMock16x9 as FC<never>,
      "1:1": UiMock16x9 as FC<never>,
      "9:16": UiMock9x16 as FC<never>,
    },
  },
  "ui-scene": {
    type: "ui-scene",
    timeline: [],
    timelineFor: (props) => uiSceneTimelineFor(props as never),
    layouts: {
      "16:9": UiScene16x9 as FC<never>,
      "1:1": UiScene16x9 as FC<never>,
      "9:16": UiScene9x16 as FC<never>,
    },
  },
};

export function layoutFor(type: string, aspect: Aspect): FC<never> {
  const block = BLOCKS[type];
  if (!block) throw new Error(`Unknown block type: ${type}`);
  return (
    block.layouts[aspect] ??
    block.layouts["16:9"] ??
    (Object.values(block.layouts)[0] as FC<never>)
  );
}

/** The animation-end time of a block's timeline — 0 for an unknown type. */
export function blockAnimationEnd(type: string): number {
  return timelineEnd(BLOCKS[type]?.timeline ?? []);
}

/** Render one scene at an aspect, providing its timeline to the Anim components. */
export const Block: FC<{ scene: Scene; aspect: Aspect }> = ({
  scene,
  aspect,
}) => {
  const block = BLOCKS[scene.type];
  if (!block) throw new Error(`Unknown block type: ${scene.type}`);
  const Layout = layoutFor(scene.type, aspect);
  const timeline = block.timelineFor
    ? block.timelineFor(scene.props)
    : block.timeline;
  return createElement(
    TimelineContext.Provider,
    { value: timeline },
    createElement(
      Layout as FC<Record<string, unknown>>,
      scene.props as Record<string, unknown>,
    ),
  );
};

export const ALL_BLOCK_TYPES = Object.keys(BLOCKS);

/** Convenience: the block type list a deck uses, in scene order. */
export function deckBlockTypes(deck: Deck): string[] {
  return deck.scenes.map((s) => s.type);
}
