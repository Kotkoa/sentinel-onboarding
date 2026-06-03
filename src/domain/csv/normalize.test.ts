import { describe, it, expect } from 'vitest'
import { normalizeRow } from './normalize'
import type { RawCsvRow } from '../model/types'

const base: RawCsvRow = {
  client_id: 'CLT-TEST',
  client_name: 'Test User',
  client_type: 'INDIVIDUAL',
  country_of_tax_residence: 'Netherlands',
  pep_status: 'FALSE',
  sanctions_screening_match: 'FALSE',
  adverse_media_flag: 'FALSE',
  annual_income: '100000',
  source_of_funds: 'Employment',
  kyc_status: 'APPROVED',
  id_verification_date: '2024-01-01',
  relationship_manager: 'R. Patel',
  branch: 'Mayfair',
  onboarding_date: '2024-01-01',
  risk_classification: 'LOW',
  documentation_complete: 'TRUE',
}

describe('normalizeRow', () => {
  it('returns null when client_id is missing', () => {
    expect(normalizeRow({ ...base, client_id: undefined })).toBeNull()
    expect(normalizeRow({ ...base, client_id: '' })).toBeNull()
  })

  it('preserves clientId from client_id', () => {
    const record = normalizeRow(base)
    expect(record?.clientId).toBe('CLT-TEST')
  })

  describe('boolean coercion', () => {
    it('coerces "TRUE" → true', () => {
      expect(normalizeRow({ ...base, pep_status: 'TRUE' })?.pepStatus).toBe(true)
    })

    it('coerces "true" (lowercase) → true', () => {
      expect(normalizeRow({ ...base, pep_status: 'true' })?.pepStatus).toBe(true)
    })

    it('coerces "FALSE" → false', () => {
      expect(normalizeRow({ ...base, pep_status: 'FALSE' })?.pepStatus).toBe(false)
    })

    it('coerces "" (empty) → null', () => {
      expect(normalizeRow({ ...base, pep_status: '' })?.pepStatus).toBeNull()
    })

    it('coerces undefined → null', () => {
      expect(normalizeRow({ ...base, pep_status: undefined })?.pepStatus).toBeNull()
    })

    it('coerces garbage → null', () => {
      expect(normalizeRow({ ...base, pep_status: 'yes' })?.pepStatus).toBeNull()
    })

    it('handles sanctions_screening_match and adverse_media_flag the same way', () => {
      const record = normalizeRow({
        ...base,
        sanctions_screening_match: 'TRUE',
        adverse_media_flag: 'FALSE',
      })
      expect(record?.sanctionsScreeningMatch).toBe(true)
      expect(record?.adverseMediaFlag).toBe(false)
    })
  })

  describe('annual_income coercion', () => {
    it('parses "1200000" → 1200000', () => {
      expect(normalizeRow({ ...base, annual_income: '1200000' })?.annualIncome).toBe(1200000)
    })

    it('parses "" → null', () => {
      expect(normalizeRow({ ...base, annual_income: '' })?.annualIncome).toBeNull()
    })

    it('parses undefined → null', () => {
      expect(normalizeRow({ ...base, annual_income: undefined })?.annualIncome).toBeNull()
    })

    it('parses garbage text → null', () => {
      expect(normalizeRow({ ...base, annual_income: 'N/A' })?.annualIncome).toBeNull()
    })

    it('parses "0" → 0', () => {
      expect(normalizeRow({ ...base, annual_income: '0' })?.annualIncome).toBe(0)
    })
  })

  describe('enum coercion', () => {
    it('accepts valid client_type INDIVIDUAL', () => {
      expect(normalizeRow({ ...base, client_type: 'INDIVIDUAL' })?.clientType).toBe('INDIVIDUAL')
    })

    it('accepts valid client_type ENTITY', () => {
      expect(normalizeRow({ ...base, client_type: 'ENTITY' })?.clientType).toBe('ENTITY')
    })

    it('returns null for invalid client_type', () => {
      expect(normalizeRow({ ...base, client_type: 'PERSON' })?.clientType).toBeNull()
    })

    it('returns null for missing client_type', () => {
      expect(normalizeRow({ ...base, client_type: undefined })?.clientType).toBeNull()
    })

    it('accepts valid kyc_status values', () => {
      expect(normalizeRow({ ...base, kyc_status: 'APPROVED' })?.kycStatus).toBe('APPROVED')
      expect(normalizeRow({ ...base, kyc_status: 'PENDING' })?.kycStatus).toBe('PENDING')
      expect(normalizeRow({ ...base, kyc_status: 'REJECTED' })?.kycStatus).toBe('REJECTED')
      expect(
        normalizeRow({ ...base, kyc_status: 'ENHANCED_DUE_DILIGENCE' })?.kycStatus,
      ).toBe('ENHANCED_DUE_DILIGENCE')
    })

    it('returns null for invalid kyc_status', () => {
      expect(normalizeRow({ ...base, kyc_status: 'UNKNOWN' })?.kycStatus).toBeNull()
    })

    it('accepts valid risk_classification', () => {
      expect(
        normalizeRow({ ...base, risk_classification: 'HIGH' })?.recordedRiskClassification,
      ).toBe('HIGH')
    })

    it('returns null for invalid risk_classification', () => {
      expect(
        normalizeRow({ ...base, risk_classification: 'EXTREME' })?.recordedRiskClassification,
      ).toBeNull()
    })
  })

  it('sets source to CSV_IMPORT', () => {
    expect(normalizeRow(base)?.source).toBe('CSV_IMPORT')
  })

  it('keeps row alive even with multiple null fields', () => {
    const partial: RawCsvRow = { client_id: 'CLT-PARTIAL' }
    const record = normalizeRow(partial)
    expect(record).not.toBeNull()
    expect(record?.clientId).toBe('CLT-PARTIAL')
    expect(record?.pepStatus).toBeNull()
    expect(record?.annualIncome).toBeNull()
    expect(record?.clientType).toBeNull()
  })
})
