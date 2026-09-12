import { useEffect, useRef } from 'react'
import { Reveal, MaskLine } from './Reveal'
import { Marquee } from './Marquee'
import { stack, techMeta, coreTech } from '../data/content'
import { useT } from '../i18n/i18n'

const marquee = ['React', 'TypeScript', 'Python', 'Django', 'PostgreSQL', 'Vite', 'Tailwind', 'Electron', 'REST API', 'Supabase']

export function Tech() {
  const t = useT()
  const sectionRef = useRef<HTMLElement>(null)

  // On touch devices there is no hover, so the violet meta labels would stay
  // hidden. Reveal them in a staggered cascade once the section scrolls in.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-in')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          // Reveal when in view, or when already scrolled past (anchor jump).
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            el.classList.add('is-in')
            io.disconnect()
          }
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id="tech" className="section tech" ref={sectionRef}>
      <div className="shell">
        <div className="tech__head">
          <Reveal>
            <span className="tag">{t.tech.tag}</span>
          </Reveal>
          <h2 className="display-2 tech__title">
            <MaskLine>{t.tech.t1}</MaskLine>
            <MaskLine delay={0.06}>
              <span className="c-violet">{t.tech.t2}</span>
            </MaskLine>
          </h2>
          <Reveal delay={0.1}>
            <span className="tech__legend meta">
              <i className="tech__legend-dot" aria-hidden /> {t.tech.core}
            </span>
          </Reveal>
        </div>
      </div>

      <div className="tech__marquee">
        <Marquee speed={40}>
          {marquee.map((t) => (
            <span key={t} className="tech__ticker">
              {t} <em>✦</em>
            </span>
          ))}
        </Marquee>
      </div>

      <div className="shell">
        <div className="tech__groups">
          {stack.map((g) => (
            <Reveal key={g.group} className="tech__group">
              <span className="meta tech__gname">{t.tech.groups[g.group]}</span>
              <ul className="tech__items">
                {g.items.map((it, i) => (
                  <li
                    key={it}
                    className={`tech__item ${coreTech.has(it) ? 'is-core' : ''}`}
                    data-cursor="link"
                    style={{ '--i': i } as React.CSSProperties}
                  >
                    <span className="tech__itemname">{it}</span>
                    {techMeta[it] && <span className="tech__itemmeta">{techMeta[it]}</span>}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
