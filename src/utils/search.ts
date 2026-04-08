type HighlightPart = { type: 'text' | 'match'; text: string }

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

