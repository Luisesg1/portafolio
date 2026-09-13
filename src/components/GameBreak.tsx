import { Reveal } from './Reveal'
import { useT } from '../i18n/i18n'
import './GameBreak.css'

/**
 * A light playful interlude before the contact CTA — invites visitors to the
 * hidden "Catch Tito" mini-game. Deliberately a plain band (not a numbered
 * <section>) so it stays out of the nav / HUD section index and never competes
 * with the project work above it.
 */
export function GameBreak() {
  const t = useT()
  return (
    <aside id="play" className="game-break" aria-label={t.game.title}>
      <div className="shell game-break__inner">
        <Reveal>
          <span className="tag game-break__eyebrow">✦ {t.game.breakEyebrow}</span>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="game-break__title">
            {t.game.breakT1} <span className="c-violet">{t.game.breakT2}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="game-break__lead">{t.game.breakLead}</p>
        </Reveal>
        <Reveal delay={0.16}>
          <button
            className="game-break__cta"
            onClick={() => window.dispatchEvent(new Event('game:open'))}
            data-cursor="link"
          >
            {t.game.breakCta} <span aria-hidden>→</span>
          </button>
        </Reveal>
      </div>
    </aside>
  )
}
