import type { Timeline } from "@emaki/core";
import type { CompareBarsProps } from "@emaki/schema";
import type { CSSProperties, FC } from "react";
import { useAnim } from "../engine";
import { useStyles, useTheme } from "../theme";

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
  background: "rgba(0,0,0,0.06)",
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
  const t = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.8em" }}>
      <div style={{ ...track, flex: 1, width: `${(value / max) * 100}%` }}>
        <A target={target} as="div" style={bar(color)}>
          {""}
        </A>
      </div>
      <div
        style={{
          fontFamily: t.fonts.mono,
          fontSize: t.type.metric,
          color: numColor,
          minWidth: "3em",
        }}
      >
        {value}
        {unit ?? ""}
      </div>
    </div>
  );
}

const Rows: FC<CompareBarsProps & { stacked?: boolean }> = ({
  title,
  unit,
  rows,
  stacked,
}) => {
  const A = useAnim();
  const s = useStyles();
  const t = useTheme();
  const max = maxValue(rows);
  const pair = (r: CompareBarsProps["rows"][number], i: number) => (
    <>
      <Bar
        target="bar-before"
        value={r.before}
        max={max}
        unit={unit}
        color={t.data.beforeBar}
        numColor={t.data.beforeNum}
      />
      <Bar
        target="bar-after"
        value={r.after}
        max={max}
        unit={unit}
        color={t.data.afterBar}
        numColor={t.data.afterNum}
      />
    </>
  );
  return (
    <>
      {title ? (
        <A target="title" as="div" style={s.eyebrow}>
          {title}
        </A>
      ) : null}
      <A
        target="rows"
        as="div"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: stacked ? "2em" : "1.6em",
          marginTop: "1em",
        }}
      >
        {rows.map((r, i) =>
          stacked ? (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", gap: "0.7em" }}
            >
              <div style={s.rowLabel}>{r.label}</div>
              {pair(r, i)}
            </div>
          ) : (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "10em 1fr",
                alignItems: "center",
                gap: "1em",
              }}
            >
              <div style={s.rowLabel}>{r.label}</div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5em",
                }}
              >
                {pair(r, i)}
              </div>
            </div>
          ),
        )}
      </A>
    </>
  );
};

export const CompareBars16x9: FC<CompareBarsProps> = (p) => {
  const s = useStyles();
  return (
    <div style={s.frame()}>
      <Rows {...p} />
    </div>
  );
};

export const CompareBars9x16: FC<CompareBarsProps> = (p) => {
  const s = useStyles();
  return (
    <div style={s.frame({ padding: "12% 8%" })}>
      <Rows {...p} stacked />
    </div>
  );
};
