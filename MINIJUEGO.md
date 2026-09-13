# Minijuego — "Atrapa a Tito" 🐱🎮

Easter egg del portafolio: un mini-juego arcade donde Tito (el gato pixel del sitio)
salta por un tablero cósmico y hay que tocarlo para sumar puntos, con leaderboard
online opcional (Supabase). Nivel 3 (personalidad) — no compite con los proyectos.

## Archivos

| Archivo | Rol |
|---|---|
| `src/components/CatchGame.tsx` | Componente del juego (overlay, mecánica, leaderboard UI). Lazy-load. |
| `src/components/CatchGame.css` | Estilos del overlay, tablero, HUD, leaderboard. |
| `src/components/GameBreak.tsx` | Banda "¿Un respiro?" antes de Contacto que invita a jugar. |
| `src/components/GameBreak.css` | Estilos de la banda (fondo transparente, sin seam). |
| `src/lib/leaderboard.ts` | Cliente REST de Supabase (sin SDK): `getTop`, `getRank`, `submitScore`, `hasLeaderboard`. |
| `src/vite-env.d.ts` | Tipos de `import.meta.env` (Vite). |
| `.env.example` | Plantilla de las 2 variables del leaderboard. |

Integración: `src/App.tsx` (monta `GameHost` lazy + `<GameBreak/>`),
`src/components/Footer.tsx` (botón), `src/components/GlobalCat.tsx` (menú de Tito + hint),
`src/components/CommandPalette.tsx` (comando), `src/i18n/dict.ts` (copy ES/EN, bloque `game`).

## Cómo se abre (3 vías + hint)

1. **Footer** → botón "Atrapa a Tito".
2. **Click en Tito** → menú "🎮 Atrapa a Tito" / "Ocultar".
3. **Command palette** (`Ctrl/Cmd + K`) → "Jugar".
4. **Hint** al entrar: "Clic en Tito para jugar u ocultarlo" (sale en cada visita, se auto-cierra 7s).

Todas disparan el evento `window` `game:open`, que monta el juego (chunk lazy aparte).

## Mecánica

- Duración 20 s (`DURATION`). Countdown 3‑2‑1 al empezar.
- Tito salta cada `max(520, 1000 - score*34)` ms; encoge con el score (`max(52, 84 - score*1.6)` px).
- Tap/click en Tito = +1 + corazón "+1". Onda al saltar. Anillo violeta bajo Tito.
- Récord personal en `localStorage` (`catch-tito-best`).
- Fondo: starfield con twinkle + nebulosa que deriva + planeta tenue (CSS, `.cg__sky`).
- Respeta `prefers-reduced-motion`.

## Leaderboard (Supabase, opcional)

Se activa solo si existen las 2 env vars; si no, el juego funciona igual sin ranking.

### Env vars (Vite → `VITE_*`)
```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>   # pública, protegida por RLS
```
- Local: archivo `.env` (gitignored).
- Producción: **Vercel → Settings → Environment Variables** (mismas 2) + redeploy.

### Tabla + RLS (correr una vez en Supabase → SQL Editor)
```sql
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 20),
  score int not null check (score >= 0 and score <= 200),
  created_at timestamptz not null default now()
);
alter table public.scores enable row level security;
create policy "scores_read" on public.scores for select using (true);
create policy "scores_insert" on public.scores for insert with check (
  char_length(trim(name)) between 1 and 20 and score >= 0 and score <= 200
);
create index if not exists scores_score_idx on public.scores (score desc, created_at asc);
```
Reglas: leer todos / insertar sano / **sin update ni delete** (filas inmutables).
Cap `score ≤ 200` y nombre `≤ 20` como anti-spam.

### Flujo del leaderboard
- **Pantalla inicial**: "A jugar" + "Ver ranking" (muestra Top 10 sin jugar).
- **Al terminar**: medalla + score + **"Quedarías en el puesto #N"** (`getRank` = 1 + cuántos te superan).
- **Vista compacta** por defecto: tu fila + 1 vecino a cada lado (ej. 11‑12‑13), con tu fila **fantasma** (dashed) hasta subir.
- Botón **"Ver tabla completa"** ↔ **"Ver mi posición"** (Top 10 + `···` + tu fila si estás fuera).
- **Campo nombre** limitado (maxLength 20 + contador "n/20").
- Al **subir**, la fila fantasma se vuelve sólida/resaltada + "✓ ¡En el ranking!".

Nota honestidad: el score se envía desde el cliente (cap 200). Aceptable para portfolio;
blindaje real requeriría una Edge Function.

## Notas técnicas / gotchas resueltos

- **DPR-reactivo**: el canvas de Tito re-renderiza a la resolución nueva al cambiar el zoom
  del navegador (`syncDPR` en `resize`) — antes se pixelaba al hacer zoom-in.
- **Sprite nunca invisible**: `cg-pop` solo anima `scale` (no `opacity`); un pane sin
  compositing pausa la animación en frame 0 y dejaría a Tito invisible.
- **Panel opaco**: `rgba(9,9,12,0.985)` para no depender de `backdrop-filter`.
- **Scroll-lock**: al abrir se bloquean `<html>` y `<body>` (el scroller real es `<html>`) +
  `overscroll-behavior: contain` → el scroll de la lista no se filtra a la página.
- **Banda sin seam**: `GameBreak` es un `<aside>` transparente (no `<section>`), así no entra
  al nav ni al índice del HUD (`main section` sigue contando 8) y el starfield fluye continuo.

## Pendiente manual (antes de publicar)

1. **Limpiar filas de prueba** en Supabase: `delete from public.scores;`
2. **Vercel env vars** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) + redeploy.
