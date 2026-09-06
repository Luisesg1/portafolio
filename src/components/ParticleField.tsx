import { useEffect, useRef } from 'react'

type Props = {
  className?: string
  /** density multiplier (1 = default) */
  density?: number
  /** enable very subtle pointer parallax */
  interactive?: boolean
}

type P = {
  x: number
  y: number
  vx: number
  vy: number
  wf: number // wobble frequency
  wp: number // wobble phase
  z: number // depth 0 (far) .. 1 (near)
  size: number
  baseA: number // base opacity
  accent: string | null
  glow: number
  // twinkle
  twStart: number
  twDur: number
  twNext: number
}

const ACCENTS = ['#8052ff', '#3b82f6', '#22d3ee', '#d946ef', '#ffb829']

/**
 * Generative "digital dust / constellation" field on <canvas>.
 * Design goals: mostly tiny faint white specks, a few colored accents,
 * organic drifting motion, depth parallax, and only rare, faint links.
 * No React state per frame — everything lives in the animation loop.
 */
export function ParticleField({ className, density = 1, interactive = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cores = navigator.hardwareConcurrency || 8
    // On touch there's no hover, so pointer parallax does nothing — treat every
    // field as "decorative" there. Decorative fields use a smaller backing store
    // and fewer particles, which keeps phones from janking (mobile GPUs choke on
    // a dpr-2 canvas full of shadow-blurred specks).
    const touch = window.matchMedia('(pointer: coarse)').matches
    const cheap = !interactive || touch
    const dpr = Math.min(window.devicePixelRatio || 1, cheap ? 1 : 2)

    let w = 0
    let h = 0
    let particles: P[] = []
    // per-frame draw-position buffers — allocated once per resize (not per frame)
    // to avoid GC churn that shows up as jank/flicker on heavier sections.
    let px = new Float32Array(0)
    let py = new Float32Array(0)
    // spatial grid for connections — buckets reused across frames (cleared, not
    // reallocated) so we don't churn thousands of arrays per second.
    let gCols = 1
    let gRows = 1
    let grid: number[][] = []
    let ambient: { x: number; y: number; r: number; c: string; dx: number; dy: number }[] = []

    // eased pointer offset (parallax)
    const pointer = { tx: 0, ty: 0, x: 0, y: 0 }

    function targetCount() {
      const area = w * h
      const base = area / 2000 // denser field of tiny specks
      let cap: number
      let floor: number
      if (w < 768) {
        cap = 350
        floor = 160
      } else if (w < 1200) {
        cap = 560
        floor = 320
      } else {
        cap = 820
        floor = 420
      }
      if (cores <= 4) {
        cap = Math.round(cap * 0.6)
        floor = Math.round(floor * 0.6)
      }
      // decorative fields (and everything on touch) carry roughly half the specks
      if (cheap) {
        cap = Math.round(cap * 0.5)
        floor = Math.round(floor * 0.5)
      }
      return Math.max(floor, Math.min(Math.round(base * density), cap))
    }

    function makeParticle(): P {
      // depth-biased toward the far end so most specks are tiny/dim
      const z = Math.pow(Math.random(), 1.7)
      // size distribution: ~70% ~1px, ~20% 1.5-2, ~8% 2-3, ~2% bigger
      const roll = Math.random()
      let size: number
      if (roll < 0.7) size = 0.6 + Math.random() * 0.5
      else if (roll < 0.9) size = 1.1 + Math.random() * 0.9
      else if (roll < 0.98) size = 2 + Math.random() * 1
      else size = 3 + Math.random() * 1.2
      size *= 0.7 + z * 0.6

      const isAccent = Math.random() < 0.05
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        wf: 0.1 + Math.random() * 0.25,
        wp: Math.random() * Math.PI * 2,
        z,
        size,
        baseA: 0.1 + z * 0.55,
        accent: isAccent ? ACCENTS[(Math.random() * ACCENTS.length) | 0] : null,
        glow: isAccent ? 1 : 0,
        twStart: -9999,
        twDur: 0,
        twNext: performance.now() + 2000 + Math.random() * 12000,
      }
    }

    function buildAmbient() {
      const cols = ['#8052ff', '#3b82f6', '#22d3ee']
      const n = w < 768 ? 2 : 3
      ambient = Array.from({ length: n }, (_, i) => ({
        x: (0.35 + Math.random() * 0.6) * w,
        y: (0.2 + Math.random() * 0.6) * h,
        r: (w < 768 ? 120 : 200) + Math.random() * 120,
        c: cols[i % cols.length],
        dx: (Math.random() - 0.5) * 0.06,
        dy: (Math.random() - 0.5) * 0.06,
      }))
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas!.width = Math.round(w * dpr)
      canvas!.height = Math.round(h * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      particles = Array.from({ length: targetCount() }, makeParticle)
      px = new Float32Array(particles.length)
      py = new Float32Array(particles.length)
      gCols = Math.max(1, Math.ceil(w / connDist))
      gRows = Math.max(1, Math.ceil(h / connDist))
      grid = Array.from({ length: gCols * gRows }, () => [])
      buildAmbient()
    }

    const connDist = 26
    const maxShift = 12 // px of parallax

    function drawAmbient() {
      ctx!.globalCompositeOperation = 'lighter'
      for (const a of ambient) {
        a.x += a.dx
        a.y += a.dy
        if (a.x < -a.r) a.x = w + a.r
        else if (a.x > w + a.r) a.x = -a.r
        if (a.y < -a.r) a.y = h + a.r
        else if (a.y > h + a.r) a.y = -a.r
        const g = ctx!.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r)
        const c = a.c
        g.addColorStop(0, hexA(c, 0.05))
        g.addColorStop(1, hexA(c, 0))
        ctx!.fillStyle = g
        ctx!.fillRect(a.x - a.r, a.y - a.r, a.r * 2, a.r * 2)
      }
      ctx!.globalCompositeOperation = 'source-over'
    }

    function frame(now: number) {
      ctx!.clearRect(0, 0, w, h)

      // ambient diffuse light
      drawAmbient()

      // ease pointer
      pointer.x += (pointer.tx - pointer.x) * 0.05
      pointer.y += (pointer.ty - pointer.y) * 0.05

      // update + collect draw positions (buffers reused across frames)
      const n = particles.length

      for (let i = 0; i < n; i++) {
        const p = particles[i]
        // organic drift: tiny velocity + slow sinusoidal wobble
        p.x += p.vx + Math.cos(now * 0.0006 * p.wf + p.wp) * 0.03
        p.y += p.vy + Math.sin(now * 0.0006 * p.wf * 1.3 + p.wp) * 0.03

        // wrap
        if (p.x < -20) p.x = w + 20
        else if (p.x > w + 20) p.x = -20
        if (p.y < -20) p.y = h + 20
        else if (p.y > h + 20) p.y = -20

        // parallax offset — nearer particles move a touch more
        const par = 0.3 + p.z * 0.7
        px[i] = p.x + pointer.x * maxShift * par
        py[i] = p.y + pointer.y * maxShift * par
      }

      // ---- rare, faint connections (spatial grid, only near-depth) ----
      const cell = connDist
      const cols = gCols
      const rows = gRows
      for (let k = 0; k < grid.length; k++) grid[k].length = 0
      for (let i = 0; i < n; i++) {
        if (particles[i].z < 0.45) continue // only connect nearer specks
        const cx = Math.min(cols - 1, Math.max(0, (px[i] / cell) | 0))
        const cy = Math.min(rows - 1, Math.max(0, (py[i] / cell) | 0))
        const key = cy * cols + cx
        grid[key].push(i)
      }
      ctx!.lineWidth = 0.5
      for (let i = 0; i < n; i++) {
        if (particles[i].z < 0.45) continue
        const cx = Math.min(cols - 1, Math.max(0, (px[i] / cell) | 0))
        const cy = Math.min(rows - 1, Math.max(0, (py[i] / cell) | 0))
        for (let gy = cy; gy <= cy + 1; gy++) {
          for (let gx = cx - 1; gx <= cx + 1; gx++) {
            if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) continue
            const bucket = grid[gy * cols + gx]
            if (!bucket) continue
            for (const j of bucket) {
              if (j <= i) continue
              const dx = px[i] - px[j]
              const dy = py[i] - py[j]
              const d2 = dx * dx + dy * dy
              if (d2 < connDist * connDist) {
                const d = Math.sqrt(d2)
                const a = (1 - d / connDist) * 0.06
                ctx!.strokeStyle = `rgba(190,190,210,${a})`
                ctx!.beginPath()
                ctx!.moveTo(px[i], py[i])
                ctx!.lineTo(px[j], py[j])
                ctx!.stroke()
              }
            }
          }
        }
      }

      // ---- dots ----
      for (let i = 0; i < n; i++) {
        const p = particles[i]

        // occasional twinkle
        let tw = 0
        if (now >= p.twNext && p.twStart < 0) {
          p.twStart = now
          p.twDur = 800 + Math.random() * 700
          p.twNext = now + 6000 + Math.random() * 16000
        }
        if (p.twStart >= 0) {
          const t = (now - p.twStart) / p.twDur
          if (t >= 1) p.twStart = -9999
          else tw = Math.sin(t * Math.PI) // 0..1..0
        }

        const alpha = Math.min(1, p.baseA + tw * 0.5)

        // NOTE: no canvas shadowBlur — it's the single most expensive op here
        // (set + drawn per dot, per frame). Accents keep their colour; the
        // twinkle now reads through alpha + a touch of size instead of a halo.
        ctx!.fillStyle = p.accent ? p.accent : '#eef0f6'
        ctx!.globalAlpha = alpha
        ctx!.beginPath()
        ctx!.arc(px[i], py[i], p.size + tw * 0.6, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1
    }

    let raf = 0
    let running = false
    function loop(now: number) {
      frame(now)
      raf = requestAnimationFrame(loop)
    }
    function start() {
      if (running) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    function stop() {
      running = false
      cancelAnimationFrame(raf)
    }

    resize()

    if (reduce) {
      frame(0)
      return () => {}
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !document.hidden) start()
        else stop()
      },
      { threshold: 0.01 },
    )
    io.observe(canvas)

    const onVis = () => {
      if (document.hidden) stop()
    }
    document.addEventListener('visibilitychange', onVis)

    let resizeT = 0
    const onResize = () => {
      // Ignore height-only changes (mobile keyboard opening/closing). Rebuilding
      // the whole field on every keystroke made the starfield flash ("se
      // actualiza") while typing in the contact form.
      if (Math.abs(canvas!.getBoundingClientRect().width - w) < 1) return
      clearTimeout(resizeT)
      resizeT = window.setTimeout(resize, 200)
    }
    window.addEventListener('resize', onResize)

    let move: (e: PointerEvent) => void = () => {}
    const wantMove = interactive && !touch
    if (wantMove) {
      move = (e: PointerEvent) => {
        // normalized -1..1 from viewport center
        pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
        pointer.ty = (e.clientY / window.innerHeight) * 2 - 1
      }
      window.addEventListener('pointermove', move, { passive: true })
    }

    return () => {
      stop()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('resize', onResize)
      if (wantMove) window.removeEventListener('pointermove', move)
    }
  }, [density, interactive])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}

/** hex (#rrggbb) + alpha -> rgba() string */
function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${a})`
}
