import {
  type AnimSpec,
  buildAnim,
  type InlineAnim,
  type PresetName,
  resolvePreset,
  sampleSpec,
  type Timeline,
} from "@emaki/core";
import {
  createElement,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { LeafNode, State, UiNode, UiSceneProps } from "./schema";
import { isContainer, sequence, stateAt, stateWindows, visibleIn } from "./sequence";

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
  image: "fadeIn",
  sparkle: "popIn",
  vector: "fadeIn",
  button: "fadeUp",
  checkbox: "fadeUp",
  chip: "popIn",
  tabs: "fadeUp",
  search: "fadeIn",
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
    .map((p) => {
      const node = p.node as LeafNode & { anim?: string | InlineAnim };
      // The open animation: an inline spec composes motion; a string names a
      // preset; otherwise the kind's default. All resolve to one AnimSpec.
      if (node.anim && typeof node.anim === "object") {
        return { target: p.path, spec: buildAnim(node.anim), at: p.reveal };
      }
      const preset = (typeof node.anim === "string" ? node.anim : PRESET_FOR[node.kind]) as PresetName;
      return { target: p.path, preset: preset ?? "fadeUp", at: p.reveal };
    });
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

// The UI type ramp — small, UI-sized (11–26px), decoupled from the slide scale.
type TextSizeName = NonNullable<Extract<LeafNode, { kind: "text" }>["size"]>;
const TEXT_PX: Record<TextSizeName, number> = {
  eyebrow: 11,
  label: 12,
  body: 13,
  md: 15,
  lg: 18,
  h2: 20,
  metric: 26,
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

const hairline = (t: UiTheme): string => withAlpha(t.colors.text, 0.08);

const SHADOWS: Record<string, string> = {
  sm: "0 1px 2px rgba(0,0,0,0.06)",
  md: "0 1px 2px rgba(0,0,0,0.04), 0 12px 34px rgba(0,0,0,0.08)",
  lg: "0 1px 2px rgba(0,0,0,0.05), 0 22px 60px rgba(0,0,0,0.12)",
};

/** Resolve a colour value: a theme token, a hex/rgb, or the AI gradient. */
function resolveColor(t: UiTheme, v: string): string {
  switch (v) {
    case "bg":
      return t.colors.bg;
    case "surface":
      return t.colors.surface;
    case "text":
    case "ink":
      return t.colors.text;
    case "muted":
      return t.colors.muted;
    case "accent":
    case "primary":
      return t.colors.accent;
    case "good":
      return "#17935f";
    case "danger":
      return "#e0484d";
    case "hairline":
      return hairline(t);
    case "ai":
      return AI_GRADIENT;
    default:
      return v;
  }
}

// The signature AI look — a pink→blue gradient (ported from v1's AI-Reply deck).
const AI_GRADIENT = "linear-gradient(64deg, #eb2f96 30%, #1d39c4 70%)";
const AI_PINK = "#eb2f96";
const AI_BLUE = "#1d39c4";

function aiGradientDefs(): ReactNode {
  return createElement(
    "defs",
    { key: "d" },
    createElement(
      "linearGradient",
      { id: "emaki-ai-grad", x1: "0", y1: "0", x2: "1", y2: "1" },
      createElement("stop", { offset: "0%", stopColor: AI_PINK }),
      createElement("stop", { offset: "100%", stopColor: AI_BLUE }),
    ),
  );
}

/** The AI sparkle mark — a gradient four-point star. Solid `color` overrides the gradient. */
function renderSparkle(size: number, color?: string): ReactNode {
  const fill = color ?? "url(#emaki-ai-grad)";
  return createElement(
    "svg",
    { width: size, height: size, viewBox: "0 0 24 24", style: { display: "block", flexShrink: 0 } as CSSProperties },
    color ? null : aiGradientDefs(),
    createElement("path", { key: "p1", d: "M12 1.5 L14 9 L21.5 11 L14 13 L12 20.5 L10 13 L2.5 11 L10 9 Z", fill }),
    createElement("path", { key: "p2", d: "M19 3 L19.8 5.6 L22.5 6.5 L19.8 7.4 L19 10 L18.2 7.4 L15.5 6.5 L18.2 5.6 Z", fill, opacity: 0.85 }),
  );
}

/** The open vector primitive — a custom mark from SVG path data. `ai` fill uses the gradient. */
function renderVector(node: Extract<LeafNode, { kind: "vector" }>, t: UiTheme): ReactNode {
  const usesAi = node.paths.some((p) => p.fill === "ai" || p.stroke === "ai");
  const col = (v: string | undefined, fallback?: string): string | undefined =>
    v === undefined ? fallback : v === "ai" ? "url(#emaki-ai-grad)" : resolveColor(t, v);
  return createElement(
    "svg",
    { width: node.w, height: node.h, viewBox: node.viewBox, style: { display: "block", flexShrink: 0 } as CSSProperties },
    usesAi ? aiGradientDefs() : null,
    node.paths.map((p, i) =>
      createElement("path", {
        key: i,
        d: p.d,
        fill: col(p.fill, p.stroke ? "none" : t.colors.text),
        stroke: col(p.stroke),
        strokeWidth: p.strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
    ),
  );
}

/** Gradient-clipped text (the AI emphasis style). */
function gradientTextStyle(): CSSProperties {
  return {
    background: AI_GRADIENT,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
  };
}

// The icon allowlist, drawn as stroke primitives on a 24×24 grid (Feather-style).
type IconEl = [string, Record<string, number | string>, boolean?];
const ICONS: Record<string, IconEl[]> = {
  search: [["circle", { cx: 11, cy: 11, r: 7 }], ["line", { x1: 21, y1: 21, x2: 16.5, y2: 16.5 }]],
  plus: [["line", { x1: 12, y1: 5, x2: 12, y2: 19 }], ["line", { x1: 5, y1: 12, x2: 19, y2: 12 }]],
  minus: [["line", { x1: 5, y1: 12, x2: 19, y2: 12 }]],
  check: [["polyline", { points: "20 6 9 17 4 12" }]],
  x: [["line", { x1: 6, y1: 6, x2: 18, y2: 18 }], ["line", { x1: 18, y1: 6, x2: 6, y2: 18 }]],
  "chevron-right": [["polyline", { points: "9 6 15 12 9 18" }]],
  "chevron-down": [["polyline", { points: "6 9 12 15 18 9" }]],
  "chevron-left": [["polyline", { points: "15 6 9 12 15 18" }]],
  "arrow-right": [["line", { x1: 4, y1: 12, x2: 20, y2: 12 }], ["polyline", { points: "13 5 20 12 13 19" }]],
  mail: [["rect", { x: 2, y: 4, width: 20, height: 16, rx: 2 }], ["polyline", { points: "2 6 12 13 22 6" }]],
  calendar: [
    ["rect", { x: 3, y: 4, width: 18, height: 18, rx: 2 }],
    ["line", { x1: 16, y1: 2, x2: 16, y2: 6 }],
    ["line", { x1: 8, y1: 2, x2: 8, y2: 6 }],
    ["line", { x1: 3, y1: 10, x2: 21, y2: 10 }],
  ],
  clock: [["circle", { cx: 12, cy: 12, r: 9 }], ["polyline", { points: "12 7 12 12 15 14" }]],
  bell: [
    ["path", { d: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" }],
    ["path", { d: "M13.7 21a2 2 0 0 1-3.4 0" }],
  ],
  star: [["polygon", { points: "12 2 15 9 22 9.3 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.3 9 9" }]],
  user: [["path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }], ["circle", { cx: 12, cy: 7, r: 4 }]],
  filter: [["polygon", { points: "22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3" }]],
  settings: [["circle", { cx: 12, cy: 12, r: 3 }], ["path", { d: "M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" }]],
  "more-horizontal": [
    ["circle", { cx: 5, cy: 12, r: 1.4 }, true],
    ["circle", { cx: 12, cy: 12, r: 1.4 }, true],
    ["circle", { cx: 19, cy: 12, r: 1.4 }, true],
  ],
};

/** Render an allowlisted icon at the given colour. Falls back to a small dot. */
function renderIcon(name: string, color: string, size = 16): ReactNode {
  const els = ICONS[name];
  if (!els) {
    return createElement("div", {
      style: { width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 } as CSSProperties,
    });
  }
  return createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: { flexShrink: 0, display: "block" } as CSSProperties,
    },
    els.map(([tag, props, fill], i) =>
      createElement(tag, {
        key: i,
        ...props,
        ...(fill ? { fill: color, stroke: "none" } : {}),
      }),
    ),
  );
}

// ── state timing / crossfade ─────────────────────────────────────────────────

/** How the current state resolves at time t — with crossfade blend into it. */
interface StateFx {
  current: string;
  prev: string | null;
  /** 0→1 progress into `current` from `prev` (1 = settled). */
  blend: number;
  /** 0→1 how "loaded" text-bearing nodes are (crossfaded skeleton→text). */
  textReveal: number;
}

const smooth = (x: number): number => x * x * (3 - 2 * x);

function showsText(states: State[], id: string): boolean {
  return id !== states[0]!.id || states.length === 1;
}

function computeFx(
  states: State[],
  t: number,
  transition: "crossfade" | "cut",
  ms: number,
): StateFx {
  const windows = stateWindows(states);
  if (!isFinite(t)) {
    const last = states[states.length - 1]!.id;
    return { current: last, prev: null, blend: 1, textReveal: showsText(states, last) ? 1 : 0 };
  }
  let i = windows.findIndex((w) => t < w.end);
  if (i === -1) i = windows.length - 1;
  const current = states[i]!.id;
  const prev = i > 0 ? states[i - 1]!.id : null;
  const dur = transition === "cut" ? 0 : ms / 1000;
  const start = windows[i]!.start;
  const raw = dur > 0 && i > 0 ? Math.max(0, Math.min(1, (t - start) / dur)) : 1;
  const blend = smooth(raw);
  const curT = showsText(states, current) ? 1 : 0;
  const prevT = prev !== null ? (showsText(states, prev) ? 1 : 0) : curT;
  return { current, prev, blend, textReveal: prevT + (curT - prevT) * blend };
}

/** Resolve a node's `anim`/`enter`/`exit` (preset name or inline) to an AnimSpec. */
function resolveAnim(anim: string | InlineAnim): AnimSpec {
  return typeof anim === "string" ? resolvePreset(anim as PresetName) : buildAnim(anim);
}

type StateRender = { render: false } | { render: true; style?: CSSProperties };

/**
 * The per-node style during a state change. A node fully present in both the
 * previous and current state renders plainly. One entering/leaving crossfades by
 * default, or animates via its `enter`/`exit` motion (slide-in, push, etc.).
 */
function stateStyle(node: UiNode, fx: StateFx): StateRender {
  const inCur = visibleIn(node, fx.current);
  const inPrev = fx.prev !== null ? visibleIn(node, fx.prev) : inCur;
  if (inCur && inPrev) return { render: true };
  if (!inCur && !inPrev) return { render: false };
  const n = node as { enter?: string | InlineAnim; exit?: string | InlineAnim };
  if (inCur) {
    // entering: from → identity as blend 0→1
    const style = n.enter ? (sampleSpec(resolveAnim(n.enter), fx.blend) as CSSProperties) : { opacity: fx.blend };
    return { render: true, style };
  }
  // leaving: identity → exit.from ⇒ sample the exit spec backwards
  const style = n.exit ? (sampleSpec(resolveAnim(n.exit), 1 - fx.blend) as CSSProperties) : { opacity: 1 - fx.blend };
  return { render: true, style };
}

interface Ctx {
  t: UiTheme;
  fx: StateFx;
}

// ── leaves ───────────────────────────────────────────────────────────────────

function badge(node: Extract<LeafNode, { kind: "badge" }>, t: UiTheme): ReactNode {
  // tone:"ai" is the signature mark — a sparkle + gradient label on a soft pill.
  if (node.tone === "ai" && !node.color) {
    return createElement(
      "span",
      {
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 999,
          background: "linear-gradient(90deg, rgba(235,47,150,0.09), rgba(29,57,196,0.09))",
          border: "1px solid rgba(235,47,150,0.18)",
          whiteSpace: "nowrap",
        } as CSSProperties,
      },
      renderSparkle(14),
      createElement("span", { key: "l", style: { fontFamily: t.fonts.mono, fontSize: 11, fontWeight: 600, ...gradientTextStyle() } as CSSProperties }, node.label),
    );
  }
  const color = node.color ?? textColor(t, node.tone);
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

function textStyle(node: Extract<LeafNode, { kind: "text" }>, t: UiTheme): CSSProperties {
  return {
    fontFamily: node.mono ? t.fonts.mono : t.fonts.body,
    fontSize: TEXT_PX[node.size],
    fontWeight: node.weight === "bold" ? 700 : node.weight === "medium" ? 500 : 400,
    lineHeight: 1.3,
    ...(node.gradient === "ai" ? gradientTextStyle() : { color: textColor(t, node.tone) }),
  };
}

function bar(node: Extract<LeafNode, { kind: "bar" }>, ctx: Ctx): ReactNode {
  const { t, fx } = ctx;
  const shimmerEl = () =>
    createElement("div", {
      style: {
        width: len(node.w),
        height: node.h,
        borderRadius: 6,
        background: shimmer(t, node.lite),
        flexShrink: 0,
      } as CSSProperties,
    });
  if (!node.text) return shimmerEl();
  const textEl = () =>
    createElement(
      "div",
      { style: { fontFamily: t.fonts.body, fontSize: TEXT_PX[node.size], color: t.colors.text, lineHeight: 1.3 } as CSSProperties },
      node.text,
    );
  const r = fx.textReveal;
  if (r >= 0.999) return textEl();
  if (r <= 0.001) return shimmerEl();
  // Crossfade shimmer → text, overlaid in one grid cell.
  return createElement(
    "div",
    { style: { display: "grid" } as CSSProperties },
    createElement("div", { key: "sh", style: { gridColumn: 1, gridRow: 1, opacity: 1 - r } as CSSProperties }, shimmerEl()),
    createElement("div", { key: "tx", style: { gridColumn: 1, gridRow: 1, opacity: r } as CSSProperties }, textEl()),
  );
}

function pill(children: ReactNode, style: CSSProperties): ReactNode {
  return createElement(
    "span",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: "nowrap",
        ...style,
      } as CSSProperties,
    },
    children,
  );
}

function leaf(node: LeafNode, ctx: Ctx): ReactNode {
  const { t, fx } = ctx;
  switch (node.kind) {
    case "bar":
      return bar(node, ctx);
    case "text":
      return createElement("div", { style: textStyle(node, t) }, node.value);
    case "badge":
      return badge(node, t);
    case "dot": {
      const accent = node.color ?? t.colors.accent;
      const solid = !node.initials && node.size <= 16;
      const ai = node.gradient === "ai";
      return createElement(
        "div",
        {
          style: {
            width: node.size,
            height: node.size,
            borderRadius: "50%",
            background: ai ? AI_GRADIENT : solid ? accent : withAlpha(accent, 0.16),
            color: ai ? "#fff" : accent,
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
    }
    case "icon":
      return renderIcon(node.name, node.color ?? textColor(t, node.tone));
    case "sparkle":
      return renderSparkle(node.size, node.color);
    case "vector":
      return renderVector(node, t);
    case "image":
      return createElement("img", {
        src: node.src,
        alt: node.alt ?? "",
        style: {
          width: node.w !== undefined ? len(node.w) : undefined,
          height: node.h !== undefined ? len(node.h) : undefined,
          maxWidth: "100%",
          objectFit: node.fit,
          borderRadius: node.radius || undefined,
          display: "block",
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
        createElement("div", { style: { width: 16, height: 16, borderRadius: "50%", background: "#fff" } as CSSProperties }),
      );
    case "count":
      return createElement(
        "div",
        { style: { fontFamily: t.fonts.display, fontSize: TEXT_PX.metric, color: t.colors.text, lineHeight: 1 } as CSSProperties },
        `${node.prefix ?? ""}${Math.round(node.to * fx.textReveal)}${node.suffix ?? ""}`,
      );
    case "divider":
      return createElement("div", { style: { height: 1, width: "100%", background: hairline(t) } as CSSProperties });
    case "button": {
      const color = node.color ?? t.colors.accent;
      const base: CSSProperties = { padding: "8px 14px", fontFamily: t.fonts.body, flexShrink: 0 };
      const variant: CSSProperties =
        node.variant === "outline"
          ? { color, background: "transparent", border: `1px solid ${color}` }
          : node.variant === "ghost"
            ? { color, background: withAlpha(color, 0.1) }
            : { color: "#fff", background: color };
      return pill(
        [node.icon ? renderIcon(node.icon, node.variant === "filled" ? "#fff" : color, 15) : null, node.label],
        { ...base, ...variant },
      );
    }
    case "checkbox":
      return createElement(
        "div",
        { style: { display: "inline-flex", alignItems: "center", gap: 8 } as CSSProperties },
        createElement(
          "div",
          {
            key: "b",
            style: {
              width: 16,
              height: 16,
              borderRadius: 4,
              flexShrink: 0,
              background: node.checked ? t.colors.accent : "transparent",
              border: `1.5px solid ${node.checked ? t.colors.accent : withAlpha(t.colors.text, 0.3)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            } as CSSProperties,
          },
          node.checked ? renderIcon("check", "#fff", 12) : null,
        ),
        node.label
          ? createElement("span", { key: "l", style: { fontFamily: t.fonts.body, fontSize: 13, color: t.colors.text } as CSSProperties }, node.label)
          : null,
      );
    case "chip": {
      const color = node.color ?? t.colors.accent;
      return pill(node.label, {
        padding: "4px 11px",
        fontSize: 12,
        fontWeight: 500,
        color: node.active ? color : t.colors.muted,
        background: node.active ? withAlpha(color, 0.12) : "transparent",
        border: `1px solid ${node.active ? withAlpha(color, 0.4) : hairline(t)}`,
        borderRadius: 999,
      });
    }
    case "tabs":
      return createElement(
        "div",
        { style: { display: "flex", gap: 20, borderBottom: `1px solid ${hairline(t)}` } as CSSProperties },
        node.items.map((label, i) =>
          createElement(
            "div",
            {
              key: i,
              style: {
                fontFamily: t.fonts.body,
                fontSize: 13,
                fontWeight: i === node.active ? 600 : 400,
                color: i === node.active ? t.colors.text : t.colors.muted,
                padding: "0 0 8px",
                borderBottom: `2px solid ${i === node.active ? t.colors.accent : "transparent"}`,
                marginBottom: -1,
              } as CSSProperties,
            },
            label,
          ),
        ),
      );
    case "search":
      return createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 34,
            padding: "0 12px",
            borderRadius: 8,
            background: withAlpha(t.colors.text, 0.04),
            border: `1px solid ${hairline(t)}`,
          } as CSSProperties,
        },
        renderIcon("search", t.colors.muted, 15),
        createElement("span", { style: { fontFamily: t.fonts.body, fontSize: 13, color: t.colors.muted } as CSSProperties }, node.placeholder),
      );
    case "field":
      return createElement(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 4 } as CSSProperties },
        createElement(
          "div",
          { key: "l", style: { fontFamily: t.fonts.mono, fontSize: 11, color: t.colors.muted, textTransform: "uppercase", letterSpacing: "0.06em" } as CSSProperties },
          node.label,
        ),
        typeof node.value === "string"
          ? createElement("div", { key: "v", style: { fontFamily: t.fonts.body, fontSize: 14, color: t.colors.text } as CSSProperties }, node.value)
          : createElement("div", { key: "v", style: { width: len(node.value.w), height: node.value.h, borderRadius: 6, background: shimmer(t, node.value.lite) } as CSSProperties }),
      );
    case "listRow":
      return listRow(node, ctx);
    default:
      return null;
  }
}

function listRow(node: Extract<LeafNode, { kind: "listRow" }>, ctx: Ctx): ReactNode {
  const { t } = ctx;
  const title = node.titleText
    ? createElement("div", { key: "t", style: { fontFamily: t.fonts.body, fontSize: 13, color: t.colors.text, fontWeight: 500 } as CSSProperties }, node.titleText)
    : createElement("div", { key: "t", style: { width: len(node.title ?? "52%"), height: 9, borderRadius: 5, background: shimmer(t, false) } as CSSProperties });
  const sub = node.subText
    ? createElement(
        "div",
        {
          key: "s",
          style: { fontFamily: t.fonts.body, fontSize: 12, color: t.colors.muted, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as CSSProperties,
        },
        node.subText,
      )
    : node.sub
      ? createElement("div", { key: "s", style: { width: len(node.sub), height: 7, borderRadius: 5, background: shimmer(t, true) } as CSSProperties })
      : null;
  return createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 10,
        background: node.active ? withAlpha(t.colors.accent, 0.08) : "transparent",
      } as CSSProperties,
    },
    node.avatar
      ? createElement("div", { key: "a", style: { width: 30, height: 30, borderRadius: "50%", background: withAlpha(t.colors.accent, 0.14), flexShrink: 0 } as CSSProperties })
      : null,
    createElement("div", { key: "b", style: { display: "flex", flexDirection: "column", gap: 5, flex: "1 1 0", minWidth: 0 } as CSSProperties }, title, sub),
    node.badge ? badge({ kind: "badge", label: node.badge, tone: "ai" }, t) : null,
  );
}

// ── containers ───────────────────────────────────────────────────────────────

const IS_ROW = new Set(["row", "split"]);

const JUSTIFY: Record<string, CSSProperties["justifyContent"]> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
};
const ALIGN: Record<string, CSSProperties["alignItems"]> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
};

interface BoxProps {
  justify?: string;
  align?: string;
  bg?: string;
  border?: boolean | string;
  radius?: number;
  shadow?: boolean | "sm" | "md" | "lg";
}

function containerStyle(node: Extract<UiNode, { children: UiNode[] }> & BoxProps, t: UiTheme): CSSProperties {
  const boxed = node.kind === "card" || node.kind === "panel";
  const row = IS_ROW.has(node.kind);
  const style: CSSProperties = {
    display: "flex",
    flexDirection: row ? "row" : "column",
    gap: node.gap ?? 10,
    // Rows centre their items by default; columns stretch. Main axis packs at
    // start unless asked — never space-between by surprise.
    alignItems: node.align ? ALIGN[node.align] : row ? "center" : "stretch",
    justifyContent: node.justify ? JUSTIFY[node.justify] : "flex-start",
    ...(node.w !== undefined ? { width: len(node.w), flexShrink: 0 } : {}),
    ...(boxed
      ? {
          background: t.colors.surface,
          border: `1px solid ${hairline(t)}`,
          borderRadius: 14,
          padding: node.pad ?? 16,
          boxShadow: SHADOWS.md,
        }
      : node.pad !== undefined
        ? { padding: node.pad }
        : {}),
  };
  // The open `box` styling — any container becomes a styled surface. Overrides the boxed defaults.
  if (node.bg !== undefined) style.background = resolveColor(t, node.bg);
  if (node.border !== undefined)
    style.border = node.border === true ? `1px solid ${hairline(t)}` : node.border ? `1px solid ${resolveColor(t, node.border)}` : "none";
  if (node.radius !== undefined) style.borderRadius = node.radius;
  if (node.shadow !== undefined) style.boxShadow = node.shadow === false ? "none" : SHADOWS[node.shadow === true ? "md" : node.shadow];
  return style;
}

function hasWidth(node: UiNode): boolean {
  return "w" in node && node.w !== undefined;
}

/** Render one node at `path`; leaves animate through the injected Anim, containers are plain layout. */
function renderNode(node: UiNode, path: string, ctx: Ctx, Anim: AnimLike): ReactNode {
  const st = stateStyle(node, ctx.fx);
  if (!st.render) return null;

  if (isContainer(node)) {
    const isRow = IS_ROW.has(node.kind);
    const children = node.children.map((child, i) => {
      const el = renderNode(child, `${path}.${i}`, ctx, Anim);
      if (el === null) return null;
      // Only `split` panes fill the axis; ordinary row items size to their
      // content (no auto space-between) and never shrink below it (no overlap).
      let style: CSSProperties;
      if (node.kind === "split" && !hasWidth(child)) style = { flex: "1 1 0", minWidth: 0 };
      else if (isRow) style = { flexShrink: 0, minWidth: 0 };
      else style = { minWidth: 0 };
      return createElement("div", { key: i, style }, el);
    });
    const style = { ...containerStyle(node, ctx.t), ...(st.style ?? {}) };
    return createElement("div", { style }, children);
  }

  let content = leaf(node, ctx);
  if (st.style) content = createElement("div", { style: st.style }, content);
  return createElement(Anim as ComponentType<Record<string, unknown>>, { target: path, as: "div", style: { minWidth: 0 } }, content);
}

// ── chrome ───────────────────────────────────────────────────────────────────

const TRAFFIC = ["#ff5f57", "#febc2e", "#28c840"];

function chromeShell(children: ReactNode[], t: UiTheme): ReactNode {
  return createElement(
    "div",
    {
      style: {
        width: "100%",
        background: t.colors.surface,
        border: `1px solid ${hairline(t)}`,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 22px 60px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
      } as CSSProperties,
    },
    children,
  );
}

function iconButton(name: string, t: UiTheme, active = false): ReactNode {
  return createElement(
    "div",
    {
      style: {
        width: 36,
        height: 36,
        borderRadius: 9,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? withAlpha(t.colors.accent, 0.14) : "transparent",
      } as CSSProperties,
    },
    renderIcon(name, active ? t.colors.accent : t.colors.muted, 18),
  );
}

function renderChrome(scene: UiSceneProps, t: UiTheme, content: ReactNode): ReactNode {
  const dots = createElement(
    "div",
    { style: { display: "flex", gap: 8 } as CSSProperties },
    TRAFFIC.map((c, i) => createElement("div", { key: i, style: { width: 11, height: 11, borderRadius: "50%", background: c } as CSSProperties })),
  );
  const titleEl = scene.title
    ? createElement("div", { style: { fontFamily: t.fonts.body, fontSize: 13, fontWeight: 600, color: t.colors.text } as CSSProperties }, scene.title)
    : null;

  if (scene.chrome === "window") {
    const bar = createElement(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 12, padding: "11px 15px", borderBottom: `1px solid ${hairline(t)}` } as CSSProperties },
      dots,
      scene.title
        ? createElement("div", { style: { fontFamily: t.fonts.mono, fontSize: 12, color: t.colors.muted } as CSSProperties }, scene.title)
        : null,
    );
    const body = createElement("div", { style: { padding: 20 } as CSSProperties }, content);
    return chromeShell([bar, body], t);
  }

  // app: top bar + left nav rail + main content.
  const topbar = createElement(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 12, height: 50, padding: "0 16px", borderBottom: `1px solid ${hairline(t)}` } as CSSProperties },
    createElement("div", { key: "brand", style: { display: "flex", alignItems: "center", gap: 10 } as CSSProperties }, dots, titleEl),
    createElement("div", { key: "sp", style: { flex: "1 1 0" } as CSSProperties }),
    leaf({ kind: "search", placeholder: "Search" } as LeafNode, { t, fx: { current: "", prev: null, blend: 1, textReveal: 1 } }),
    iconButton("bell", t),
    createElement("div", { key: "av", style: { width: 28, height: 28, borderRadius: "50%", background: withAlpha(t.colors.accent, 0.16) } as CSSProperties }),
  );
  const rail = createElement(
    "div",
    { style: { width: 60, borderRight: `1px solid ${hairline(t)}`, padding: "14px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 } as CSSProperties },
    ["mail", "calendar", "user", "clock", "settings"].map((n, i) => createElement("div", { key: i }, iconButton(n, t, i === 0))),
  );
  const main = createElement("div", { style: { flex: "1 1 0", minWidth: 0, padding: 20 } as CSSProperties }, content);
  const body = createElement("div", { style: { display: "flex", alignItems: "stretch" } as CSSProperties }, rail, main);
  return chromeShell([topbar, body], t);
}

// ── camera ───────────────────────────────────────────────────────────────────

interface Cam {
  scale: number;
  x: number;
  y: number;
  dim: number;
}
const NO_CAM: Cam = { scale: 1, x: 0, y: 0, dim: 0 };

function focusOf(states: State[], id: string | null): Cam {
  const f = id !== null ? states.find((s) => s.id === id)?.focus : undefined;
  return f ? { scale: f.scale, x: f.x, y: f.y, dim: f.dim } : NO_CAM;
}

/** The camera eases from the previous state's focus to the current one. */
function cameraAt(states: State[], fx: StateFx): Cam {
  const a = focusOf(states, fx.prev);
  const b = focusOf(states, fx.current);
  const l = (x: number, y: number) => x + (y - x) * fx.blend;
  return { scale: l(a.scale, b.scale), x: l(a.x, b.x), y: l(a.y, b.y), dim: l(a.dim, b.dim) };
}

// ── scene ────────────────────────────────────────────────────────────────────

/**
 * The `ui-scene` view. The host block wraps this in the scene frame and injects
 * the Anim component + current scene time; everything else is derived from the
 * node tree. `sceneTime` defaults to Infinity → the terminal (loaded) state.
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
  const fx = computeFx(scene.states, t, scene.transition, scene.transitionMs);
  const ctx: Ctx = { t: theme, fx };

  const content = renderNode(scene.root, "0", ctx, Anim);

  let mock: ReactNode;
  if (scene.chrome === "none") {
    // A root with its own width (a card) is centred; a width-less container is
    // stretched to the design width so `flex:1` panes resolve.
    const mockStyle: CSSProperties = hasWidth(scene.root)
      ? { maxWidth: "100%" }
      : { width: props.width ?? 900, maxWidth: "100%" };
    mock = createElement("div", { key: "mock", style: mockStyle }, content);
  } else {
    mock = createElement(
      "div",
      { key: "mock", style: { width: props.width ? props.width + 120 : 1000, maxWidth: "100%" } as CSSProperties },
      renderChrome(scene, theme, content),
    );
  }

  // Camera: the whole mock eases scale/pan between per-state `focus`. `dim` is a
  // vignette BEHIND the mock (darkens the surround, keeps the focus crisp).
  // Deterministic — no measuring.
  const cam = cameraAt(scene.states, fx);
  const moved = cam.scale !== 1 || cam.x !== 0 || cam.y !== 0;
  const staged = createElement(
    "div",
    {
      key: "stage",
      style: {
        position: "relative",
        zIndex: 1,
        display: "flex",
        justifyContent: "center",
        width: "100%",
        ...(moved ? { transform: `translate(${cam.x}%, ${cam.y}%) scale(${cam.scale})`, transformOrigin: "center center" } : {}),
      } as CSSProperties,
    },
    mock,
  );

  // Only scenes that actually use the camera fill the whole frame (for the
  // full-bleed vignette + zoom). Everything else keeps the plain centred layout,
  // so non-camera scenes — and their goldens — are byte-identical.
  const usesCamera = scene.states.some((s) => s.focus);
  const outerStyle: CSSProperties = usesCamera
    ? { position: "absolute", inset: 0, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }
    : { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" };

  return createElement(
    "div",
    { style: outerStyle },
    cam.dim > 0.001
      ? createElement("div", { key: "dim", style: { position: "absolute", inset: 0, background: `rgba(10,12,20,${cam.dim})`, pointerEvents: "none", zIndex: 0 } as CSSProperties })
      : null,
    staged,
    scene.caption
      ? createElement(
          Anim as ComponentType<Record<string, unknown>>,
          {
            key: "caption",
            target: "caption",
            as: "div",
            style: { position: "relative", zIndex: 1, marginTop: 22, fontFamily: theme.fonts.mono, fontSize: 12, letterSpacing: "0.04em", color: theme.colors.muted, textAlign: "center" } as CSSProperties,
          },
          scene.caption,
        )
      : null,
  );
}
