import { describe, it, expect } from 'vitest'
import { intakeSchema } from './intakeSchema'
import { classify } from '../../domain/rules/evaluator'
import { defaultRuleset } from '../../domain/rules/defaultRuleset'
import type { ClientRecord } from '../../domain/model/types'

const VALID_INPUT = {
  clientName: 'Jane Smith',
  clientType: 'INDIVIDUAL' as const,
  countryOfTaxResidence: 'United Kingdom',
  pepStatus: false,
  sanctionsScreeningMatch: false,
  adverseMediaFlag: false,
  annualIncome: 85000,
  sourceOfFunds: 'Employment',
  kycStatus: 'APPROVED' as const,
  relationshipManager: 'P. Williams',
  branch: 'Mayfair',
  documentationComplete: true,
}

describe('intakeSchema — valid inputs', () => {
  it('accepts a complete valid submission', () => {
    const result = intakeSchema.safeParse(VALID_INPUT)
    expect(result.success).toBe(true)
  })

  it('accepts optional idVerificationDate when provided', () => {
    const result = intakeSchema.safeParse({
      ...VALID_INPUT,
      idVerificationDate: '2024-03-15',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.idVerificationDate).toBe('2024-03-15')
    }
  })

  it('accepts idVerificationDate omitted (optional)', () => {
    const { idVerificationDate: _omitted, ...withoutDate } = { ...VALID_INPUT, idVerificationDate: undefined }
    const result = intakeSchema.safeParse(withoutDate)
    expect(result.success).toBe(true)
  })

  it('accepts all valid client types', () => {
    for (const clientType of ['INDIVIDUAL', 'ENTITY'] as const) {
      const result = intakeSchema.safeParse({ ...VALID_INPUT, clientType })
      expect(result.success).toBe(true)
    }
  })

  it('accepts all valid kyc statuses', () => {
    for (const kycStatus of ['PENDING', 'APPROVED', 'REJECTED', 'ENHANCED_DUE_DILIGENCE'] as const) {
      const result = intakeSchema.safeParse({ ...VALID_INPUT, kycStatus })
      expect(result.success).toBe(true)
    }
  })

  it('accepts annualIncome of 0', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, annualIncome: 0 })
    expect(result.success).toBe(true)
  })

  it('accepts income exactly at MEDIUM threshold (500000)', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, annualIncome: 500000 })
    expect(result.success).toBe(true)
  })
})

describe('intakeSchema — required field validation', () => {
  it('rejects missing clientName', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, clientName: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'clientName')).toBe(true)
    }
  })

  it('rejects missing branch', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, branch: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing countryOfTaxResidence', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, countryOfTaxResidence: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing sourceOfFunds', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, sourceOfFunds: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing relationshipManager', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, relationshipManager: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid clientType', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, clientType: 'PARTNERSHIP' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid kycStatus', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, kycStatus: 'IN_PROGRESS' })
    expect(result.success).toBe(false)
  })

  it('rejects negative annualIncome', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, annualIncome: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects non-numeric annualIncome string', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, annualIncome: 'not-a-number' })
    expect(result.success).toBe(false)
  })
})

describe('intakeSchema — submit-guard logic (defence-in-depth)', () => {
  it('schema accepts APPROVED as a valid value (guard must be in handleSubmit, not schema)', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, kycStatus: 'APPROVED' })
    expect(result.success).toBe(true)
  })

  it('HIGH-risk inputs produce HIGH classification — confirming guard is needed', () => {
    const highRiskRecord: ClientRecord = {
      clientId: 'TEST',
      clientName: 'Test',
      clientType: 'INDIVIDUAL',
      countryOfTaxResidence: 'Russia',
      pepStatus: false,
      sanctionsScreeningMatch: false,
      adverseMediaFlag: false,
      annualIncome: 50000,
      sourceOfFunds: 'Employment',
      kycStatus: 'APPROVED',
      idVerificationDate: null,
      relationshipManager: 'R. Patel',
      branch: 'Mayfair',
      onboardingDate: null,
      recordedRiskClassification: null,
      documentationComplete: true,
      source: 'INTAKE',
    }
    const classification = classify(highRiskRecord, defaultRuleset)
    expect(classification.tier).toBe('HIGH')
  })
})

describe('intakeSchema — alignment with normalize.ts coercions', () => {
  it('pepStatus is boolean (not string "TRUE")', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, pepStatus: 'TRUE' })
    expect(result.success).toBe(false)
  })

  it('documentationComplete is boolean', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, documentationComplete: 'true' })
    expect(result.success).toBe(false)
  })

  it('annualIncome is number (not numeric string)', () => {
    const result = intakeSchema.safeParse({ ...VALID_INPUT, annualIncome: '85000' })
    expect(result.success).toBe(false)
  })
})
