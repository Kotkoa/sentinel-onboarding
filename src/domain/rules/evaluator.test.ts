import { describe, it, expect } from 'vitest'
import { classify } from './evaluator'
import { defaultRuleset } from './defaultRuleset'
import type { ClientRecord } from '../model/types'

const base: ClientRecord = {
  clientId: 'CLT-TEST',
  clientName: 'Test User',
  clientType: 'INDIVIDUAL',
  countryOfTaxResidence: 'Netherlands',
  pepStatus: false,
  sanctionsScreeningMatch: false,
  adverseMediaFlag: false,
  annualIncome: 100000,
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

describe('classify — HIGH triggers (any one → HIGH)', () => {
  it('pep_status=true → HIGH', () => {
    const result = classify({ ...base, pepStatus: true }, defaultRuleset)
    expect(result.tier).toBe('HIGH')
  })

  it('sanctions_screening_match=true → HIGH', () => {
    const result = classify({ ...base, sanctionsScreeningMatch: true }, defaultRuleset)
    expect(result.tier).toBe('HIGH')
  })

  it('adverse_media_flag=true → HIGH', () => {
    const result = classify({ ...base, adverseMediaFlag: true }, defaultRuleset)
    expect(result.tier).toBe('HIGH')
  })

  it('country Russia → HIGH', () => {
    const result = classify({ ...base, countryOfTaxResidence: 'Russia' }, defaultRuleset)
    expect(result.tier).toBe('HIGH')
  })

  it('country Belarus → HIGH', () => {
    const result = classify({ ...base, countryOfTaxResidence: 'Belarus' }, defaultRuleset)
    expect(result.tier).toBe('HIGH')
  })

  it('country Venezuela → HIGH', () => {
    const result = classify({ ...base, countryOfTaxResidence: 'Venezuela' }, defaultRuleset)
    expect(result.tier).toBe('HIGH')
  })
})

describe('classify — MEDIUM triggers (no HIGH, any one → MEDIUM)', () => {
  it('client_type=ENTITY → MEDIUM', () => {
    const result = classify({ ...base, clientType: 'ENTITY' }, defaultRuleset)
    expect(result.tier).toBe('MEDIUM')
  })

  it('country Brazil → MEDIUM', () => {
    const result = classify({ ...base, countryOfTaxResidence: 'Brazil' }, defaultRuleset)
    expect(result.tier).toBe('MEDIUM')
  })

  it('country Turkey → MEDIUM', () => {
    const result = classify({ ...base, countryOfTaxResidence: 'Turkey' }, defaultRuleset)
    expect(result.tier).toBe('MEDIUM')
  })

  it('country South Africa → MEDIUM', () => {
    const result = classify({ ...base, countryOfTaxResidence: 'South Africa' }, defaultRuleset)
    expect(result.tier).toBe('MEDIUM')
  })

  it('country Mexico → MEDIUM', () => {
    const result = classify({ ...base, countryOfTaxResidence: 'Mexico' }, defaultRuleset)
    expect(result.tier).toBe('MEDIUM')
  })

  it('country UAE → MEDIUM', () => {
    const result = classify({ ...base, countryOfTaxResidence: 'UAE' }, defaultRuleset)
    expect(result.tier).toBe('MEDIUM')
  })

  it('country China → MEDIUM', () => {
    const result = classify({ ...base, countryOfTaxResidence: 'China' }, defaultRuleset)
    expect(result.tier).toBe('MEDIUM')
  })

  it('income > 500000 AND source=Inheritance → MEDIUM', () => {
    const result = classify(
      { ...base, annualIncome: 600000, sourceOfFunds: 'Inheritance' },
      defaultRuleset,
    )
    expect(result.tier).toBe('MEDIUM')
  })

  it('income > 500000 AND source=Gift → MEDIUM', () => {
    const result = classify(
      { ...base, annualIncome: 600000, sourceOfFunds: 'Gift' },
      defaultRuleset,
    )
    expect(result.tier).toBe('MEDIUM')
  })

  it('income > 500000 AND source=Other → MEDIUM', () => {
    const result = classify(
      { ...base, annualIncome: 600000, sourceOfFunds: 'Other' },
      defaultRuleset,
    )
    expect(result.tier).toBe('MEDIUM')
  })

  it('income exactly 500000 AND source=Inheritance → LOW (not > 500000)', () => {
    const result = classify(
      { ...base, annualIncome: 500000, sourceOfFunds: 'Inheritance' },
      defaultRuleset,
    )
    expect(result.tier).toBe('LOW')
  })

  it('income > 500000 AND source=Employment → LOW (wrong source)', () => {
    const result = classify(
      { ...base, annualIncome: 600000, sourceOfFunds: 'Employment' },
      defaultRuleset,
    )
    expect(result.tier).toBe('LOW')
  })
})

describe('classify — LOW floor', () => {
  it('clean record with no triggers → LOW', () => {
    const result = classify(base, defaultRuleset)
    expect(result.tier).toBe('LOW')
  })
})

describe('classify — highest tier wins when multiple rules fire', () => {
  it('PEP + ENTITY → HIGH (not MEDIUM)', () => {
    const result = classify({ ...base, pepStatus: true, clientType: 'ENTITY' }, defaultRuleset)
    expect(result.tier).toBe('HIGH')
  })

  it('Russia + ENTITY → HIGH (not MEDIUM)', () => {
    const result = classify(
      { ...base, countryOfTaxResidence: 'Russia', clientType: 'ENTITY' },
      defaultRuleset,
    )
    expect(result.tier).toBe('HIGH')
  })
})

describe('classify — totality (no throws on null/garbage input)', () => {
  it('null pepStatus → treated as non-match', () => {
    expect(() => classify({ ...base, pepStatus: null }, defaultRuleset)).not.toThrow()
    expect(classify({ ...base, pepStatus: null }, defaultRuleset).tier).toBe('LOW')
  })

  it('null annualIncome with Inheritance source → LOW (compound rule does not throw)', () => {
    expect(() =>
      classify({ ...base, annualIncome: null, sourceOfFunds: 'Inheritance' }, defaultRuleset),
    ).not.toThrow()
    expect(
      classify({ ...base, annualIncome: null, sourceOfFunds: 'Inheritance' }, defaultRuleset)
        .tier,
    ).toBe('LOW')
  })

  it('null countryOfTaxResidence → LOW (no match)', () => {
    expect(classify({ ...base, countryOfTaxResidence: null }, defaultRuleset).tier).toBe('LOW')
  })
})

describe('classify — ClassificationResult shape', () => {
  it('returns rulesetVersion from the ruleset', () => {
    const result = classify(base, defaultRuleset)
    expect(result.rulesetVersion).toBe(defaultRuleset.version)
  })

  it('returns non-empty explanation for HIGH result', () => {
    const result = classify({ ...base, pepStatus: true }, defaultRuleset)
    expect(result.explanation.length).toBeGreaterThan(0)
  })

  it('returns hits array with fired rules', () => {
    const result = classify({ ...base, pepStatus: true }, defaultRuleset)
    expect(result.hits.length).toBeGreaterThan(0)
    expect(result.hits[0]?.tier).toBe('HIGH')
  })

  it('returns empty hits for LOW result', () => {
    const result = classify(base, defaultRuleset)
    expect(result.hits).toEqual([])
  })
})

describe('classify — regression: CSV dirty rows', () => {
  it('CLT-005: PEP=TRUE → computed HIGH (recorded LOW is wrong)', () => {
    const clt005: ClientRecord = {
      ...base,
      clientId: 'CLT-005',
      clientType: 'ENTITY',
      countryOfTaxResidence: 'Australia',
      pepStatus: true,
      recordedRiskClassification: 'LOW',
    }
    expect(classify(clt005, defaultRuleset).tier).toBe('HIGH')
  })

  it('CLT-017: Russia + PEP=TRUE → computed HIGH (recorded LOW is wrong)', () => {
    const clt017: ClientRecord = {
      ...base,
      clientId: 'CLT-017',
      countryOfTaxResidence: 'Russia',
      pepStatus: true,
      recordedRiskClassification: 'LOW',
    }
    expect(classify(clt017, defaultRuleset).tier).toBe('HIGH')
  })

  it('CLT-031: adverse_media=TRUE + China → computed HIGH (recorded LOW is wrong)', () => {
    const clt031: ClientRecord = {
      ...base,
      clientId: 'CLT-031',
      countryOfTaxResidence: 'China',
      adverseMediaFlag: true,
      recordedRiskClassification: 'LOW',
    }
    expect(classify(clt031, defaultRuleset).tier).toBe('HIGH')
  })
})
