import { describe, it, expect } from 'vitest'
import { detectFindings } from './findings'
import { classify } from '../rules/evaluator'
import { defaultRuleset } from '../rules/defaultRuleset'
import { parseCsv } from '../csv/parse'
import { normalizeRow } from '../csv/normalize'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { ClientRecord, ClassificationResult } from '../model/types'

const baseRecord: ClientRecord = {
  clientId: 'CLT-TEST',
  clientName: 'Test User',
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
  recordedRiskClassification: 'LOW',
  documentationComplete: true,
  source: 'CSV_IMPORT',
}

const lowClassification: ClassificationResult = {
  tier: 'LOW',
  hits: [],
  decidingHits: [],
  rulesetVersion: '1.0.0',
  explanation: 'No risk triggers identified. Classified as LOW.',
  evaluatedAt: new Date().toISOString(),
}

const highClassification: ClassificationResult = {
  tier: 'HIGH',
  hits: [{ ruleId: 'HIGH-PEP', tier: 'HIGH', description: 'PEP' }],
  decidingHits: [{ ruleId: 'HIGH-PEP', tier: 'HIGH', description: 'PEP' }],
  rulesetVersion: '1.0.0',
  explanation: 'Classified as HIGH due to: PEP.',
  evaluatedAt: new Date().toISOString(),
}

describe('detectFindings — MISCLASSIFIED', () => {
  it('fires when recorded tier differs from computed', () => {
    const findings = detectFindings(
      { ...baseRecord, recordedRiskClassification: 'LOW' },
      highClassification,
    )
    expect(findings.some((finding) => finding.code === 'MISCLASSIFIED')).toBe(true)
  })

  it('does not fire when tiers match', () => {
    const findings = detectFindings(
      { ...baseRecord, recordedRiskClassification: 'LOW' },
      lowClassification,
    )
    expect(findings.some((finding) => finding.code === 'MISCLASSIFIED')).toBe(false)
  })

  it('does not fire when recordedRiskClassification is null', () => {
    const findings = detectFindings(
      { ...baseRecord, recordedRiskClassification: null },
      highClassification,
    )
    expect(findings.some((finding) => finding.code === 'MISCLASSIFIED')).toBe(false)
  })
})

describe('detectFindings — MISSING_RM', () => {
  it('fires when relationship_manager is null', () => {
    const findings = detectFindings(
      { ...baseRecord, relationshipManager: null },
      lowClassification,
    )
    expect(findings.some((finding) => finding.code === 'MISSING_RM')).toBe(true)
  })

  it('does not fire when relationship_manager is set', () => {
    const findings = detectFindings(baseRecord, lowClassification)
    expect(findings.some((finding) => finding.code === 'MISSING_RM')).toBe(false)
  })
})

describe('detectFindings — APPROVED_WITHOUT_ID_VERIFICATION', () => {
  it('fires when APPROVED and no id_verification_date', () => {
    const findings = detectFindings(
      { ...baseRecord, kycStatus: 'APPROVED', idVerificationDate: null },
      lowClassification,
    )
    expect(findings.some((finding) => finding.code === 'APPROVED_WITHOUT_ID_VERIFICATION')).toBe(true)
  })

  it('does not fire when APPROVED with id_verification_date', () => {
    const findings = detectFindings(
      { ...baseRecord, kycStatus: 'APPROVED', idVerificationDate: '2024-01-01' },
      lowClassification,
    )
    expect(findings.some((finding) => finding.code === 'APPROVED_WITHOUT_ID_VERIFICATION')).toBe(false)
  })

  it('does not fire for PENDING without id_verification_date (false-positive guard)', () => {
    const findings = detectFindings(
      { ...baseRecord, kycStatus: 'PENDING', idVerificationDate: null },
      lowClassification,
    )
    expect(findings.some((finding) => finding.code === 'APPROVED_WITHOUT_ID_VERIFICATION')).toBe(false)
  })

  it('does not fire for REJECTED without id_verification_date', () => {
    const findings = detectFindings(
      { ...baseRecord, kycStatus: 'REJECTED', idVerificationDate: null },
      lowClassification,
    )
    expect(findings.some((finding) => finding.code === 'APPROVED_WITHOUT_ID_VERIFICATION')).toBe(false)
  })
})

describe('detectFindings — HIGH_RISK_APPROVED_WITHOUT_EDD', () => {
  it('fires for HIGH risk + APPROVED', () => {
    const findings = detectFindings(
      { ...baseRecord, kycStatus: 'APPROVED' },
      highClassification,
    )
    expect(findings.some((finding) => finding.code === 'HIGH_RISK_APPROVED_WITHOUT_EDD')).toBe(true)
  })

  it('does not fire for HIGH risk + ENHANCED_DUE_DILIGENCE', () => {
    const findings = detectFindings(
      { ...baseRecord, kycStatus: 'ENHANCED_DUE_DILIGENCE' },
      highClassification,
    )
    expect(findings.some((finding) => finding.code === 'HIGH_RISK_APPROVED_WITHOUT_EDD')).toBe(false)
  })

  it('does not fire for LOW risk + APPROVED', () => {
    const findings = detectFindings(
      { ...baseRecord, kycStatus: 'APPROVED' },
      lowClassification,
    )
    expect(findings.some((finding) => finding.code === 'HIGH_RISK_APPROVED_WITHOUT_EDD')).toBe(false)
  })
})

describe('detectFindings — MISSING_REQUIRED_FIELD', () => {
  it('fires when clientName is null', () => {
    const findings = detectFindings({ ...baseRecord, clientName: null }, lowClassification)
    const finding = findings.find((f) => f.code === 'MISSING_REQUIRED_FIELD' && f.field === 'client_name')
    expect(finding).toBeDefined()
    expect(finding?.severity).toBe('WARNING')
  })

  it('fires when countryOfTaxResidence is null', () => {
    const findings = detectFindings({ ...baseRecord, countryOfTaxResidence: null }, lowClassification)
    expect(findings.some((f) => f.code === 'MISSING_REQUIRED_FIELD' && f.field === 'country_of_tax_residence')).toBe(true)
  })

  it('fires when kycStatus is null', () => {
    const findings = detectFindings({ ...baseRecord, kycStatus: null }, lowClassification)
    expect(findings.some((f) => f.code === 'MISSING_REQUIRED_FIELD' && f.field === 'kyc_status')).toBe(true)
  })

  it('fires when onboardingDate is null', () => {
    const findings = detectFindings({ ...baseRecord, onboardingDate: null }, lowClassification)
    expect(findings.some((f) => f.code === 'MISSING_REQUIRED_FIELD' && f.field === 'onboarding_date')).toBe(true)
  })

  it('does not fire when all required fields are present', () => {
    const findings = detectFindings(baseRecord, lowClassification)
    expect(findings.some((f) => f.code === 'MISSING_REQUIRED_FIELD')).toBe(false)
  })
})

describe('detectFindings — INVALID_VALUE', () => {
  it('fires when annualIncome is negative', () => {
    const findings = detectFindings({ ...baseRecord, annualIncome: -500 }, lowClassification)
    const finding = findings.find((f) => f.code === 'INVALID_VALUE' && f.field === 'annual_income')
    expect(finding).toBeDefined()
    expect(finding?.severity).toBe('WARNING')
  })

  it('does not fire when annualIncome is zero', () => {
    const findings = detectFindings({ ...baseRecord, annualIncome: 0 }, lowClassification)
    expect(findings.some((f) => f.code === 'INVALID_VALUE' && f.field === 'annual_income')).toBe(false)
  })

  it('does not fire when annualIncome is null', () => {
    const findings = detectFindings({ ...baseRecord, annualIncome: null }, lowClassification)
    expect(findings.some((f) => f.code === 'INVALID_VALUE' && f.field === 'annual_income')).toBe(false)
  })

  it('does not fire for a valid record', () => {
    const findings = detectFindings(baseRecord, lowClassification)
    expect(findings.some((f) => f.code === 'INVALID_VALUE')).toBe(false)
  })
})

describe('detectFindings — golden dataset test', () => {
  const csvFixture = readFileSync(
    join(__dirname, '../../test/fixtures/client_onboarding.csv'),
    'utf-8',
  )

  it('detects misclassification for CLT-005, CLT-017, CLT-031', () => {
    const rows = parseCsv(csvFixture)
    const records = rows.map(normalizeRow).filter((record): record is ClientRecord => record !== null)

    const misclassifiedIds = ['CLT-005', 'CLT-017', 'CLT-031']

    misclassifiedIds.forEach((clientId) => {
      const record = records.find((r) => r.clientId === clientId)
      expect(record).toBeDefined()

      const classification = classify(record!, defaultRuleset)
      const findings = detectFindings(record!, classification)

      expect(findings.some((finding) => finding.code === 'MISCLASSIFIED')).toBe(true)
    })
  })

  it('detects MISSING_RM for CLT-012, CLT-027, CLT-042', () => {
    const rows = parseCsv(csvFixture)
    const records = rows.map(normalizeRow).filter((record): record is ClientRecord => record !== null)

    const missingRmIds = ['CLT-012', 'CLT-027', 'CLT-042']

    missingRmIds.forEach((clientId) => {
      const record = records.find((r) => r.clientId === clientId)
      expect(record).toBeDefined()

      const classification = classify(record!, defaultRuleset)
      const findings = detectFindings(record!, classification)

      expect(findings.some((finding) => finding.code === 'MISSING_RM')).toBe(true)
    })
  })

  it('detects APPROVED_WITHOUT_ID_VERIFICATION for CLT-009, CLT-023', () => {
    const rows = parseCsv(csvFixture)
    const records = rows.map(normalizeRow).filter((record): record is ClientRecord => record !== null)

    const noIdVerificationIds = ['CLT-009', 'CLT-023']

    noIdVerificationIds.forEach((clientId) => {
      const record = records.find((r) => r.clientId === clientId)
      expect(record).toBeDefined()

      const classification = classify(record!, defaultRuleset)
      const findings = detectFindings(record!, classification)

      expect(findings.some((finding) => finding.code === 'APPROVED_WITHOUT_ID_VERIFICATION')).toBe(true)
    })
  })

  it('detects HIGH_RISK_APPROVED_WITHOUT_EDD for CLT-023', () => {
    const rows = parseCsv(csvFixture)
    const records = rows.map(normalizeRow).filter((record): record is ClientRecord => record !== null)

    const record = records.find((r) => r.clientId === 'CLT-023')
    expect(record).toBeDefined()

    const classification = classify(record!, defaultRuleset)
    const findings = detectFindings(record!, classification)

    expect(findings.some((finding) => finding.code === 'HIGH_RISK_APPROVED_WITHOUT_EDD')).toBe(true)
  })
})
