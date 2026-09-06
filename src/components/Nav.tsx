import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useActiveSection } from '../lib/useActiveSection'
import { Magnetic } from './Magnetic'
import { Scramble } from './Scramble'
import { useI18n } from '../i18n/i18n'
import './Nav.css'

const SECTION_IDS = ['work', 'services', 'about', 'contact']

export function Nav() {
  const { t, lang, setLang } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const active = useActiveSection(SECTION_IDS)
  const lastY = useRef(0)

  const LINKS = [
    { id: 'work', label: t.nav.work },
    { id: 'services', label: t.nav.services },
    { id: 'about', label: t.nav.about },
    { id: 'contact', label: t.nav.contact },
  ]

  // mobile menu lists more sections (there's room) — page-flow order
  const MOBILE_LINKS = [
    { id: 'work', label: t.nav.work },
    { id: 'services', label: t.nav.services },
    { id: 'tech', label: t.nav.tech },
    { id: 'system', label: t.nav.system },
    { id: 'about', label: t.nav.about },
    { id: 'process', label: t.nav.process },
    { id: 'contact', label: t.nav.contact },
  ]

  const toggleLang = () => setLang(lang === 'es' ? 'en' : 'es')

  useEffect(() => {
    lastY.current = window.scrollY
    // Accepts an optional scroll position — Lenis passes its own; the native
    // event doesn't, so we fall back to window.scrollY.
    const onScroll = (arg?: { scroll?: number }) => {
      const y = typeof arg?.scroll === 'number' ? arg.scroll : window.scrollY
      setScrolled(y > 40)
      // Hide on scroll-down, reveal on scroll-up. Always show near the top.
      // A deadzone ignores momentum-settle jitter so the bar doesn't flicker.
      if (y < 90) {
        setHidden(false)
        lastY.current = y
        return
      }
      const dy = y - lastY.current
      if (Math.abs(dy) < 8) return // jitter — keep current state, don't re-anchor
      setHidden(dy > 0)
      lastY.current = y
    }
    onScroll()
    // Native scroll covers the reduced-motion / no-Lenis case. Lenis does NOT
    // emit a window 'scroll' event, so also subscribe to the Lenis instance
    // once it exists (it's created after this component mounts).
    const onNative = () => onScroll()
    window.addEventListener('scroll', onNative, { passive: true })
    let lenis: { on: (e: string, cb: (a: { scroll?: number }) => void) => void; off?: (e: string, cb: (a: { scroll?: number }) => void) => void } | null = null
    let tries = 0
    let timer = 0
    // Lenis is created by a sibling effect that runs after this one, so poll
    // briefly (via setTimeout, which — unlike rAF — is not paused off-screen).
    const attach = () => {
      const l = (window as unknown as { lenis?: typeof lenis }).lenis
      if (l && typeof l.on === 'function') {
        lenis = l
        lenis.on('scroll', onScroll)
      } else if (tries++ < 60) {
        timer = window.setTimeout(attach, 100)
      }
    }
    attach()
    return () => {
      window.removeEventListener('scroll', onNative)
      lenis?.off?.('scroll', onScroll)
      if (timer) clearTimeout(timer)
    }
  }, [])

  // lock scroll when mobile menu open — also stop Lenis, which ignores
  // body overflow and would keep the page moving behind the overlay
  useEffect(() => {
    const lenis = (window as unknown as { lenis?: { stop: () => void; start: () => void } | null }).lenis
    if (open) {
      lenis?.stop()
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      lenis?.start()
    }
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      lenis?.start()
    }
  }, [open])

  return (
    <>
      <header
        className={`nav ${scrolled ? 'is-scrolled' : ''} ${hidden && !open ? 'is-hidden' : ''}`}
      >
        <div className="nav__pill nav__pill-anim">
          <a href="#index" className="nav__brand" aria-label="Luis Eduardo — inicio">
            <span className="nav__dot" />
            Luis Eduardo
          </a>

          <nav className="nav__links" aria-label="Principal">
            {LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                className={`nav__link ${active === l.id ? 'is-active' : ''}`}
                data-cursor="link"
              >
                <Scramble text={l.label} />
              </a>
            ))}
          </nav>

          <button
            className="nav__cmdk"
            onClick={() => window.dispatchEvent(new Event('cmdk:open'))}
            data-cursor="link"
            aria-label={t.nav.menu}
            title="⌘K"
          >
            <span className="nav__cmdk-key">⌘</span>K
          </button>

          <button
            className="nav__lang"
            onClick={toggleLang}
            data-cursor="link"
            aria-label={`Switch to ${lang === 'es' ? 'English' : 'Español'}`}
          >
            <span className={lang === 'es' ? 'is-on' : ''}>ES</span>
            <span className="nav__langsep">/</span>
            <span className={lang === 'en' ? 'is-on' : ''}>EN</span>
          </button>

          <Magnetic strength={7} className="nav__ctawrap">
            <a href="#contact" className="nav__cta" data-cursor="link">
              {t.nav.cta} <span aria-hidden>→</span>
            </a>
          </Magnetic>

          <button
            className={`nav__burger ${open ? 'is-open' : ''}`}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      {open && (
        <motion.div
          className="mobilemenu"
          data-lenis-prevent
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <nav className="mobilemenu__nav">
            {MOBILE_LINKS.map((l, i) => (
              <motion.a
                key={l.id}
                href={`#${l.id}`}
                onClick={() => setOpen(false)}
                className="mobilemenu__link"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="mobilemenu__num">0{i + 1}</span>
                {l.label}
              </motion.a>
            ))}
          </nav>
          <div className="mobilemenu__foot">
            <button
              className="nav__cmdk nav__cmdk--mobile"
              onClick={() => { setOpen(false); window.dispatchEvent(new Event('cmdk:open')) }}
            >
              <span className="nav__cmdk-key">⌘</span>K
            </button>
            <button className="nav__lang nav__lang--mobile" onClick={toggleLang} data-cursor="link">
              <span className={lang === 'es' ? 'is-on' : ''}>ES</span>
              <span className="nav__langsep">/</span>
              <span className={lang === 'en' ? 'is-on' : ''}>EN</span>
            </button>
            <span className="meta">Luis Eduardo — {t.footer.role} · Chile</span>
          </div>
        </motion.div>
      )}
    </>
  )
}
