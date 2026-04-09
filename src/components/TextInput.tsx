import type { InputHTMLAttributes } from 'react'
import { cn } from '../utils/cn.ts'

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
      className={cn('field', 'textInput', className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
    />
  )
}

