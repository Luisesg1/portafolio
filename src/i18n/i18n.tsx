import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { dict } from './dict'

export type Lang = 'es' | 'en'
type Dict = (typeof dict)['es']

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: Dict }

const LangContext = createContext<Ctx | null>(null)

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('ls-lang')
    if (saved === 'es' || saved === 'en') return saved
  } catch {
    /* ignore */
  }
  // default to Spanish; only fall back to English for clearly non-es browsers
  if (typeof navigator !== 'undefined' && /^en/i.test(navigator.language)) return 'en'
  return 'es'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = (l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem('ls-lang', l)
    } catch {
      /* ignore */
    }
  }

  // Keep the document metadata in sync with the active language so shares and
  // search snippets match what the visitor sees (client-side i18n, single URL).
  useEffect(() => {
    document.documentElement.lang = lang
    const seo = dict[lang].seo
    document.title = seo.title
    const set = (sel: string, attr: string, val: string) => {
      const el = document.head.querySelector(sel)
      if (el) el.setAttribute(attr, val)
    }
    set('meta[name="description"]', 'content', seo.description)
    set('meta[property="og:title"]', 'content', seo.title)
    set('meta[property="og:description"]', 'content', seo.description)
    set('meta[property="og:locale"]', 'content', seo.locale)
    set('meta[name="twitter:title"]', 'content', seo.title)
    set('meta[name="twitter:description"]', 'content', seo.description)
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t: dict[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useI18n must be used within LangProvider')
  return ctx
}

/** Shortcut for components that only need the copy dictionary. */
export function useT() {
  return useI18n().t
}
