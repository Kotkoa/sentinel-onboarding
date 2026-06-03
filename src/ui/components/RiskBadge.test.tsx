import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RiskBadge } from './RiskBadge'
import { axe } from '../../test/setup'

describe('RiskBadge', () => {
  it('renders LOW badge with correct label', () => {
    render(<RiskBadge tier="LOW" />)
    expect(screen.getByText('LOW')).toBeInTheDocument()
  })

  it('renders MEDIUM badge with correct label', () => {
    render(<RiskBadge tier="MEDIUM" />)
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
  })

  it('renders HIGH badge with correct label', () => {
    render(<RiskBadge tier="HIGH" />)
    expect(screen.getByText('HIGH')).toBeInTheDocument()
  })

  it('applies success color class for LOW tier', () => {
    const { container } = render(<RiskBadge tier="LOW" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('text-success')
  })

  it('applies error color class for HIGH tier', () => {
    const { container } = render(<RiskBadge tier="HIGH" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('text-error')
  })

  it('has accessible aria-label', () => {
    render(<RiskBadge tier="HIGH" />)
    expect(screen.getByLabelText('Risk tier: HIGH')).toBeInTheDocument()
  })

  it('has no a11y violations for LOW', async () => {
    const { container } = render(<RiskBadge tier="LOW" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no a11y violations for MEDIUM', async () => {
    const { container } = render(<RiskBadge tier="MEDIUM" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no a11y violations for HIGH', async () => {
    const { container } = render(<RiskBadge tier="HIGH" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
