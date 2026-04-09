import { useEffect } from 'react'

export function useAutofocusOnOpen<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  open: boolean,
) {
  useEffect(() => {
    if (!open) return
    ref.current?.focus()
  }, [open, ref])
}

