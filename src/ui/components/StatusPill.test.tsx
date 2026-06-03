import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusPill } from './StatusPill'
import { axe } from '../../test/setup'

describe('StatusPill', () => {
  it('renders text content', () => {
    render(<StatusPill variant="success">Approved</StatusPill>)
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('applies success colour for success variant', () => {
    const { container } = render(<StatusPill variant="success">Approved</StatusPill>)
    expect((container.firstChild as HTMLElement).className).toContain('text-success')
  })

  it('applies error colour for error variant', () => {
    const { container } = render(<StatusPill variant="error">Rejected</StatusPill>)
    expect((container.firstChild as HTMLElement).className).toContain('text-error')
  })

  it('uses text-text for warning to maintain WCAG AA contrast', () => {
    const { container } = render(<StatusPill variant="warning">Pending</StatusPill>)
    expect((container.firstChild as HTMLElement).className).toContain('text-text')
  })

  it('applies neutral colour for neutral variant', () => {
    const { container } = render(<StatusPill variant="neutral">Inactive</StatusPill>)
    expect((container.firstChild as HTMLElement).className).toContain('text-neutral')
  })

  it('applies primary colour for info variant', () => {
    const { container } = render(<StatusPill variant="info">In Progress</StatusPill>)
    expect((container.firstChild as HTMLElement).className).toContain('text-primary')
  })

  it('has no a11y violations for each variant', async () => {
    const variants = ['success', 'warning', 'error', 'neutral', 'info'] as const
    for (const variant of variants) {
      const { container } = render(<StatusPill variant={variant}>Label</StatusPill>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    }
  })
})
