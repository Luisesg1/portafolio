/**
 * Reliable programmatic scrolling.
 *
 * The site sets `html { scroll-behavior: smooth }` for native anchor clicks, but
 * in this engine that makes JS-initiated scrolls (both `scrollIntoView` and
 * `scrollTop`/`scrollTo`) silently no-op. So we briefly force `scroll-behavior:
 * auto` around the assignment, then restore it. Reduced-motion already forces
 * `auto` globally, so the instant jump here matches that preference too.
 */
function scroller(): HTMLElement {
  return (document.scrollingElement || document.documentElement) as HTMLElement
}

export function scrollToY(top: number) {
  const html = document.documentElement
  const prev = html.style.scrollBehavior
  html.style.scrollBehavior = 'auto'
  scroller().scrollTop = Math.max(0, top)
  html.style.scrollBehavior = prev
}

/** Scroll a section into view, clearing the fixed nav bar. */
export function scrollToId(id: string, offset = 88) {
  const el = document.getElementById(id)
  if (!el) return
  scrollToY(el.getBoundingClientRect().top + scroller().scrollTop - offset)
}
