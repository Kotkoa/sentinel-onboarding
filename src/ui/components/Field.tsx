import { type FC, type InputHTMLAttributes, useId } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const Field: FC<FieldProps> = ({
  label,
  error,
  hint,
  id,
  className = '',
  ...rest
}) => {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const errorId = error ? `${fieldId}-error` : undefined
  const hintId = hint ? `${fieldId}-hint` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium text-text">
        {label}
        {rest.required && (
          <span className="text-error ml-1" aria-hidden="true">*</span>
        )}
      </label>
      {hint && (
        <span id={hintId} className="text-xs text-neutral">
          {hint}
        </span>
      )}
      <input
        id={fieldId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={[
          'min-h-[44px] px-3 py-2 rounded-lg border text-sm text-text bg-white',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          error ? 'border-error focus:ring-error' : 'border-neutral/40',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
      {error && (
        <span id={errorId} className="text-xs text-error">
          {error}
        </span>
      )}
    </div>
  )
}
