import type { PresetName, Timeline } from "@emaki/core";
import {
  createElement,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { LeafNode, UiNode, UiSceneProps } from "./schema";
import { isContainer, sequence, stateAt, visibleIn } from "./sequence";

/**
 * The node → React renderer. It is deliberately blind to *how* elements animate:
 * the host block injects an `Anim` component (StaticAnim / FramerAnim /
 * RemotionAnim, all from @emaki/blocks) and the current `sceneTime`. That
 * injection is what keeps @emaki/ui free of a @emaki/blocks dependency — the
 * edge runs one way, blocks → ui, with no cycle.
 */

/** Structural shape of @emaki/blocks' AnimComponent — matched, never imported. */
export type AnimLike = ComponentType<{
  target: string;
  as?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}>;

/** The theme tokens the renderer reads — a subset of @emaki/themes' Theme. */
export interface UiTheme {
  colors: {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
  };
  fonts: { display: string; body: string; mono: string };
}

/** Preset used for each node kind's entrance. Containers don't animate — only leaves do. */
const PRESET_FOR: Record<LeafNode["kind"], PresetName> = {
  bar: "fadeUp",
  text: "fadeUp",
  badge: "popIn",
  dot: "popIn",
  icon: "fadeUp",
  toggle: "fadeUp",
  count: "fadeUp",
  divider: "fadeIn",
  field: "fadeUp",
  listRow: "fadeUp",
};

/**
 * The derived timeline: one step per *leaf*, keyed by its tree path, starting at
 * its derived reveal. Containers are static layout, so they carry no step — the
 * hand-authored `delay={}` on every element is exactly what this replaces.
 */
export function uiSceneTimeline(props: UiSceneProps): Timeline {
  const { placed, entranceEnd } = sequence(props.root);
  const steps = placed
    .filter((p) => !isContainer(p.node))
    .map((p) => ({
      target: p.path,
      preset: PRESET_FOR[(p.node as LeafNode).kind] ?? "fadeUp",
      at: p.reveal,
    }));
  if (props.caption)
    steps.push({
      target: "caption",
      preset: "fadeUp",
      at: Math.max(0, entranceEnd - 0.3),
    });
  return steps;
}

const len = (v: number | string): string =>
  typeof v === "number" ? `${v}px` : v;

const TEXT_PX: Record<
  NonNullable<Extract<LeafNode, { kind: "text" }>["size"]>,
  number
> = {
  eyebrow: 11,
  label: 12,
  body: 14,
  metric: 30,
  h2: 20,
};

function textColor(t: UiTheme, tone: string): string {
  switch (tone) {
    case "muted":
      return t.colors.muted;
    case "faint":
      return withAlpha(t.colors.muted, 0.6);
    case "primary":
      return t.colors.accent;
    case "good":
      return "#17935f";
    case "danger":
      return "#e0484d";
    default:
      return t.colors.text;
  }
}

/** Blend a hex/rgb colour toward transparency — used for shimmer + faint tones. */
function withAlpha(color: string, a: number): string {
  if (color.startsWith("#")) {
    const h = color.slice(1);
    const n =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    const r = parseInt(n.slice(0, 2), 16);
    const g = parseInt(n.slice(2, 4), 16);
    const b = parseInt(n.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  const m = color.match(/^rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1]!.split(",").map((s) => s.trim());
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return color;
}

const shimmer = (t: UiTheme, lite: boolean): string =>
  withAlpha(t.colors.text, lite ? 0.05 : 0.1);

interface Ctx {
  t: UiTheme;
  /** True once the scene is past its first (skeleton) state — content is "loaded". */
  loaded: boolean;
}

function badge(
  node: Extract<LeafNode, { kind: "badge" }>,
  t: UiTheme,
): ReactNode {
  const tone = node.tone;
  const color = tone === "ai" ? t.colors.accent : textColor(t, tone);
  return createElement(
    "span",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 999,
        fontFamily: t.fonts.mono,
        fontSize: 11,
        fontWeight: 600,
        color,
        background: withAlpha(color, 0.12),
        whiteSpace: "nowrap",
      } as CSSProperties,
    },
    node.label,
  );
}

function leaf(node: LeafNode, ctx: Ctx): ReactNode {
  const { t, loaded } = ctx;
  switch (node.kind) {
    case "bar": {
      if (node.text && loaded) {
        return createElement(
          "div",
          {
            style: {
              fontFamily: t.fonts.body,
              fontSize: Math.max(12, node.h + 1),
              color: t.colors.text,
              lineHeight: 1.3,
            } as CSSProperties,
          },
          node.text,
        );
      }
      return createElement("div", {
        style: {
          width: len(node.w),
          height: node.h,
          borderRadius: 6,
          background: shimmer(t, node.lite),
          flexShrink: 0,
        } as CSSProperties,
      });
    }
    case "text":
      return createElement(
        "div",
        {
          style: {
            fontFamily: node.mono ? t.fonts.mono : t.fonts.body,
            fontSize: TEXT_PX[node.size],
            fontWeight:
              node.weight === "bold"
                ? 700
                : node.weight === "medium"
                  ? 500
                  : 400,
            color: textColor(t, node.tone),
            lineHeight: 1.3,
          } as CSSProperties,
        },
        node.value,
      );
    case "badge":
      return badge(node, t);
    case "dot":
      return createElement(
        "div",
        {
          style: {
            width: node.size,
            height: node.size,
            borderRadius: "50%",
            background: withAlpha(t.colors.accent, 0.16),
            color: t.colors.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: t.fonts.mono,
            fontSize: Math.round(node.size * 0.38),
            fontWeight: 600,
            flexShrink: 0,
          } as CSSProperties,
        },
        node.initials ?? null,
      );
    case "icon":
      return createElement("div", {
        style: {
          width: 16,
          height: 16,
          borderRadius: 4,
          background: withAlpha(textColor(t, node.tone), 0.9),
          flexShrink: 0,
        } as CSSProperties,
      });
    case "toggle":
      return createElement(
        "div",
        {
          style: {
            width: 34,
            height: 20,
            borderRadius: 999,
            padding: 2,
            background: node.on ? t.colors.accent : shimmer(t, false),
            display: "flex",
            justifyContent: node.on ? "flex-end" : "flex-start",
            flexShrink: 0,
          } as CSSProperties,
        },
        createElement("div", {
          style: {
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#fff",
          } as CSSProperties,
        }),
      );
    case "count":
      return createElement(
        "div",
        {
          style: {
            fontFamily: t.fonts.display,
            fontSize: TEXT_PX.metric,
            color: t.colors.text,
            lineHeight: 1,
          } as CSSProperties,
        },
        `${node.prefix ?? ""}${loaded ? node.to : 0}${node.suffix ?? ""}`,
      );
    case "divider":
      return createElement("div", {
        style: {
          height: 1,
          width: "100%",
          background: shimmer(t, true),
        } as CSSProperties,
      });
    case "field":
      return createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: 4,
          } as CSSProperties,
        },
        createElement(
          "div",
          {
            key: "l",
            style: {
              fontFamily: t.fonts.mono,
              fontSize: 11,
              color: t.colors.muted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            } as CSSProperties,
          },
          node.label,
        ),
        typeof node.value === "string"
          ? createElement(
              "div",
              {
                key: "v",
                style: {
                  fontFamily: t.fonts.body,
                  fontSize: 14,
                  color: t.colors.text,
                } as CSSProperties,
              },
              node.value,
            )
          : createElement("div", {
              key: "v",
              style: {
                width: len(node.value.w),
                height: node.value.h,
                borderRadius: 6,
                background: shimmer(t, node.value.lite),
              } as CSSProperties,
            }),
      );
    case "listRow":
      return listRow(node, ctx);
    default:
      return null;
  }
}

function listRow(
  node: Extract<LeafNode, { kind: "listRow" }>,
  ctx: Ctx,
): ReactNode {
  const { t } = ctx;
  const title = node.titleText
    ? createElement(
        "div",
        {
          key: "t",
          style: {
            fontFamily: t.fonts.body,
            fontSize: 13,
            color: t.colors.text,
            fontWeight: 500,
          } as CSSProperties,
        },
        node.titleText,
      )
    : createElement("div", {
        key: "t",
        style: {
          width: len(node.title ?? "52%"),
          height: 9,
          borderRadius: 5,
          background: shimmer(t, false),
        } as CSSProperties,
      });
  const sub = node.sub
    ? createElement("div", {
        key: "s",
        style: {
          width: len(node.sub),
          height: 7,
          borderRadius: 5,
          background: shimmer(t, true),
        } as CSSProperties,
      })
    : null;
  return createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 12px",
        borderRadius: 10,
        background: node.active
          ? withAlpha(t.colors.accent, 0.08)
          : "transparent",
      } as CSSProperties,
    },
    node.avatar
      ? createElement("div", {
          key: "a",
          style: {
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: withAlpha(t.colors.accent, 0.14),
            flexShrink: 0,
          } as CSSProperties,
        })
      : null,
    createElement(
      "div",
      {
        key: "b",
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: "1 1 0",
          minWidth: 0,
        } as CSSProperties,
      },
      title,
      sub,
    ),
    node.badge
      ? badge({ kind: "badge", label: node.badge, tone: "ai" }, t)
      : null,
  );
}

const IS_ROW = new Set(["row", "split"]);

function containerStyle(
  node: Extract<UiNode, { children: UiNode[] }>,
  t: UiTheme,
): CSSProperties {
  const boxed = node.kind === "card" || node.kind === "panel";
  return {
    display: "flex",
    flexDirection: IS_ROW.has(node.kind) ? "row" : "column",
    gap: node.gap ?? (boxed ? 12 : 12),
    alignItems: "stretch",
    ...(node.w !== undefined ? { width: len(node.w), flexShrink: 0 } : {}),
    ...(boxed
      ? {
          background: t.colors.surface,
          border: `1px solid ${withAlpha(t.colors.text, 0.08)}`,
          borderRadius: 14,
          padding: node.pad ?? 16,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 12px 34px rgba(0,0,0,0.08)",
        }
      : node.pad !== undefined
        ? { padding: node.pad }
        : {}),
  };
}

/** Render one node at `path`; leaves animate through the injected Anim, containers are plain layout. */
function renderNode(
  node: UiNode,
  path: string,
  ctx: Ctx,
  activeState: string,
  Anim: AnimLike,
): ReactNode {
  if (!visibleIn(node, activeState)) return null;

  if (isContainer(node)) {
    const rowParent = IS_ROW.has(node.kind);
    const children = node.children.map((child, i) => {
      const el = renderNode(child, `${path}.${i}`, ctx, activeState, Anim);
      if (el === null) return null;
      const grow = rowParent && !hasWidth(child);
      return createElement(
        "div",
        {
          key: i,
          style: grow ? { flex: "1 1 0", minWidth: 0 } : { minWidth: 0 },
        },
        el,
      );
    });
    return createElement(
      "div",
      { style: containerStyle(node, ctx.t) },
      children,
    );
  }

  return createElement(
    Anim as ComponentType<Record<string, unknown>>,
    { target: path, as: "div", style: { minWidth: 0 } },
    leaf(node, ctx),
  );
}

function hasWidth(node: UiNode): boolean {
  return "w" in node && node.w !== undefined;
}

/**
 * The `ui-scene` view. The host block wraps this in the scene frame and injects
 * the Anim component + current scene time; everything else is derived from the
 * node tree. `sceneTime` defaults to Infinity → the terminal (loaded) state,
 * which is what StaticAnim (tests, thumbnails) and preview want by default.
 */
export function UiSceneView(props: {
  props: UiSceneProps;
  Anim: AnimLike;
  theme: UiTheme;
  sceneTime?: number;
  /** Design width for a width-less root (split/row/col) so flex panes resolve. */
  width?: number;
}): ReactNode {
  const { props: scene, Anim, theme } = props;
  const t = props.sceneTime ?? Infinity;
  const active = stateAt(scene.states, t);
  const loaded = active !== scene.states[0]!.id || scene.states.length === 1;
  const ctx: Ctx = { t: theme, loaded };

  // A root with its own width (a card) is centred at that width; a width-less
  // container (split/row) is stretched to the design width so `flex:1` panes fill.
  const mockStyle: CSSProperties = hasWidth(scene.root)
    ? { maxWidth: "100%" }
    : { width: props.width ?? 900, maxWidth: "100%" };

  return createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      } as CSSProperties,
    },
    createElement(
      "div",
      { key: "mock", style: mockStyle },
      renderNode(scene.root, "0", ctx, active, Anim),
    ),
    scene.caption
      ? createElement(
          Anim as ComponentType<Record<string, unknown>>,
          {
            key: "caption",
            target: "caption",
            as: "div",
            style: {
              marginTop: 22,
              fontFamily: theme.fonts.mono,
              fontSize: 12,
              letterSpacing: "0.04em",
              color: theme.colors.muted,
              textAlign: "center",
            } as CSSProperties,
          },
          scene.caption,
        )
      : null,
  );
}
