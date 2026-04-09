import type { InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'className'> & {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
}

export function TextInput({ value, onChange, ariaLabel, className, ...rest }: Props) {
  return (
    <input
      {...rest}
      className={['textInput', className].filter(Boolean).join(' ')}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
    />
  )
}

