import type { FC, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'section'
  'aria-label'?: string
  'aria-labelledby'?: string
}

export const Card: FC<CardProps> = ({
  children,
  className = '',
  as: Tag = 'div',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}) => {
  return (
    <Tag
      className={`bg-card rounded-card shadow-card p-6 ${className}`}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </Tag>
  )
}
