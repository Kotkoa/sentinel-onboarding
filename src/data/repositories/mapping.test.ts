import { describe, it, expect } from 'vitest'
import { toInsertRow, fromRow } from './mapping'
import type { ComplianceRecord } from '../../domain/model/types'
import type { ComplianceRecordRow } from '../supabase/database.types'

const RECORD: ComplianceRecord = {
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
}

describe('mapping — toInsertRow', () => {
  it('maps all required fields to snake_case row shape', () => {
    const row = toInsertRow(RECORD)
    expect(row.id).toBe('rec-001')
    expect(row.client_id).toBe('CLT-001')
    expect(row.assessed_by).toBe('T. Nakamura')
    expect(row.assessed_at).toBeUndefined()
    expect(row.ruleset_version).toBe('1.0.0')
    expect(row.tier).toBe('LOW')
    expect(row.branch).toBe('Mayfair')
    expect(row.sync_status).toBe('SYNCED')
  })

  it('serialises assessment_data, classification, attestation as plain objects', () => {
    const row = toInsertRow(RECORD)
    expect(row.assessment_data).toEqual(RECORD.assessmentData)
    expect(row.classification).toEqual(RECORD.classification)
    expect(row.attestation).toEqual(RECORD.attestation)
  })

  it('maps null branch to null', () => {
    const noBank: ComplianceRecord = {
      ...RECORD,
      assessmentData: { ...RECORD.assessmentData, branch: null },
    }
    const row = toInsertRow(noBank)
    expect(row.branch).toBeNull()
  })

  it('sets sync_status to SYNCED regardless of input syncStatus', () => {
    const local: ComplianceRecord = { ...RECORD, syncStatus: 'LOCAL' }
    const row = toInsertRow(local)
    expect(row.sync_status).toBe('SYNCED')
  })
})

describe('mapping — fromRow', () => {
  const ROW: ComplianceRecordRow = {
    id: 'rec-001',
    client_id: 'CLT-001',
    assessed_by: 'T. Nakamura',
    assessed_at: '2026-06-03T10:00:00.000Z',
    ruleset_version: '1.0.0',
    tier: 'LOW',
    branch: 'Mayfair',
    sync_status: 'SYNCED',
    assessment_data: RECORD.assessmentData,
    classification: RECORD.classification,
    attestation: RECORD.attestation,
    created_at: '2026-06-03T10:00:00.000Z',
  }

  it('maps all required fields to camelCase domain shape', () => {
    const domain = fromRow(ROW)
    expect(domain.id).toBe('rec-001')
    expect(domain.clientId).toBe('CLT-001')
    expect(domain.assessedBy).toBe('T. Nakamura')
    expect(domain.assessedAt).toBe('2026-06-03T10:00:00.000Z')
    expect(domain.rulesetVersion).toBe('1.0.0')
    expect(domain.syncStatus).toBe('SYNCED')
  })

  it('preserves assessmentData fields including nested branch', () => {
    const domain = fromRow(ROW)
    expect(domain.assessmentData.branch).toBe('Mayfair')
    expect(domain.assessmentData.clientName).toBe('Jane Smith')
  })

  it('preserves classification tier and explanation', () => {
    const domain = fromRow(ROW)
    expect(domain.classification.tier).toBe('LOW')
    expect(domain.classification.explanation).toBeTruthy()
  })

  it('preserves attestation fields', () => {
    const domain = fromRow(ROW)
    expect(domain.attestation.attestedBy).toBe('T. Nakamura')
    expect(domain.attestation.statement).toBeTruthy()
  })
})

describe('mapping — round-trip', () => {
  it('domain → row → domain preserves all fields', () => {
    const row = toInsertRow(RECORD)
    const rowAsStored: ComplianceRecordRow = {
      ...row,
      id: row.id ?? RECORD.id,
      assessed_at: RECORD.assessedAt,
      sync_status: row.sync_status ?? 'SYNCED',
      branch: row.branch ?? null,
      created_at: '2026-06-03T10:00:00.000Z',
    }
    const restored = fromRow(rowAsStored)

    expect(restored.id).toBe(RECORD.id)
    expect(restored.clientId).toBe(RECORD.clientId)
    expect(restored.assessedBy).toBe(RECORD.assessedBy)
    expect(restored.assessedAt).toBe(RECORD.assessedAt)
    expect(restored.rulesetVersion).toBe(RECORD.rulesetVersion)
    expect(restored.assessmentData).toEqual(RECORD.assessmentData)
    expect(restored.classification).toEqual(RECORD.classification)
    expect(restored.attestation).toEqual(RECORD.attestation)
  })

  it('no DB-specific types leak into the domain record', () => {
    const row = toInsertRow(RECORD)
    const rowAsStored: ComplianceRecordRow = {
      ...row,
      id: row.id ?? RECORD.id,
      assessed_at: RECORD.assessedAt,
      sync_status: row.sync_status ?? 'SYNCED',
      branch: row.branch ?? null,
      created_at: '2026-06-03T10:00:00.000Z',
    }
    const restored = fromRow(rowAsStored)

    expect(Object.keys(restored)).not.toContain('assessed_by')
    expect(Object.keys(restored)).not.toContain('client_id')
    expect(Object.keys(restored)).not.toContain('created_at')
  })
})
