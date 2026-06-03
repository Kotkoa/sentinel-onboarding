import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ClientsList } from '../features/clients-list/ClientsList'
import { IntakeForm } from '../features/intake/IntakeForm'
import { AuditDashboard } from '../features/audit/AuditDashboard'
import { FindingsPanel } from '../features/findings/FindingsPanel'
import { RulesetInspector } from '../features/ruleset/RulesetInspector'
import { AssessmentsList } from '../features/assessments/AssessmentsList'
import { InMemoryComplianceRepository } from '../data/repositories/InMemoryComplianceRepository'
import { loadCsvClients } from './helpers'
import { axe } from './setup'
import type { ComplianceRecord } from '../domain/model/types'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
})

const sampleRecord: ComplianceRecord = {
  id: 'CR-a11y-001',
  clientId: 'INTAKE-001',
  assessmentData: {
    clientId: 'INTAKE-001',
    clientName: 'A11y Test Client',
    clientType: 'INDIVIDUAL',
    countryOfTaxResidence: 'Netherlands',
    pepStatus: false,
    sanctionsScreeningMatch: false,
    adverseMediaFlag: false,
    annualIncome: 50000,
    sourceOfFunds: 'Employment',
    kycStatus: 'APPROVED',
    idVerificationDate: '2024-01-01',
    relationshipManager: 'R. Patel',
    branch: 'Mayfair',
    onboardingDate: '2024-01-01',
    recordedRiskClassification: null,
    documentationComplete: true,
    source: 'INTAKE',
  },
  classification: {
    tier: 'LOW',
    hits: [],
    decidingHits: [],
    rulesetVersion: '1.0.0',
    explanation: 'No risk triggers identified. Classified as LOW.',
    evaluatedAt: new Date().toISOString(),
  },
  assessedBy: 'T. Nakamura',
  assessedAt: '2024-06-03T10:00:00.000Z',
  rulesetVersion: '1.0.0',
  attestation: {
    attestedBy: 'T. Nakamura',
    attestedAt: '2024-06-03T10:00:00.000Z',
    statement: 'I attest this is accurate.',
  },
  syncStatus: 'LOCAL',
}

describe('A11y — all main screens', () => {
  const clients = loadCsvClients()
  const emptyClients = clients.map((client) => ({ ...client, findings: [] }))
  const repository = new InMemoryComplianceRepository()

  it('ClientsList has no a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <ClientsList clients={clients} />
      </MemoryRouter>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('ClientsList empty state has no a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <ClientsList clients={[]} />
      </MemoryRouter>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('IntakeForm has no a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <IntakeForm repository={repository} assessedBy="Test RM" />
      </MemoryRouter>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('AuditDashboard has no a11y violations (empty records)', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuditDashboard clients={clients} complianceRecords={[]} />
      </MemoryRouter>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('AuditDashboard has no a11y violations (with compliance records)', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuditDashboard clients={clients} complianceRecords={[sampleRecord]} />
      </MemoryRouter>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('FindingsPanel has no a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <FindingsPanel clients={clients} />
      </MemoryRouter>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('FindingsPanel empty state has no a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <FindingsPanel clients={emptyClients} />
      </MemoryRouter>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('RulesetInspector has no a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <RulesetInspector />
      </MemoryRouter>,
    )
    await vi.waitFor(() => {
      expect(container.querySelector('[aria-live]')).not.toBeNull()
    })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('AssessmentsList empty state has no a11y violations', async () => {
    const emptyRepository = new InMemoryComplianceRepository()
    const { container } = render(
      <MemoryRouter>
        <AssessmentsList records={[]} repository={emptyRepository} />
      </MemoryRouter>,
    )
    await vi.waitFor(() => {
      expect(container.textContent).toContain('No assessments')
    })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('AssessmentsList with records has no a11y violations', async () => {
    const filledRepository = new InMemoryComplianceRepository()
    await filledRepository.save(sampleRecord)
    const { container } = render(
      <MemoryRouter>
        <AssessmentsList records={[sampleRecord]} repository={filledRepository} />
      </MemoryRouter>,
    )
    await vi.waitFor(() => {
      expect(container.textContent).toContain('T. Nakamura')
    })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
