type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel: string
}

export function TextInput({ value, onChange, placeholder, ariaLabel }: Props) {
  return (
    <input
      className="textInput"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
    />
  )
}

