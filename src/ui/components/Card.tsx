import type { FC, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'section'
}

export const Card: FC<CardProps> = ({ children, className = '', as: Tag = 'div' }) => {
  return (
    <Tag className={`bg-card rounded-card shadow-card p-6 ${className}`}>
      {children}
    </Tag>
  )
}
