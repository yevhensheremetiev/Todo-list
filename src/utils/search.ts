export type HighlightPart = { type: 'text' | 'match'; text: string }
export type MatchIndexRange = readonly [number, number]

export function fuzzyMatch(text: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const t = text.toLowerCase()
  if (t.includes(q)) return true
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  return qi === q.length
}

export function highlightMatchParts(text: string, query: string): HighlightPart[] {
  const q = query.trim()
  if (!q) return [{ type: 'text', text }]

  const lower = text.toLowerCase()
  const qLower = q.toLowerCase()
  const idx = lower.indexOf(qLower)
  if (idx < 0) return [{ type: 'text', text }]

  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + q.length)
  const after = text.slice(idx + q.length)

  const out: HighlightPart[] = []
  if (before) out.push({ type: 'text', text: before })
  if (match) out.push({ type: 'match', text: match })
  if (after) out.push({ type: 'text', text: after })
  return out
}

export function highlightPartsFromIndices(text: string, indices: readonly MatchIndexRange[]): HighlightPart[] {
  if (indices.length === 0) return [{ type: 'text', text }]

  const normalized: Array<[number, number]> = []
  for (const [startRaw, endRaw] of indices) {
    const start = Math.max(0, Math.min(text.length, startRaw))
    const end = Math.max(0, Math.min(text.length - 1, endRaw))
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue
    if (end < start) continue
    normalized.push([start, end])
  }
  if (normalized.length === 0) return [{ type: 'text', text }]

  normalized.sort((a, b) => a[0] - b[0] || a[1] - b[1])

  const merged: Array<[number, number]> = []
  for (const r of normalized) {
    const last = merged[merged.length - 1]
    if (!last) {
      merged.push(r)
      continue
    }
    if (r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1])
    else merged.push(r)
  }

  const out: HighlightPart[] = []
  let cursor = 0
  for (const [start, endInclusive] of merged) {
    if (start > cursor) out.push({ type: 'text', text: text.slice(cursor, start) })
    out.push({ type: 'match', text: text.slice(start, endInclusive + 1) })
    cursor = endInclusive + 1
  }
  if (cursor < text.length) out.push({ type: 'text', text: text.slice(cursor) })
  return out
}

