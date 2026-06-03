import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryComplianceRepository } from './InMemoryComplianceRepository'
import type { ComplianceRepository } from './ComplianceRepository'
import type { ComplianceRecord } from '../../domain/model/types'

function makeRecord(overrides: Partial<ComplianceRecord> = {}): ComplianceRecord {
  return {
    id: 'rec-001',
    clientId: 'CLT-001',
    assessedBy: 'T. Nakamura',
    assessedAt: '2026-06-03T10:00:00.000Z',
    rulesetVersion: '1.0.0',
    syncStatus: 'LOCAL',
    assessmentData: {
      clientId: 'CLT-001',
      clientName: 'Jane Smith',
      clientType: 'INDIVIDUAL',
      countryOfTaxResidence: 'United Kingdom',
      pepStatus: false,
      sanctionsScreeningMatch: false,
      adverseMediaFlag: false,
      annualIncome: 85000,
      sourceOfFunds: 'Employment',
      kycStatus: 'APPROVED',
      idVerificationDate: '2024-01-15',
      relationshipManager: 'P. Williams',
      branch: 'Mayfair',
      onboardingDate: null,
      recordedRiskClassification: null,
      documentationComplete: true,
      source: 'INTAKE',
    },
    classification: {
      tier: 'LOW',
      hits: [],
      decidingHits: [],
      rulesetVersion: '1.0.0',
      explanation: 'No HIGH or MEDIUM rules triggered.',
      evaluatedAt: '2026-06-03T10:00:00.000Z',
    },
    attestation: {
      attestedBy: 'T. Nakamura',
      attestedAt: '2026-06-03T10:01:00.000Z',
      statement: 'I confirm this assessment is accurate to the best of my knowledge.',
    },
    ...overrides,
  }
}

function runContractTests(
  label: string,
  makeRepository: () => ComplianceRepository,
) {
  describe(label, () => {
    let repository: ComplianceRepository

    beforeEach(() => {
      repository = makeRepository()
    })

    it('save() then list() returns the saved record', async () => {
      const record = makeRecord()
      await repository.save(record)
      const records = await repository.list()
      expect(records).toHaveLength(1)
      expect(records[0]!.id).toBe(record.id)
    })

    it('list() returns records in most-recent-first order when multiple saved', async () => {
      const first = makeRecord({ id: 'rec-001', assessedAt: '2026-06-01T10:00:00.000Z' })
      const second = makeRecord({ id: 'rec-002', assessedAt: '2026-06-03T10:00:00.000Z' })
      await repository.save(first)
      await repository.save(second)
      const records = await repository.list()
      expect(records).toHaveLength(2)
      expect(records[0]!.assessedAt >= records[1]!.assessedAt).toBe(true)
    })

    it('getByClientId() returns only matching records', async () => {
      await repository.save(makeRecord({ id: 'rec-001', clientId: 'CLT-001' }))
      await repository.save(makeRecord({ id: 'rec-002', clientId: 'CLT-002' }))
      await repository.save(makeRecord({ id: 'rec-003', clientId: 'CLT-001' }))

      const forClt001 = await repository.getByClientId('CLT-001')
      expect(forClt001).toHaveLength(2)
      expect(forClt001.every((record) => record.clientId === 'CLT-001')).toBe(true)
    })

    it('getByClientId() returns empty array for unknown clientId', async () => {
      await repository.save(makeRecord())
      const records = await repository.getByClientId('CLT-UNKNOWN')
      expect(records).toHaveLength(0)
    })

    it('list() returns empty array before any saves', async () => {
      const records = await repository.list()
      expect(records).toHaveLength(0)
    })

    it('saved record preserves assessedBy, assessedAt, rulesetVersion (attributable + contemporaneous)', async () => {
      const record = makeRecord()
      await repository.save(record)
      const saved = (await repository.list())[0]!
      expect(saved.assessedBy).toBe('T. Nakamura')
      expect(saved.assessedAt).toBe('2026-06-03T10:00:00.000Z')
      expect(saved.rulesetVersion).toBe('1.0.0')
    })

    it('saved record preserves attestation', async () => {
      const record = makeRecord()
      await repository.save(record)
      const saved = (await repository.list())[0]!
      expect(saved.attestation.attestedBy).toBe('T. Nakamura')
      expect(saved.attestation.statement).toBeTruthy()
    })

    it('interface has no update or delete methods (append-only by type)', () => {
      expect((repository as Record<string, unknown>)['update']).toBeUndefined()
      expect((repository as Record<string, unknown>)['delete']).toBeUndefined()
      expect((repository as Record<string, unknown>)['deleteAll']).toBeUndefined()
    })
  })
}

runContractTests(
  'ComplianceRepository contract — InMemoryComplianceRepository',
  () => new InMemoryComplianceRepository(),
)
