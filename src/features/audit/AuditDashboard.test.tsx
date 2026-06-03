import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { AuditDashboard } from './AuditDashboard'
import { loadCsvClients } from '../../test/helpers'
import type { ComplianceRecord } from '../../domain/model/types'
import { computeKpis } from '../../lib/kpiSelectors'
import { axe } from '../../test/setup'

const sampleComplianceRecord: ComplianceRecord = {
  id: 'CR-001',
  clientId: 'INTAKE-001',
  assessmentData: {
    clientId: 'INTAKE-001',
    clientName: 'Test Client',
    clientType: 'INDIVIDUAL',
    countryOfTaxResidence: 'Netherlands',
    pepStatus: false,
    sanctionsScreeningMatch: false,
    adverseMediaFlag: false,
    annualIncome: 75000,
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

describe('AuditDashboard', () => {
  it('renders KPI total clients as 46', () => {
    const clients = loadCsvClients()
    render(<AuditDashboard clients={clients} complianceRecords={[]} />)
    expect(screen.getByLabelText('Total clients: 46')).toBeInTheDocument()
  })

  it('renders HIGH risk percentage KPI', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    render(<AuditDashboard clients={clients} complianceRecords={[]} />)
    expect(screen.getByText(`${kpis.highRiskPercent}%`)).toBeInTheDocument()
  })

  it('renders open findings count KPI', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    render(<AuditDashboard clients={clients} complianceRecords={[]} />)
    expect(screen.getByLabelText(`Open findings: ${kpis.openFindingsCount}`)).toBeInTheDocument()
  })

  it('renders clients with findings KPI', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    render(<AuditDashboard clients={clients} complianceRecords={[]} />)
    expect(
      screen.getByLabelText(`Clients with findings: ${kpis.clientsWithFindingsCount}`),
    ).toBeInTheDocument()
  })

  it('renders missing RM attributability gap KPI', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    render(<AuditDashboard clients={clients} complianceRecords={[]} />)
    expect(screen.getByLabelText(`Missing RM: ${kpis.missingRmPercent}%`)).toBeInTheDocument()
  })

  it('renders branch distribution table', () => {
    const clients = loadCsvClients()
    render(<AuditDashboard clients={clients} complianceRecords={[]} />)
    const table = screen.getByRole('table', { name: /branch distribution/i })
    expect(table).toBeInTheDocument()
    expect(within(table).getByText('Mayfair')).toBeInTheDocument()
    expect(within(table).getByText('Edinburgh')).toBeInTheDocument()
    expect(within(table).getByText('Manchester')).toBeInTheDocument()
    expect(within(table).getByText('Canary Wharf')).toBeInTheDocument()
  })

  it('shows audit log when compliance records exist', () => {
    const clients = loadCsvClients()
    render(<AuditDashboard clients={clients} complianceRecords={[sampleComplianceRecord]} />)
    const auditLog = screen.getByRole('table', { name: /audit log/i })
    expect(auditLog).toBeInTheDocument()
    expect(within(auditLog).getByText('T. Nakamura')).toBeInTheDocument()
    expect(within(auditLog).getByText('INTAKE-001')).toBeInTheDocument()
  })

  it('does not show audit log when no compliance records', () => {
    const clients = loadCsvClients()
    render(<AuditDashboard clients={clients} complianceRecords={[]} />)
    expect(screen.queryByRole('table', { name: /audit log/i })).not.toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const clients = loadCsvClients()
    const { container } = render(
      <AuditDashboard clients={clients} complianceRecords={[sampleComplianceRecord]} />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
