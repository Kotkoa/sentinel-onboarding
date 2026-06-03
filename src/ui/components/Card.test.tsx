import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from './Card'
import { axe } from '../../test/setup'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('renders as div by default', () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.firstChild?.nodeName).toBe('DIV')
  })

  it('renders as article when specified', () => {
    const { container } = render(<Card as="article">Content</Card>)
    expect(container.firstChild?.nodeName).toBe('ARTICLE')
  })

  it('renders as section when specified', () => {
    const { container } = render(<Card as="section">Content</Card>)
    expect(container.firstChild?.nodeName).toBe('SECTION')
  })

  it('applies card styling classes', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('bg-card')
    expect(card.className).toContain('rounded-card')
    expect(card.className).toContain('shadow-card')
  })

  it('merges custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('custom-class')
    expect(card.className).toContain('bg-card')
  })

  it('has no a11y violations', async () => {
    const { container } = render(<Card>Accessible card</Card>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
