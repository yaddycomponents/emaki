import type { Timeline } from "@emaki/core";
import type { CompareBarsProps } from "@emaki/schema";
import type { CSSProperties, FC } from "react";
import { useAnim } from "../engine";
import { eyebrow, frame, rowLabel, tokens } from "../styles";

// One timeline, all layouts. Bars stay horizontal in every aspect so the same
// `growX` steps drive both the 16:9 table and the 9:16 stack.
export const compareBarsTimeline: Timeline = [
  { target: "title", preset: "fadeUp", at: 0 },
  { target: "rows", preset: "fadeUp", at: 0.1 },
  { target: "bar-before", preset: "growX", at: 0.3 },
  { target: "bar-after", preset: "growX", at: 0.5 },
];

function maxValue(rows: CompareBarsProps["rows"]): number {
  return Math.max(1, ...rows.flatMap((r) => [r.before, r.after]));
}

const track: CSSProperties = {
  position: "relative",
  height: "0.7em",
  background: "rgba(94,59,70,0.08)",
  borderRadius: 4,
};

function bar(color: string): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    background: color,
    borderRadius: 4,
    transformOrigin: "left center",
  };
}

const num: CSSProperties = {
  fontFamily: tokens.fonts.mono,
  fontSize: tokens.type.metric,
};

function Bar({
  target,
  value,
  max,
  unit,
  color,
  numColor,
}: {
  target: string;
  value: number;
  max: number;
  unit?: string;
  color: string;
  numColor: string;
}) {
  const A = useAnim();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.8em" }}>
      <div style={{ ...track, flex: 1, width: `${(value / max) * 100}%` }}>
        <A target={target} as="div" style={bar(color)}>
          {""}
        </A>
      </div>
      <div style={{ ...num, color: numColor, minWidth: "3em" }}>
        {value}
        {unit ?? ""}
      </div>
    </div>
  );
}

export const CompareBars16x9: FC<CompareBarsProps> = ({
  title,
  unit,
  rows,
}) => {
  const A = useAnim();
  const max = maxValue(rows);
  return (
    <div style={frame()}>
      {title ? (
        <A target="title" as="div" style={eyebrow}>
          {title}
        </A>
      ) : null}
      <A
        target="rows"
        as="div"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.6em",
          marginTop: "1em",
        }}
      >
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "10em 1fr",
              alignItems: "center",
              gap: "1em",
            }}
          >
            <div style={rowLabel}>{r.label}</div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}
            >
              <Bar
                target="bar-before"
                value={r.before}
                max={max}
                unit={unit}
                color={tokens.data.beforeBar}
                numColor={tokens.data.beforeNum}
              />
              <Bar
                target="bar-after"
                value={r.after}
                max={max}
                unit={unit}
                color={tokens.data.afterBar}
                numColor={tokens.data.afterNum}
              />
            </div>
          </div>
        ))}
      </A>
    </div>
  );
};

export const CompareBars9x16: FC<CompareBarsProps> = ({
  title,
  unit,
  rows,
}) => {
  const A = useAnim();
  const max = maxValue(rows);
  return (
    <div style={frame({ padding: "12% 8%" })}>
      {title ? (
        <A target="title" as="div" style={eyebrow}>
          {title}
        </A>
      ) : null}
      <A
        target="rows"
        as="div"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2em",
          marginTop: "1em",
        }}
      >
        {rows.map((r, i) => (
          <div
            key={i}
            style={{ display: "flex", flexDirection: "column", gap: "0.7em" }}
          >
            <div style={rowLabel}>{r.label}</div>
            <Bar
              target="bar-before"
              value={r.before}
              max={max}
              unit={unit}
              color={tokens.data.beforeBar}
              numColor={tokens.data.beforeNum}
            />
            <Bar
              target="bar-after"
              value={r.after}
              max={max}
              unit={unit}
              color={tokens.data.afterBar}
              numColor={tokens.data.afterNum}
            />
          </div>
        ))}
      </A>
    </div>
  );
};
