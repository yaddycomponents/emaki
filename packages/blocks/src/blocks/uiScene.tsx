import type { Timeline } from "@emaki/core";
import type { UiSceneProps } from "@emaki/schema";
import { uiSceneTimeline, UiSceneView } from "@emaki/ui/render";
import type { FC } from "react";
import { useAnim, useSceneTime } from "../engine";
import { useStyles, useTheme } from "../theme";

/**
 * The `ui-scene` block. Unlike the other blocks it has no static timeline — the
 * timeline is derived from the node tree per props. `Block` calls this via
 * `timelineFor` and feeds the result into TimelineContext, so the same Anim
 * components animate the mock.
 */
export function uiSceneTimelineFor(props: UiSceneProps): Timeline {
  return uiSceneTimeline(props);
}

const Content: FC<UiSceneProps & { width: number }> = ({ width, ...props }) => {
  const Anim = useAnim();
  const theme = useTheme();
  const sceneTime = useSceneTime();
  return (
    <UiSceneView
      props={props}
      Anim={Anim}
      theme={theme}
      sceneTime={sceneTime}
      width={width}
    />
  );
};

export const UiScene16x9: FC<UiSceneProps> = (p) => {
  const s = useStyles();
  return (
    <div style={s.frame({ justifyContent: "center", padding: "6%" })}>
      <Content {...p} width={1120} />
    </div>
  );
};

export const UiScene9x16: FC<UiSceneProps> = (p) => {
  const s = useStyles();
  return (
    <div style={s.frame({ justifyContent: "center", padding: "7% 5%" })}>
      <Content {...p} width={920} />
    </div>
  );
};
