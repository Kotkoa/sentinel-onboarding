import type { FC, SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string
}

export const Select: FC<SelectProps> = ({
  label,
  options,
  error,
  id,
  className = '',
  ...rest
}) => {
  const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, '-')}`
  const errorId = error ? `${selectId}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-medium text-text">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        className={[
          'min-h-[44px] px-3 py-2 rounded-lg border text-sm text-text',
          'bg-white focus:outline-none focus:ring-2 focus:ring-primary',
          error ? 'border-error focus:ring-error' : 'border-neutral/40',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {options.map(({ value, label: optionLabel }) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
      {error && (
        <span id={errorId} role="alert" className="text-xs text-error">
          {error}
        </span>
      )}
    </div>
  )
}
