import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntakeForm } from './IntakeForm'
import { InMemoryComplianceRepository } from '../../data/repositories/InMemoryComplianceRepository'
import { axe } from '../../test/setup'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
})

function renderForm(onSuccess?: () => void) {
  const repository = new InMemoryComplianceRepository()
  render(
    <IntakeForm
      repository={repository}
      assessedBy="T. Nakamura"
      onSuccess={onSuccess}
    />,
  )
  return { repository }
}

async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText(/client name/i), 'John Test')
  await userEvent.selectOptions(screen.getByLabelText(/branch/i), 'Mayfair')
  await userEvent.selectOptions(screen.getByLabelText(/client type/i), 'INDIVIDUAL')
  await userEvent.selectOptions(screen.getByLabelText(/country of tax residence/i), 'Netherlands')
  await userEvent.clear(screen.getByLabelText(/annual income/i))
  await userEvent.type(screen.getByLabelText(/annual income/i), '75000')
  await userEvent.selectOptions(screen.getByLabelText(/source of funds/i), 'Employment')
  await userEvent.selectOptions(screen.getByLabelText(/kyc status/i), 'APPROVED')
  await userEvent.type(screen.getByLabelText(/relationship manager/i), 'R. Patel')
}

describe('IntakeForm — live classification', () => {
  it('updates live classification when PEP is set to YES', async () => {
    renderForm()

    await userEvent.selectOptions(screen.getByLabelText(/country of tax residence/i), 'Netherlands')
    await userEvent.selectOptions(screen.getByLabelText(/pep status/i), 'true')

    await waitFor(() => {
      expect(screen.getByText('HIGH')).toBeInTheDocument()
    })
  })

  it('updates live classification when country changes to Russia', async () => {
    renderForm()

    await userEvent.selectOptions(screen.getByLabelText(/country of tax residence/i), 'Russia')

    await waitFor(() => {
      expect(screen.getByText('HIGH')).toBeInTheDocument()
    })
  })

  it('shows MEDIUM classification for ENTITY type', async () => {
    renderForm()

    await userEvent.selectOptions(screen.getByLabelText(/country of tax residence/i), 'Netherlands')
    await userEvent.selectOptions(screen.getByLabelText(/client type/i), 'ENTITY')

    await waitFor(() => {
      expect(screen.getByText('MEDIUM')).toBeInTheDocument()
    })
  })
})

describe('IntakeForm — business-rule guard', () => {
  it('blocks submission of HIGH + APPROVED without EDD', async () => {
    renderForm()

    await userEvent.selectOptions(screen.getByLabelText(/country of tax residence/i), 'Russia')
    await userEvent.type(screen.getByLabelText(/client name/i), 'High Risk Client')
    await userEvent.selectOptions(screen.getByLabelText(/branch/i), 'Mayfair')
    await userEvent.selectOptions(screen.getByLabelText(/client type/i), 'INDIVIDUAL')
    await userEvent.type(screen.getByLabelText(/annual income/i), '50000')
    await userEvent.selectOptions(screen.getByLabelText(/source of funds/i), 'Employment')
    await userEvent.selectOptions(screen.getByLabelText(/kyc status/i), 'APPROVED')
    await userEvent.type(screen.getByLabelText(/relationship manager/i), 'R. Patel')

    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/HIGH risk.*cannot be approved.*EDD/i)
    })
  })

  it('does not block HIGH + ENHANCED_DUE_DILIGENCE', async () => {
    const onSuccess = vi.fn()
    const { repository } = renderForm(onSuccess)

    await userEvent.selectOptions(screen.getByLabelText(/country of tax residence/i), 'Russia')
    await userEvent.type(screen.getByLabelText(/client name/i), 'High Risk EDD Client')
    await userEvent.selectOptions(screen.getByLabelText(/branch/i), 'Mayfair')
    await userEvent.selectOptions(screen.getByLabelText(/client type/i), 'INDIVIDUAL')
    await userEvent.type(screen.getByLabelText(/annual income/i), '50000')
    await userEvent.selectOptions(screen.getByLabelText(/source of funds/i), 'Employment')
    await userEvent.selectOptions(screen.getByLabelText(/kyc status/i), 'ENHANCED_DUE_DILIGENCE')
    await userEvent.type(screen.getByLabelText(/relationship manager/i), 'R. Patel')

    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /attestation/i })).toBeInTheDocument()
    })

    expect(repository).toBeDefined()
  })
})

describe('IntakeForm — validation', () => {
  it('shows required field errors when submitted empty', async () => {
    renderForm()

    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    })
  })

  it('shows aria-invalid on required fields with errors', async () => {
    renderForm()

    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      const clientNameInput = screen.getByLabelText(/client name/i)
      expect(clientNameInput).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('clears error when field is filled', async () => {
    renderForm()

    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/client name/i)).toHaveAttribute('aria-invalid', 'true')
    })

    await userEvent.type(screen.getByLabelText(/client name/i), 'Valid Name')

    await waitFor(() => {
      expect(screen.getByLabelText(/client name/i)).not.toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('does not create a record when form has errors', async () => {
    const onSuccess = vi.fn()
    renderForm(onSuccess)

    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    })

    expect(onSuccess).not.toHaveBeenCalled()
  })
})

describe('IntakeForm — successful submit', () => {
  it('shows attestation step after valid form submit', async () => {
    renderForm()
    await fillRequiredFields()

    await userEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /attestation/i })).toBeInTheDocument()
    })
  })

  it('creates ComplianceRecord with correct fields on attestation', async () => {
    const onSuccess = vi.fn()
    const { repository } = renderForm(onSuccess)
    await fillRequiredFields()

    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => screen.getByRole('heading', { name: /attestation/i }))

    await userEvent.click(screen.getByRole('button', { name: /confirm.*attest/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })

    const records = await repository.list()
    expect(records).toHaveLength(1)
    const saved = records[0]!
    expect(saved.assessedBy).toBe('T. Nakamura')
    expect(saved.assessedAt).toBeTruthy()
    expect(saved.attestation.statement).toBeTruthy()
    expect(saved.rulesetVersion).toBe('1.0.0')
    expect(saved.classification.tier).toBe('LOW')
    expect(saved.syncStatus).toBe('LOCAL')
  })
})

describe('IntakeForm — a11y', () => {
  it('has no a11y violations on initial render', async () => {
    const { container } = render(
      <IntakeForm repository={new InMemoryComplianceRepository()} assessedBy="T. Nakamura" />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no a11y violations with validation errors', async () => {
    const { container } = render(
      <IntakeForm repository={new InMemoryComplianceRepository()} assessedBy="T. Nakamura" />,
    )

    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => screen.getAllByRole('alert'))

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
