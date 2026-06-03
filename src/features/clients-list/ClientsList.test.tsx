import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientsList } from './ClientsList'
import { loadCsvClients } from '../../test/helpers'
import { axe } from '../../test/setup'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
})

describe('ClientsList', () => {
  it('renders ~46 rows from CSV fixture', () => {
    const clients = loadCsvClients()
    render(<ClientsList clients={clients} />)
    const rows = screen.getAllByRole('button')
    expect(rows.length).toBeGreaterThanOrEqual(46)
  })

  it('shows misclassification visual marker for known dirty rows', () => {
    const clients = loadCsvClients()
    render(<ClientsList clients={clients} />)
    const misclassifiedRows = screen.getAllByText('⚠ Mismatch')
    expect(misclassifiedRows.length).toBeGreaterThanOrEqual(3)
  })

  it('marks CLT-005 row as misclassified', () => {
    const clients = loadCsvClients()
    render(<ClientsList clients={clients} />)
    const row = screen.getByTestId('row-CLT-005')
    expect(row).toHaveAttribute('data-misclassified', 'true')
  })

  it('marks CLT-017 row as misclassified', () => {
    const clients = loadCsvClients()
    render(<ClientsList clients={clients} />)
    const row = screen.getByTestId('row-CLT-017')
    expect(row).toHaveAttribute('data-misclassified', 'true')
  })

  it('marks CLT-031 row as misclassified', () => {
    const clients = loadCsvClients()
    render(<ClientsList clients={clients} />)
    const row = screen.getByTestId('row-CLT-031')
    expect(row).toHaveAttribute('data-misclassified', 'true')
  })

  it('does not mark a clean row as misclassified', () => {
    const clients = loadCsvClients()
    render(<ClientsList clients={clients} />)
    const row = screen.getByTestId('row-CLT-001')
    expect(row).not.toHaveAttribute('data-misclassified')
  })
})

describe('ClientsList — filters', () => {
  it('filters by branch', async () => {
    const clients = loadCsvClients()
    render(<ClientsList clients={clients} />)

    const mayfairClients = clients.filter((client) => client.record.branch === 'Mayfair')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Branch' }), 'Mayfair')

    const rows = screen.getAllByRole('button').filter((button) =>
      button.getAttribute('aria-label')?.includes('View details'),
    )
    expect(rows.length).toBe(mayfairClients.length)
  })

  it('filters by risk tier HIGH', async () => {
    const clients = loadCsvClients()
    render(<ClientsList clients={clients} />)

    const highClients = clients.filter((client) => client.classification.tier === 'HIGH')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Risk tier' }), 'HIGH')

    const rows = screen.getAllByRole('button').filter((button) =>
      button.getAttribute('aria-label')?.includes('View details'),
    )
    expect(rows.length).toBe(highClients.length)
  })

  it('filters by has findings', async () => {
    const clients = loadCsvClients()
    render(<ClientsList clients={clients} />)

    const clientsWithFindings = clients.filter((client) => client.findings.length > 0)

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Findings' }),
      'HAS_FINDINGS',
    )

    const rows = screen.getAllByRole('button').filter((button) =>
      button.getAttribute('aria-label')?.includes('View details'),
    )
    expect(rows.length).toBe(clientsWithFindings.length)
  })

  it('shows empty state when no results match filters', async () => {
    const clients = loadCsvClients()
    render(<ClientsList clients={clients} />)

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Branch' }), 'Mayfair')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Risk tier' }), 'HIGH')
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Findings' }),
      'HAS_FINDINGS',
    )

    const mayfairHighWithFindings = clients.filter(
      (client) =>
        client.record.branch === 'Mayfair' &&
        client.classification.tier === 'HIGH' &&
        client.findings.length > 0,
    )

    const rows = screen
      .queryAllByRole('button')
      .filter((button) => button.getAttribute('aria-label')?.includes('View details'))
    expect(rows.length).toBe(mayfairHighWithFindings.length)
  })
})

describe('ClientsList — drawer', () => {
  it('opens dialog when row is clicked', async () => {
    const clients = loadCsvClients()
    render(<ClientsList clients={clients} />)

    const firstRow = screen.getByTestId('row-CLT-001')
    await userEvent.click(firstRow)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('opens dialog when row is activated via Enter key', async () => {
    const clients = loadCsvClients()
    render(<ClientsList clients={clients} />)

    const firstRow = screen.getByTestId('row-CLT-001')
    firstRow.focus()
    await userEvent.keyboard('{Enter}')

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows computed and recorded risk tiers in dialog', async () => {
    const clients = loadCsvClients()
    render(<ClientsList clients={clients} />)

    const row = screen.getByTestId('row-CLT-005')
    await userEvent.click(row)

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Computed')).toBeInTheDocument()
    expect(within(dialog).getByText('Recorded')).toBeInTheDocument()
  })

  it('closes dialog when close button clicked', async () => {
    const clients = loadCsvClients()
    render(<ClientsList clients={clients} />)

    await userEvent.click(screen.getByTestId('row-CLT-001'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('ClientsList — a11y', () => {
  it('has no a11y violations', async () => {
    const clients = loadCsvClients().slice(0, 5)
    const { container } = render(<ClientsList clients={clients} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
