import type { Timeline } from "@emaki/core";
import type { UiMockProps } from "@emaki/schema";
import type { CSSProperties, FC } from "react";
import { useAnim } from "../engine";
import { useStyles, useTheme } from "../theme";

export const uiMockTimeline: Timeline = [
  { target: "card", preset: "popIn", at: 0, params: { fromScale: 0.9 } },
  { target: "body", preset: "fadeUp", at: 0.3 },
  { target: "caption", preset: "fadeUp", at: 0.5 },
];

const dot = (color: string): CSSProperties => ({
  width: "0.8em",
  height: "0.8em",
  borderRadius: "50%",
  background: color,
});

const Card: FC<UiMockProps> = ({ app, lines }) => {
  const A = useAnim();
  const t = useTheme();
  const skeleton = "rgba(0,0,0,0.06)";
  return (
    <A
      target="card"
      as="div"
      style={{
        background: t.colors.surface,
        border: `1px solid rgba(0,0,0,0.08)`,
        borderRadius: 16,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 18px 50px rgba(0,0,0,0.10)",
        overflow: "hidden",
        width: "100%",
        fontFamily: t.fonts.body,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6em",
          padding: "1em 1.2em",
          borderBottom: `1px solid rgba(0,0,0,0.06)`,
        }}
      >
        <div style={dot("#e0484d")} />
        <div style={dot("#e5c07a")} />
        <div style={dot("#17935f")} />
        {app ? (
          <div
            style={{
              marginLeft: "0.8em",
              fontFamily: t.fonts.mono,
              fontSize: t.type.label,
              color: t.colors.muted,
            }}
          >
            {app}
          </div>
        ) : null}
      </div>
      <div
        style={{
          padding: "1.6em 1.6em",
          display: "flex",
          flexDirection: "column",
          gap: "1em",
        }}
      >
        {(lines ?? ["", "", ""]).map((line, i) =>
          line ? (
            <div
              key={i}
              style={{ fontSize: t.type.body, color: t.colors.text }}
            >
              {line}
            </div>
          ) : (
            <div
              key={i}
              style={{
                height: "0.9em",
                width: `${90 - i * 18}%`,
                background: skeleton,
                borderRadius: 6,
              }}
            />
          ),
        )}
      </div>
    </A>
  );
};

const Content: FC<UiMockProps> = (p) => {
  const A = useAnim();
  const s = useStyles();
  return (
    <>
      <A
        target="body"
        as="div"
        style={{ display: "flex", justifyContent: "center" }}
      >
        <div style={{ width: "100%", maxWidth: 720 }}>
          <Card {...p} />
        </div>
      </A>
      {p.title ? (
        <A
          target="caption"
          as="div"
          style={{
            ...s.eyebrow,
            marginTop: "1.4em",
            marginBottom: 0,
            textAlign: "center",
          }}
        >
          {p.title}
        </A>
      ) : null}
    </>
  );
};

export const UiMock16x9: FC<UiMockProps> = (p) => {
  const s = useStyles();
  return (
    <div style={s.frame({ justifyContent: "center" })}>
      <Content {...p} />
    </div>
  );
};

export const UiMock9x16: FC<UiMockProps> = (p) => {
  const s = useStyles();
  return (
    <div style={s.frame({ padding: "10% 8%", justifyContent: "center" })}>
      <Content {...p} />
    </div>
  );
};
