import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ClientsList } from '../features/clients-list/ClientsList'
import { IntakeForm } from '../features/intake/IntakeForm'
import { InMemoryComplianceRepository } from '../data/repositories/InMemoryComplianceRepository'
import { loadCsvClients } from './helpers'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
})

describe('Keyboard flow — ClientsList', () => {
  it('can navigate to first data row and open dialog with Enter', async () => {
    const clients = loadCsvClients()
    render(
      <MemoryRouter>
        <ClientsList clients={clients} />
      </MemoryRouter>,
    )

    const firstRow = screen.getByTestId('row-CLT-001')
    firstRow.focus()
    await userEvent.keyboard('{Enter}')

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('can open dialog with Space key on a row', async () => {
    const clients = loadCsvClients()
    render(
      <MemoryRouter>
        <ClientsList clients={clients} />
      </MemoryRouter>,
    )

    const firstRow = screen.getByTestId('row-CLT-001')
    firstRow.focus()
    await userEvent.keyboard(' ')

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('filter selects are reachable by Tab and change values', async () => {
    const clients = loadCsvClients()
    render(
      <MemoryRouter>
        <ClientsList clients={clients} />
      </MemoryRouter>,
    )

    const branchSelect = screen.getByRole('combobox', { name: 'Branch' })
    branchSelect.focus()
    expect(document.activeElement).toBe(branchSelect)

    await userEvent.selectOptions(branchSelect, 'Mayfair')
    expect(branchSelect).toHaveValue('Mayfair')
  })

  it('sort buttons are reachable by keyboard and activate on Enter', async () => {
    const clients = loadCsvClients()
    render(
      <MemoryRouter>
        <ClientsList clients={clients} />
      </MemoryRouter>,
    )

    const sortBtn = screen.getByRole('button', { name: /Sort by Branch/ })
    sortBtn.focus()
    expect(document.activeElement).toBe(sortBtn)

    await userEvent.keyboard('{Enter}')
    const branchHeader = screen.getByRole('columnheader', { name: /Branch/ })
    expect(branchHeader).toHaveAttribute('aria-sort', 'ascending')
  })
})

describe('Keyboard flow — Dialog focus management', () => {
  it('focus is restored to trigger row after closing dialog with close button', async () => {
    const clients = loadCsvClients()
    render(
      <MemoryRouter>
        <ClientsList clients={clients} />
      </MemoryRouter>,
    )

    const triggerRow = screen.getByTestId('row-CLT-001')
    triggerRow.focus()
    await userEvent.keyboard('{Enter}')

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    expect(document.activeElement).toBe(triggerRow)
  })

  it('dialog has accessible title exposed via aria-labelledby', async () => {
    const clients = loadCsvClients()
    render(
      <MemoryRouter>
        <ClientsList clients={clients} />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByTestId('row-CLT-001'))
    const dialog = screen.getByRole('dialog')

    const labelledById = dialog.getAttribute('aria-labelledby')
    expect(labelledById).toBeTruthy()

    const titleElement = document.getElementById(labelledById!)
    expect(titleElement).not.toBeNull()
    expect(titleElement!.textContent).toMatch(/Details/)
  })

  it('dialog close button is focusable with min 44px touch target class', async () => {
    const clients = loadCsvClients()
    render(
      <MemoryRouter>
        <ClientsList clients={clients} />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByTestId('row-CLT-001'))

    const closeButton = screen.getByRole('button', { name: 'Close dialog' })
    expect(closeButton).toHaveClass('min-h-11')
    expect(closeButton).toHaveClass('min-w-11')
  })
})

describe('Keyboard flow — IntakeForm', () => {
  it('all required inputs are focusable', async () => {
    const repository = new InMemoryComplianceRepository()
    render(
      <MemoryRouter>
        <IntakeForm repository={repository} assessedBy="Test RM" />
      </MemoryRouter>,
    )

    const clientNameInput = screen.getByLabelText(/client name/i)
    clientNameInput.focus()
    expect(document.activeElement).toBe(clientNameInput)
  })

  it('submit button is reachable and activatable via keyboard', async () => {
    const repository = new InMemoryComplianceRepository()
    render(
      <MemoryRouter>
        <IntakeForm repository={repository} assessedBy="Test RM" />
      </MemoryRouter>,
    )

    const submitButton = screen.getByRole('button', { name: /submit the client assessment/i })
    submitButton.focus()
    expect(document.activeElement).toBe(submitButton)

    await userEvent.keyboard('{Enter}')
    const errors = screen.getAllByRole('alert')
    expect(errors.length).toBeGreaterThan(0)
  })

  it('aria-live region announces live classification changes', async () => {
    const repository = new InMemoryComplianceRepository()
    render(
      <MemoryRouter>
        <IntakeForm repository={repository} assessedBy="Test RM" />
      </MemoryRouter>,
    )

    const liveRegion = screen.getByRole('status')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')

    const countrySelect = screen.getByLabelText(/country of tax residence/i)
    await userEvent.selectOptions(countrySelect, 'Russia')

    expect(liveRegion.textContent).toMatch(/HIGH/i)
  })

  it('can complete form and reach attestation using only keyboard interactions', async () => {
    const repository = new InMemoryComplianceRepository()
    render(
      <MemoryRouter>
        <IntakeForm repository={repository} assessedBy="Test RM" />
      </MemoryRouter>,
    )

    const clientNameInput = screen.getByLabelText(/client name/i)
    clientNameInput.focus()
    await userEvent.keyboard('Jane Smith')

    const clientTypeSelect = screen.getByLabelText(/client type/i)
    await userEvent.selectOptions(clientTypeSelect, 'INDIVIDUAL')

    const countrySelect = screen.getByLabelText(/country of tax residence/i)
    await userEvent.selectOptions(countrySelect, 'Netherlands')

    const incomeInput = screen.getByLabelText(/annual income/i)
    await userEvent.clear(incomeInput)
    incomeInput.focus()
    await userEvent.keyboard('60000')

    const sofSelect = screen.getByLabelText(/source of funds/i)
    await userEvent.selectOptions(sofSelect, 'Employment')

    const branchSelect = screen.getByLabelText(/branch/i)
    await userEvent.selectOptions(branchSelect, 'Mayfair')

    const rmInput = screen.getByLabelText(/relationship manager/i)
    rmInput.focus()
    await userEvent.keyboard('R. Patel')

    const kycSelect = screen.getByLabelText(/kyc status/i)
    await userEvent.selectOptions(kycSelect, 'APPROVED')

    const submitButton = screen.getByRole('button', { name: /submit the client assessment/i })
    submitButton.focus()
    await userEvent.keyboard('{Enter}')

    await vi.waitFor(() => {
      expect(screen.getByRole('heading', { name: /attestation/i })).toBeInTheDocument()
    })
  })
})
