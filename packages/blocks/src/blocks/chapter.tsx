import type { Timeline } from "@emaki/core";
import type { ChapterProps } from "@emaki/schema";
import type { FC } from "react";
import { useAnim } from "../engine";
import { useStyles, useTheme } from "../theme";

export const chapterTimeline: Timeline = [
  { target: "number", preset: "fadeUp", at: 0 },
  { target: "title", preset: "maskReveal", at: 0.15 },
];

const Content: FC<ChapterProps & { titleSize?: string }> = ({
  number,
  title,
  titleSize,
}) => {
  const A = useAnim();
  const s = useStyles();
  const t = useTheme();
  return (
    <>
      {number ? (
        <A
          target="number"
          as="div"
          style={{ ...s.eyebrow, color: t.colors.accent }}
        >
          {number}
        </A>
      ) : null}
      <div style={s.mask}>
        <A
          target="title"
          as="h2"
          style={{
            fontFamily: t.fonts.display,
            fontSize: titleSize ?? t.type.chapter,
            lineHeight: 1.05,
          }}
        >
          {title}
        </A>
      </div>
    </>
  );
};

export const Chapter16x9: FC<ChapterProps> = (p) => {
  const s = useStyles();
  return (
    <div style={s.frame()}>
      <Content {...p} />
    </div>
  );
};

export const Chapter9x16: FC<ChapterProps> = (p) => {
  const s = useStyles();
  return (
    <div style={s.frame({ padding: "12% 8%" })}>
      <Content {...p} titleSize="clamp(44px, 11vw, 116px)" />
    </div>
  );
};
