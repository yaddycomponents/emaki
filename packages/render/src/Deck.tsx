import type { FC } from 'react'
import { AbsoluteFill, Series } from 'remotion'
import { AnimContext, Block, ThemeProvider } from '@emaki/blocks'
import { resolveTheme } from '@emaki/themes'
import type { Deck } from '@emaki/schema'
import { RemotionAnim } from './RemotionAnim'
import { sceneFrameList, FPS } from './timing'

/**
 * The whole deck as a Remotion composition: scenes played back-to-back in a
 * Series, each in its own Sequence so its timeline restarts at frame 0. The
 * RemotionAnim animator is injected once at the root.
 */
export const DeckVideo: FC<{ deck: Deck }> = ({ deck }) => {
  const frames = sceneFrameList(deck, FPS)
  const theme = resolveTheme(deck.theme)
  return (
    <ThemeProvider theme={theme}>
      <AnimContext.Provider value={RemotionAnim}>
        <AbsoluteFill style={{ background: theme.colors.bg }}>
          <Series>
            {deck.scenes.map((scene, i) => (
              <Series.Sequence key={scene.id} durationInFrames={frames[i]!}>
                <Block scene={scene} aspect={deck.aspect} />
              </Series.Sequence>
            ))}
          </Series>
        </AbsoluteFill>
      </AnimContext.Provider>
    </ThemeProvider>
  )
}
