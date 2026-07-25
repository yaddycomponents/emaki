import type { Timeline } from "@emaki/core";
import type { ListProps } from "@emaki/schema";
import type { FC } from "react";
import { useAnim } from "../engine";
import { useStyles, useTheme } from "../theme";

export const listTimeline: Timeline = [
  { target: "title", preset: "fadeUp", at: 0 },
  { target: "items", preset: "fadeUp", at: 0.15 },
];

const Content: FC<ListProps & { itemSize?: string }> = ({
  title,
  items,
  itemSize,
}) => {
  const A = useAnim();
  const s = useStyles();
  const t = useTheme();
  return (
    <>
      {title ? (
        <A target="title" as="div" style={s.eyebrow}>
          {title}
        </A>
      ) : null}
      <A
        target="items"
        as="ul"
        style={{ listStyle: "none", margin: 0, padding: 0, marginTop: "0.6em" }}
      >
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontFamily: t.fonts.display,
              fontSize: itemSize ?? t.type.h2,
              lineHeight: 1.25,
              display: "flex",
              gap: "0.5em",
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                color: t.colors.accent,
                fontFamily: t.fonts.mono,
                fontSize: "0.5em",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </A>
    </>
  );
};

export const List16x9: FC<ListProps> = (p) => {
  const s = useStyles();
  return (
    <div style={s.frame()}>
      <Content {...p} />
    </div>
  );
};

export const List9x16: FC<ListProps> = (p) => {
  const s = useStyles();
  return (
    <div style={s.frame({ padding: "12% 8%" })}>
      <Content {...p} itemSize="clamp(28px, 6vw, 60px)" />
    </div>
  );
};
