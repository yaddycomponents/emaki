import type { Timeline } from "@emaki/core";
import type { StatProps } from "@emaki/schema";
import type { FC } from "react";
import { useAnim } from "../engine";
import { useStyles } from "../theme";

export const statTimeline: Timeline = [
  { target: "value", preset: "popIn", at: 0 },
  { target: "label", preset: "fadeUp", at: 0.35 },
  { target: "caption", preset: "fadeUp", at: 0.5 },
];

const Content: FC<StatProps & { valueSize?: string }> = ({
  value,
  label,
  caption,
  valueSize,
}) => {
  const A = useAnim();
  const s = useStyles();
  return (
    <>
      <A
        target="value"
        as="div"
        style={{
          ...s.statValue,
          ...(valueSize ? { fontSize: valueSize } : {}),
        }}
      >
        {value}
      </A>
      <A
        target="label"
        as="div"
        style={{ ...s.eyebrow, marginTop: "0.4em", marginBottom: 0 }}
      >
        {label}
      </A>
      {caption ? (
        <A
          target="caption"
          as="div"
          style={{ ...s.rowLabel, marginTop: "0.8em", maxWidth: "20em" }}
        >
          {caption}
        </A>
      ) : null}
    </>
  );
};

export const Stat16x9: FC<StatProps> = (p) => {
  const s = useStyles();
  return (
    <div style={s.frame()}>
      <Content {...p} />
    </div>
  );
};

export const Stat9x16: FC<StatProps> = (p) => {
  const s = useStyles();
  return (
    <div style={s.frame({ padding: "14% 8%" })}>
      <Content {...p} valueSize="clamp(64px, 20vw, 180px)" />
    </div>
  );
};
