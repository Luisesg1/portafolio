import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Smooth scrolling + in-page anchor navigation. Lenis is skipped under reduced
 * motion, but the anchor handler is always installed (falling back to native
 * smooth scrollIntoView) so clicking "#contact" etc. always scrolls the page
 * and never triggers a default navigation/reload.
 */
export function useLenis() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let lenis: Lenis | null = null
    let raf = 0
    if (!reduce) {
      lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      })
      const loop = (time: number) => {
        lenis!.raf(time)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }
    // expose so overlays (mobile menu) can stop/start scrolling
    ;(window as unknown as { lenis?: Lenis | null }).lenis = lenis

    // anchor links -> controlled scroll (never a native jump/reload)
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
      if (lenis) lenis.scrollTo(target, { offset: -20 })
      else target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    document.addEventListener('click', onClick)

    // Focusing a form field makes the browser scroll it into view natively,
    // which desyncs Lenis's internal position — on its next frame Lenis snaps
    // the page back to its stale target (looked like the page "going black" /
    // jumping to the footer when clicking an input). After the native focus
    // scroll settles, lock Lenis to the real position so it can't yank.
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null
      if (!lenis || !t) return
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) {
        requestAnimationFrame(() =>
          lenis!.scrollTo(window.scrollY, { immediate: true, force: true }),
        )
      }
    }
    document.addEventListener('focusin', onFocusIn)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      document.removeEventListener('click', onClick)
      document.removeEventListener('focusin', onFocusIn)
      lenis?.destroy()
      ;(window as unknown as { lenis?: Lenis | null }).lenis = null
    }
  }, [])
}
