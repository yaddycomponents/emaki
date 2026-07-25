import { warmEditorial as t } from "@emaki/core";
import type { CSSProperties } from "react";

/** Full-bleed scene surface, centred content. */
export function frame(extra: CSSProperties = {}): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: t.colors.bg,
    color: t.colors.text,
    fontFamily: t.fonts.body,
    padding: "8%",
    ...extra,
  };
}

export const eyebrow: CSSProperties = {
  fontFamily: t.fonts.mono,
  fontSize: t.type.eyebrow,
  letterSpacing: t.track.eyebrow,
  textTransform: "uppercase",
  color: t.colors.muted,
  marginBottom: "0.8em",
};

export const display: CSSProperties = {
  fontFamily: t.fonts.display,
  fontSize: t.type.display,
  lineHeight: 1.02,
  fontWeight: 400,
};

export const statement: CSSProperties = {
  fontFamily: t.fonts.display,
  fontSize: t.type.statement,
  lineHeight: 1.1,
};

export const statValue: CSSProperties = {
  fontFamily: t.fonts.display,
  fontSize: t.type.stat,
  lineHeight: 1,
  color: t.colors.text,
};

export const rowLabel: CSSProperties = {
  fontFamily: t.fonts.mono,
  fontSize: t.type.rowLabel,
  color: t.colors.muted,
};

/** A masked wrapper so `maskReveal` (translateY %) reads as text sliding up. */
export const mask: CSSProperties = { overflow: "hidden", display: "block" };

export const tokens = t;
