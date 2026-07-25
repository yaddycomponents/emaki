import type { FC } from 'react'
import { Composition } from 'remotion'
import { ASPECT_DIMENSIONS, type Deck } from '@emaki/schema'
import { DeckVideo } from './Deck'
import { deckFrames, FPS } from './timing'

/** A tiny valid deck so the studio/preview has something to show by default. */
const FALLBACK_DECK: Deck = {
  version: 1,
  title: 'Emaki',
  aspect: '9:16',
  theme: 'warm-editorial',
  wordsPerSecond: 2.2,
  scenes: [
    { id: 'open', type: 'title', props: { kicker: 'Emaki', text: 'Films from a JSON file.' } },
    { id: 'proof', type: 'stat', props: { value: '30s', label: 'vertical film' } },
  ],
}

export const RemotionRoot: FC = () => {
  return (
    <Composition
      id="deck"
      component={DeckVideo}
      durationInFrames={300}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ deck: FALLBACK_DECK }}
      calculateMetadata={({ props }) => {
        const deck = props.deck
        const dim = ASPECT_DIMENSIONS[deck.aspect]
        return {
          durationInFrames: Math.max(1, deckFrames(deck, FPS)),
          fps: FPS,
          width: dim.width,
          height: dim.height,
        }
      }}
    />
  )
}
