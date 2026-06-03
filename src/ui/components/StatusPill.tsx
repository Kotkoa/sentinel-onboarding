import type { FC } from 'react'

type StatusPillVariant = 'success' | 'warning' | 'error' | 'neutral' | 'info'

interface StatusPillProps {
  variant: StatusPillVariant
  children: string
}

const variantClasses: Record<StatusPillVariant, string> = {
  success: 'bg-success/10 text-success border border-success/30',
  warning: 'bg-warning/10 text-text border border-warning/60',
  error: 'bg-error/10 text-error border border-error/30',
  neutral: 'bg-neutral/10 text-neutral border border-neutral/30',
  info: 'bg-primary/10 text-primary border border-primary/30',
}

export const StatusPill: FC<StatusPillProps> = ({ variant, children }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}
