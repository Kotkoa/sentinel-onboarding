import type { FC, ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'warning' | 'error' | 'info' | 'neutral'
}

const variantClasses = {
  warning: 'bg-warning/10 text-text border border-warning/60',
  error: 'bg-error/10 text-error border border-error/30',
  info: 'bg-primary/10 text-primary border border-primary/30',
  neutral: 'bg-neutral/10 text-neutral border border-neutral/30',
}

export const Badge: FC<BadgeProps> = ({ children, variant = 'neutral' }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantClasses[variant]}`}
  >
    {children}
  </span>
)
