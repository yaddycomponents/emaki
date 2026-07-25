import type { Timeline } from "@emaki/core";
import type { StatementProps } from "@emaki/schema";
import type { FC } from "react";
import { useAnim } from "../engine";
import { useStyles, useTheme } from "../theme";

export const statementTimeline: Timeline = [
  { target: "text", preset: "maskReveal", at: 0 },
];

/** Wrap emphasised substrings in the theme accent colour. */
function render(text: string, accent: string, emphasis?: string[]) {
  if (!emphasis || emphasis.length === 0) return text;
  const escaped = emphasis.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "g"));
  return parts.map((part, i) =>
    emphasis.includes(part) ? (
      <span key={i} style={{ color: accent }}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

const Body: FC<StatementProps & { fontSize?: string }> = ({
  text,
  emphasis,
  fontSize,
}) => {
  const A = useAnim();
  const s = useStyles();
  const theme = useTheme();
  return (
    <div style={s.mask}>
      <A
        target="text"
        as="p"
        style={{ ...s.statement, ...(fontSize ? { fontSize } : {}) }}
      >
        {render(text, theme.colors.accent, emphasis)}
      </A>
    </div>
  );
};

export const Statement16x9: FC<StatementProps> = (p) => {
  const s = useStyles();
  return (
    <div style={s.frame()}>
      <Body {...p} />
    </div>
  );
};

export const Statement9x16: FC<StatementProps> = (p) => {
  const s = useStyles();
  return (
    <div style={s.frame({ padding: "14% 8%" })}>
      <Body {...p} fontSize="clamp(40px, 10vw, 104px)" />
    </div>
  );
};
