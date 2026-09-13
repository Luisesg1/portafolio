/**
 * Tiny leaderboard client for the "Catch Tito" game, backed by Supabase's REST
 * API (PostgREST) — no SDK dependency, just fetch. Stays dormant until the two
 * env vars are set, so the game works with or without a backend configured.
 *
 * Required env (Vite exposes VITE_*-prefixed vars to the client):
 *   VITE_SUPABASE_URL       e.g. https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY  the public anon key (safe client-side; RLS guards)
 *
 * The anon key is meant to be public — Row Level Security on the `scores` table
 * is what actually restricts access (read-all + insert-sane, no update/delete).
 */
const env = import.meta.env as Record<string, string | undefined>
const BASE = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_ANON_KEY

export const hasLeaderboard = Boolean(BASE && KEY)

export const MAX_NAME = 20

export type ScoreRow = { name: string; score: number; created_at: string }

function headers(): HeadersInit {
  return {
    apikey: KEY as string,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  }
}

/** Top scores, highest first (ties broken by who got there first). */
export async function getTop(limit = 10): Promise<ScoreRow[]> {
  if (!hasLeaderboard) return []
  const url = `${BASE}/rest/v1/scores?select=name,score,created_at&order=score.desc,created_at.asc&limit=${limit}`
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) throw new Error(`leaderboard load failed: ${res.status}`)
  return res.json()
}

/**
 * Where this score would land: 1 + how many stored scores are strictly higher.
 * (Ties rank below existing equal scores, so this is the best-case position.)
 */
export async function getRank(score: number): Promise<number> {
  if (!hasLeaderboard) return 0
  const url = `${BASE}/rest/v1/scores?select=id&score=gt.${score}`
  const res = await fetch(url, { headers: { ...headers(), Prefer: 'count=exact', Range: '0-0' } })
  const cr = res.headers.get('content-range') // e.g. "0-0/42" or "*/0"
  const total = cr ? parseInt(cr.split('/')[1] || '0', 10) : 0
  return (Number.isNaN(total) ? 0 : total) + 1
}

/** Insert one score. Name is trimmed/capped client-side; RLS re-checks server-side. */
export async function submitScore(name: string, score: number): Promise<void> {
  if (!hasLeaderboard) return
  const clean = name.trim().slice(0, MAX_NAME)
  if (!clean) throw new Error('empty name')
  const res = await fetch(`${BASE}/rest/v1/scores`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify({ name: clean, score }),
  })
  if (!res.ok) throw new Error(`leaderboard submit failed: ${res.status}`)
}
