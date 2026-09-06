import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Cat,
  Download,
  Github,
  Languages,
  Linkedin,
  Mail,
  MessageCircle,
  Search,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '../i18n/i18n'
import './CommandPalette.css'

const EMAIL = 'luiseduardosotoguti@gmail.com'
const CV = '/Luis-Eduardo-Soto-Gutierrez-CV.pdf'

type Cmd = {
  id: string
  label: string
  hint: string
  group: 'nav' | 'action'
  keywords: string
  icon: LucideIcon
  run: () => void
}

/**
 * ⌘K / Ctrl+K command palette — keyboard-first way to jump around the site,
 * switch language, grab the CV or contact links. Opens on the shortcut or via
 * the floating hint; Esc closes, ↑/↓ move, Enter runs the highlighted command.
 */
export function CommandPalette() {
  const { t, lang, setLang } = useI18n()
  const c = t.cmd
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const close = () => {
    setOpen(false)
    setQ('')
    setActive(0)
  }

  const go = (id: string) => {
    close()
    // let the overlay unmount, then scroll natively (smooth via global CSS)
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const download = () => {
    const a = document.createElement('a')
    a.href = CV
    a.download = 'Luis-Eduardo-Soto-Gutierrez-CV.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    close()
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  const commands: Cmd[] = useMemo(() => {
    const n = t.nav
    const nav: Cmd[] = [
      { id: 'index', label: c.home, hint: '', group: 'nav', keywords: 'inicio home hero top', icon: ArrowUpRight, run: () => go('index') },
      { id: 'work', label: n.work, hint: '', group: 'nav', keywords: 'proyectos projects work trabajo', icon: ArrowUpRight, run: () => go('work') },
      { id: 'services', label: n.services, hint: '', group: 'nav', keywords: 'servicios services', icon: ArrowUpRight, run: () => go('services') },
      { id: 'tech', label: n.tech, hint: '', group: 'nav', keywords: 'tech tecnologia stack', icon: ArrowUpRight, run: () => go('tech') },
      { id: 'system', label: n.system, hint: '', group: 'nav', keywords: 'estado status system', icon: ArrowUpRight, run: () => go('system') },
      { id: 'about', label: n.about, hint: '', group: 'nav', keywords: 'perfil about sobre mi', icon: ArrowUpRight, run: () => go('about') },
      { id: 'process', label: n.process, hint: '', group: 'nav', keywords: 'proceso process como trabajo', icon: ArrowUpRight, run: () => go('process') },
      { id: 'contact', label: n.contact, hint: '', group: 'nav', keywords: 'contacto contact hablemos', icon: ArrowUpRight, run: () => go('contact') },
    ]
    const actions: Cmd[] = [
      { id: 'cv', label: c.downloadCv, hint: 'PDF', group: 'action', keywords: 'cv curriculum resume descargar pdf', icon: Download, run: download },
      { id: 'copy', label: c.copyEmail, hint: EMAIL, group: 'action', keywords: 'email correo copiar copy mail', icon: Mail, run: copyEmail },
      { id: 'lang', label: lang === 'es' ? c.toEn : c.toEs, hint: lang === 'es' ? 'EN' : 'ES', group: 'action', keywords: 'idioma language english espanol lang', icon: Languages, run: () => { setLang(lang === 'es' ? 'en' : 'es'); close() } },
      { id: 'tito', label: c.tito, hint: '🐱', group: 'action', keywords: 'tito gato cat easter egg', icon: Cat, run: () => { window.dispatchEvent(new Event('tito:show')); close() } },
      { id: 'gh', label: 'GitHub', hint: '@Luisesg1', group: 'action', keywords: 'github repos codigo', icon: Github, run: () => { window.open('https://github.com/Luisesg1', '_blank', 'noopener'); close() } },
      { id: 'in', label: 'LinkedIn', hint: '/luis-eduardo-soto', group: 'action', keywords: 'linkedin', icon: Linkedin, run: () => { window.open('https://www.linkedin.com/in/luis-eduardo-soto-guti%C3%A9rrez-99a53a256', '_blank', 'noopener'); close() } },
      { id: 'wa', label: 'WhatsApp', hint: c.message, group: 'action', keywords: 'whatsapp wa mensaje', icon: MessageCircle, run: () => { window.open('https://wa.me/56988823245', '_blank', 'noopener'); close() } },
    ]
    return [...nav, ...actions]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, lang])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return commands
    return commands.filter((cmd) => (cmd.label + ' ' + cmd.keywords).toLowerCase().includes(s))
  }, [q, commands])

  // toggle on ⌘K / Ctrl+K, or open via the nav trigger (custom event)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('cmdk:open', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('cmdk:open', onOpen)
    }
  }, [])

  // lock scroll + focus input while open
  useEffect(() => {
    if (!open) return
    setActive(0)
    document.body.style.overflow = 'hidden'
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => {
      document.body.style.overflow = ''
      cancelAnimationFrame(id)
    }
  }, [open])

  // keep active index in range as results change
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, results.length - 1)))
  }, [results.length])

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      results[active]?.run()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  // scroll active option into view
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector<HTMLElement>('[data-active="1"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  if (!open) return null

  let lastGroup = ''
  return (
    <div className="cmdk" role="dialog" aria-modal="true" aria-label={c.placeholder} onMouseDown={close}>
      <div className="cmdk__panel" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onListKey}>
        <div className="cmdk__search">
          <Search size={17} strokeWidth={1.7} className="cmdk__searchicon" />
          <input
            ref={inputRef}
            className="cmdk__input"
            placeholder={c.placeholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cmdk__esc">ESC</kbd>
        </div>

        <div className="cmdk__list" ref={listRef}>
          {results.length === 0 && <div className="cmdk__empty">{c.empty}</div>}
          {results.map((cmd, i) => {
            const showGroup = cmd.group !== lastGroup
            lastGroup = cmd.group
            const Icon = cmd.icon
            return (
              <div key={cmd.id}>
                {showGroup && (
                  <div className="cmdk__group">{cmd.group === 'nav' ? c.navGroup : c.actionGroup}</div>
                )}
                <button
                  type="button"
                  className="cmdk__item"
                  data-active={i === active ? '1' : '0'}
                  onMouseMove={() => setActive(i)}
                  onClick={cmd.run}
                >
                  <Icon size={16} strokeWidth={1.6} />
                  <span className="cmdk__label">{cmd.id === 'copy' && copied ? c.copied : cmd.label}</span>
                  {cmd.hint && <span className="cmdk__hint">{cmd.hint}</span>}
                </button>
              </div>
            )
          })}
        </div>

        <div className="cmdk__foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> {c.footMove}</span>
          <span><kbd>↵</kbd> {c.footRun}</span>
          <span className="cmdk__brand">⌘K</span>
        </div>
      </div>
    </div>
  )
}
