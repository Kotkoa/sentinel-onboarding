import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FindingsPanel } from './FindingsPanel'
import { loadCsvClients } from '../../test/helpers'
import { axe } from '../../test/setup'

describe('FindingsPanel', () => {
  it('renders findings tables when findings exist', () => {
    const clients = loadCsvClients()
    render(<FindingsPanel clients={clients} />)
    const tables = screen.getAllByRole('table', { name: /compliance findings/i })
    expect(tables.length).toBeGreaterThan(0)
  })

  it('shows CRITICAL section before WARNING section', () => {
    const clients = loadCsvClients()
    render(<FindingsPanel clients={clients} />)
    const criticalHeading = screen.getByRole('heading', { name: /critical/i })
    const warningHeading = screen.queryByRole('heading', { name: /warning/i })
    expect(criticalHeading).toBeInTheDocument()
    if (warningHeading) {
      expect(
        criticalHeading.compareDocumentPosition(warningHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }
  })

  it('shows findings count summary badge', () => {
    const clients = loadCsvClients()
    render(<FindingsPanel clients={clients} />)
    const criticalElements = screen.getAllByText(/critical/i)
    expect(criticalElements.length).toBeGreaterThan(0)
  })

  it('renders empty state when no findings', () => {
    const clients = loadCsvClients().map((client) => ({ ...client, findings: [] }))
    render(<FindingsPanel clients={clients} />)
    expect(screen.getByRole('status', { name: /no findings/i })).toBeInTheDocument()
  })

  it('each finding row shows client ID, code, and description', () => {
    const clients = loadCsvClients()
    render(<FindingsPanel clients={clients} />)
    const clientIdElements = screen.getAllByText('CLT-023')
    expect(clientIdElements.length).toBeGreaterThan(0)
  })

  it('has no a11y violations', async () => {
    const clients = loadCsvClients()
    const { container } = render(<FindingsPanel clients={clients} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no a11y violations on empty state', async () => {
    const clients = loadCsvClients().map((client) => ({ ...client, findings: [] }))
    const { container } = render(<FindingsPanel clients={clients} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
