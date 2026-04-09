export type HighlightPart = { type: 'text' | 'match'; text: string }

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

