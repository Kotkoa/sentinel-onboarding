import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { RulesetInspector } from './RulesetInspector'
import { axe } from '../../test/setup'

describe('RulesetInspector', () => {
  it('renders the active ruleset heading', async () => {
    render(<RulesetInspector />)
    await waitFor(() => expect(screen.getByText('Active Ruleset')).toBeInTheDocument())
  })

  it('displays ruleset version badge', async () => {
    render(<RulesetInspector />)
    await waitFor(() => expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument())
  })

  it('renders HIGH risk section', async () => {
    render(<RulesetInspector />)
    await waitFor(() => expect(screen.getByRole('region', { name: /HIGH risk rules/i })).toBeInTheDocument())
  })

  it('renders MEDIUM risk section', async () => {
    render(<RulesetInspector />)
    await waitFor(() => expect(screen.getByRole('region', { name: /MEDIUM risk rules/i })).toBeInTheDocument())
  })

  it('renders LOW risk section', async () => {
    render(<RulesetInspector />)
    await waitFor(() => expect(screen.getByRole('region', { name: /LOW risk rules/i })).toBeInTheDocument())
  })

  it('shows rule IDs in the table', async () => {
    render(<RulesetInspector />)
    await waitFor(() => {
      expect(screen.getByText('HIGH-PEP')).toBeInTheDocument()
      expect(screen.getByText('HIGH-SANCTIONS')).toBeInTheDocument()
      expect(screen.getByText('HIGH-COUNTRY')).toBeInTheDocument()
      expect(screen.getByText('MEDIUM-ENTITY')).toBeInTheDocument()
      expect(screen.getByText('MEDIUM-INCOME-SOF')).toBeInTheDocument()
    })
  })

  it('shows field names as code elements', async () => {
    render(<RulesetInspector />)
    await waitFor(() => expect(screen.getByText('pepStatus')).toBeInTheDocument())
  })

  it('shows AND label for compound conditions', async () => {
    render(<RulesetInspector />)
    await waitFor(() => expect(screen.getByText('AND')).toBeInTheDocument())
  })

  it('shows country list values', async () => {
    render(<RulesetInspector />)
    await waitFor(() => expect(screen.getByText(/Russia.*Belarus.*Venezuela/)).toBeInTheDocument())
  })

  it('has no a11y violations', async () => {
    const { container } = render(<RulesetInspector />)
    await waitFor(() => expect(screen.getByText('Active Ruleset')).toBeInTheDocument())
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
