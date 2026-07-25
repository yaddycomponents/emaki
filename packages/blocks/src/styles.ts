import type { Theme } from "@emaki/themes";
import type { CSSProperties } from "react";

/** Style bundle for one theme. Blocks pull this via `useStyles()`. */
export interface Styles {
  frame: (extra?: CSSProperties) => CSSProperties;
  eyebrow: CSSProperties;
  display: CSSProperties;
  statement: CSSProperties;
  statValue: CSSProperties;
  rowLabel: CSSProperties;
  mask: CSSProperties;
}

export function makeStyles(t: Theme): Styles {
  return {
    frame: (extra = {}) => ({
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
    }),
    eyebrow: {
      fontFamily: t.fonts.mono,
      fontSize: t.type.eyebrow,
      letterSpacing: t.track.eyebrow,
      textTransform: "uppercase",
      color: t.colors.muted,
      marginBottom: "0.8em",
    },
    display: {
      fontFamily: t.fonts.display,
      fontSize: t.type.display,
      lineHeight: 1.02,
      fontWeight: 400,
    },
    statement: {
      fontFamily: t.fonts.display,
      fontSize: t.type.statement,
      lineHeight: 1.1,
    },
    statValue: {
      fontFamily: t.fonts.display,
      fontSize: t.type.stat,
      lineHeight: 1,
      color: t.colors.text,
    },
    rowLabel: {
      fontFamily: t.fonts.mono,
      fontSize: t.type.rowLabel,
      color: t.colors.muted,
    },
    mask: { overflow: "hidden", display: "block" },
  };
}
