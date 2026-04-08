import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  onClick: () => void
  title: string
  ariaLabel: string
  disabled?: boolean
}

export function IconButton({ children, onClick, title, ariaLabel, disabled }: Props) {
  return (
    <button
      className="iconBtn"
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

