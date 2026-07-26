import { useStudio, TEMPLATE_DECKS } from '../store'
import { SAMPLE_DECK } from '../sample'
import { ChromeToggle } from '../components/ChromeToggle'
import s from './FirstRun.module.css'

export function FirstRun() {
  const setView = useStudio((x) => x.setView)
  const openDeck = useStudio((x) => x.openDeck)

  return (
    <div className={s.screen}>
      <header className={s.top}>
        <div className={s.mark}>e</div>
        <span className={s.noDeck}>no deck open</span>
        <div className={s.spacer} />
        <span className={s.build}>emaki v0.6.2 · localhost:5273 · node 22.4</span>
        <ChromeToggle />
      </header>

      <div className={s.body}>
        <div className={s.left}>
          <div className={s.inner}>
          <div className={s.eyebrow}>Emaki Studio</div>
          <h1 className={s.h1}>Turn build output into a film you'd actually post.</h1>
          <p className={s.sub}>
            The deck is a JSON file on disk. Render is local via Remotion. AI, when you want it, connects through your
            own MCP client — Emaki never calls a model or stores a key.
          </p>

          <div className={s.grid}>
            <button type="button" className={`${s.card} ${s.cardAccent}`} onClick={() => setView('templates')}>
              <span className={s.cardTitle}>Start from a template</span>
              <span className={s.cardBody}>Six first-party packs, each in multiple aspects.</span>
              <span className={`${s.cardCmd} ${s.cmdAccent}`}>emaki new --template release-notes</span>
            </button>

            <button
              type="button"
              className={s.card}
              onClick={() => openDeck(SAMPLE_DECK, 'emaki studio ./deck.json')}
            >
              <span className={s.cardTitle}>Open a deck.json</span>
              <span className={s.cardBody}>Point the studio at a deck you already have.</span>
              <span className={s.cardCmd}>emaki studio ./deck.json</span>
            </button>

            <div className={`${s.card} ${s.cardWide}`}>
              <div className={s.extractHead}>
                <span className={s.cardTitle}>Extract from build output</span>
                <span className={s.detected}>3 sources detected in this repo</span>
              </div>
              <div className={s.sources}>
                <button
                  type="button"
                  className={s.source}
                  onClick={() => openDeck(TEMPLATE_DECKS['bundle-diff']!, 'emaki extract rollup dist/stats.json -o deck.json')}
                >
                  <span className={s.srcName}>rollup stats</span>
                  <span className={`${s.srcMeta} ${s.fresh}`}>dist/stats.json · 2m ago</span>
                </button>
                <div className={s.source}>
                  <span className={s.srcName}>lighthouse</span>
                  <span className={s.srcMeta}>.lh/report.json · 4d ago</span>
                </div>
                <div className={s.source}>
                  <span className={s.srcName}>git log</span>
                  <span className={s.srcMeta}>v1.3.0..HEAD · 41 commits</span>
                </div>
              </div>
              <span className={s.cardCmd}>emaki extract rollup dist/stats.json -o deck.json</span>
            </div>
          </div>

          <div className={s.mcpStrip}>
            <span className={s.mcpText}>Want AI? Connect Emaki to the AI app you already use.</span>
            <code className={s.mcpCmd}>claude mcp add emaki -- emaki mcp serve</code>
            <button type="button" className={s.copy}>copy</button>
            <button type="button" className={s.secondary}>
              How MCP works
            </button>
            <button type="button" className={s.secondary} onClick={() => setView('studio')}>
              Skip into studio →
            </button>
          </div>
          </div>
        </div>

        <aside className={s.rail}>
          <div className={s.railHead}>Recent</div>
          <div className={s.recent}>
            <button type="button" className={s.recentRow} onClick={() => openDeck(TEMPLATE_DECKS['bundle-diff']!, 'emaki studio bundle-diff.deck.json')}>
              <span className={s.recentName}>bundle-diff</span>
              <span className={s.recentMeta}>~/src/site · 2m ago</span>
            </button>
            <button type="button" className={s.recentRow} onClick={() => openDeck(TEMPLATE_DECKS['release-notes']!, 'emaki studio v1.3.0.deck.json')}>
              <span className={s.recentName}>v1.3.0 release</span>
              <span className={s.recentMeta}>~/src/site · 1h ago</span>
            </button>
            <div className={s.recentRow}>
              <span className={s.recentName}>lcp-story</span>
              <span className={`${s.recentMeta} ${s.missing}`}>missing · moved or deleted</span>
            </div>
          </div>
          <div className={s.log}>
            <div>$ emaki studio</div>
            <div>ready on http://localhost:5273</div>
            <div>watching ./decks/*.deck.json</div>
            <div>remotion 4.0 · 12 workers</div>
            <div className={s.logOk}>mcp server idle · no client attached</div>
          </div>
          <div className={s.shortcuts}>⌘K palette · ⌘O open · ⌘N new</div>
        </aside>
      </div>
    </div>
  )
}
