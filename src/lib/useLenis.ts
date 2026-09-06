import { useEffect } from 'react'

/**
 * In-page anchor navigation on native scroll.
 *
 * Lenis (smooth-scroll momentum) was removed: its internal scroll position
 * drifted from the real one whenever the page scrolled outside its control
 * (a form field focusing and scrolling itself into view, the browser restoring
 * position, etc.), and on its next frame it yanked the page back to that stale
 * target — which made clicking a contact input jump to the top/footer and
 * become impossible to type in. Native scrolling has no such desync.
 *
 * The anchor handler stays so clicking "#contact" etc. scrolls smoothly and
 * never triggers a default navigation/reload. `window.lenis` is kept as `null`
 * so the few `window.lenis?.…` call sites elsewhere stay safe no-ops (Nav
 * already falls back to a native scroll listener and body-overflow lock).
 */
export function useLenis() {
  useEffect(() => {
    ;(window as unknown as { lenis?: null }).lenis = null

    const onClick = (e: MouseEvent) => {
      // let the browser handle modifier-clicks (open in new tab, etc.)
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return
      const el = (e.target as HTMLElement)?.closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!el) return
      const id = el.getAttribute('href')!
      if (id.length < 2) return
      const target = document.querySelector(id) as HTMLElement | null
      if (!target) return
      e.preventDefault()
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    }
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
    }
  }, [])
}
