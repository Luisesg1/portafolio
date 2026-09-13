# Resumen de sesión — 2026-09-13

Todo lo que se hizo en el portafolio en esta sesión: auditoría de credibilidad,
case studies de 7 bloques, tech core/secundario, fixes de scroll, y el minijuego
"Atrapa a Tito" con leaderboard online (Supabase). Detalle del juego en `MINIJUEGO.md`.

## Commits (rama `master`, pusheados a `Luisesg1/portafolio`)

| Hash | Qué |
|---|---|
| `e701b0a` | Credibilidad honesta + case studies 7 bloques + core stack + fixes de scroll |
| `e34c4b2` | Minijuego "Atrapa a Tito" + leaderboard Supabase |
| `d14d10e` | Juego en el menú móvil; ocultar Tito con menú abierto |
| `56fad47` | Quitar botón del juego del footer (ya tiene su banda) |
| `22a088c` | Trofeo dorado (SVG) + "estás en el puesto #N" tras subir |

---

## 1. Auditoría de credibilidad (regla absoluta: no inventar experiencia comercial)

Luis aún NO tiene clientes profesionales → se eliminó todo copy que lo implicara.

- **Sistema de Cotizaciones**: quitado `client: true` y el chip "En producción · Cliente
  real" → ahora **"Proyecto completo"** (`wip:false`). Result reformulado a capacidad
  ("Sistema completo de punta a punta…", sin "usado por el cliente"). Problem sin "una
  empresa regional" (framing del dominio, no cliente servido).
- **Calculadora 3D**: result sin "a clientes".
- Métrica EN "Projects Shipped" → "Projects Built".
- Chips de proyecto: solo `wip` true→"En desarrollo" / false→"Proyecto completo".

## 2. Case studies de 7 bloques (ES/EN)

`CaseStudy.tsx` render = **01 Contexto · 02 Solución · 03 Implementación ·
04 Funcionalidades · 05 Stack · 06 Aprendizajes · 07 Evidencia**. Se eliminó el bloque
"Resultado" (framing de negocio). Nuevos campos `implementation` / `features[]` /
`learnings` en los 5 proyectos ×2 idiomas (`dict.ts`), copy real derivado de cada app.
Funcionalidades = lista con dots (2 col → 1 col en móvil). Evidencia = nota "capturas
del proyecto real" (sin links de demo, por pedido del usuario).

## 3. Tech — core vs complementario

`coreTech` Set (React, TypeScript, Python, Django, Kotlin, PostgreSQL) → resaltados con
punto violeta + bold; secundarios más tenues. Leyenda "Stack principal / Core stack".
**Supabase** añadido al grupo Database.

## 4. Sin links de demo (por pedido)

Eliminado el campo `demo` de los 5 proyectos, labels `viewDemo`, render de demo y el
bullet "defca.app". Única mención restante: "modo demo sin backend" = **funcionalidad
real** de Cotizaciones (aprobada por el usuario).

## 5. Fixes de scroll (`src/lib/scroll.ts`)

`html{scroll-behavior:smooth}` rompe TODO scroll programático en este engine
(`scrollIntoView`/`scrollTop`/`scrollTo` = no-op). Helper `scrollToY` / `scrollToId`
fuerza `scroll-behavior:auto`. Arregla: CTA "Hablemos de un proyecto" del case study
(no navegaba a Contacto), navegación del command palette, restart del black-hole.
`focus({preventScroll:true})` al cerrar el modal.

---

## 6. Minijuego "Atrapa a Tito" (easter egg nivel 3)

Detalle completo en **`MINIJUEGO.md`**. Resumen:

- **Mecánica**: 20 s, countdown 3‑2‑1, Tito salta más rápido y encoge con el score;
  tap = +1 (con corazón), onda al saltar, anillo violeta, récord en localStorage.
- **Fondo**: starfield con twinkle + nebulosa que deriva + planeta tenue (CSS).
- **Polish**: pantallas idle / jugando / fin pulidas; título gradiente; trofeo dorado
  SVG (glow si récord); botón primario; barra de tiempo que drena; close editorial
  **"CERRAR ✕"** (boxless, no recuadro).
- **Lazy-load**: chunk aparte (~gz 3-4kb), no toca el bundle inicial.
- **Reduced-motion** respetado; **DPR-reactivo** (nítido con zoom del navegador).

### Vías de acceso
1. Banda **"¿Un respiro?"** (`GameBreak`, `<aside>` transparente antes de Contacto — no
   entra al nav ni al índice del HUD).
2. **Menú móvil** → "🎮 Atrapa a Tito".
3. **Command palette** (`Ctrl/Cmd+K`) → "Jugar".
4. **Click en Tito** → menú "🎮 Atrapa a Tito / Ocultar".
5. **Hint** al entrar ("Clic en Tito para jugar u ocultarlo", sale en cada visita).

## 7. Leaderboard online (Supabase)

- Cliente REST sin SDK (`src/lib/leaderboard.ts`): `getTop`, `getRank`, `submitScore`.
- **Proyecto Supabase**: `strmsaxjjjtyqkzayyoy` (org LuisesgOrg free, São Paulo).
  Tabla `public.scores` (name ≤20, score 0-200, RLS read-all / insert-sano / sin
  update-delete). SQL en `MINIJUEGO.md`.
- **Env vars**: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Local en `.env`
  (gitignored); **producción en Vercel** (Config, 3 environments) → **ya configuradas**.
- **Flujo**:
  - Idle: "A jugar" + "Ver ranking" (Top 10 sin jugar).
  - Fin: trofeo + score + "Quedarías en el puesto #N".
  - Vista compacta = tu fila + 1 vecino a cada lado (fila **fantasma** dashed hasta subir).
  - Toggle "Ver tabla completa" ↔ "Ver mi posición".
  - Campo nombre limitado (maxLength 20 + contador).
  - Al subir: fila sólida + **"✓ Estás en el puesto #N del ranking"**.
- Nota honestidad: score enviado desde el cliente (cap 200); aceptable para portfolio.

## 8. Fixes durante el desarrollo

- **Crash de Tito** (TDZ): `syncDPR()` llamaba `drawFrame` antes de declarar `sheet` →
  tumbaba la app. Reordenado.
- **Tito DPR-reactivo**: canvas re-renderiza a la resolución nueva al hacer zoom.
- **Sprite nunca invisible**: `cg-pop` solo anima `scale` (no `opacity`).
- **Panel opaco** (`rgba(9,9,12,0.985)`) para no depender de `backdrop-filter`.
- **Scroll-lock** en `<html>`+`<body>` + `overscroll-behavior:contain` → la lista del
  modal no scrollea la página de atrás.
- **Tito no se superpone** al menú móvil (`body.menu-open` oculta canvas/chip/hint/corazones).
- **Banda sin seam**: `GameBreak` transparente, el starfield fluye continuo.

---

## Pendiente / notas

- **Limpiar DB antes del estreno**: `delete from public.scores;` (quedan filas de prueba
  "Lucho", "Test", etc.).
- Producción: **luisesg.com** (Vercel, env vars ya puestas). Un push a `master`
  auto-despliega.
- El leaderboard queda **dormido sin las env vars** (el juego funciona igual).
