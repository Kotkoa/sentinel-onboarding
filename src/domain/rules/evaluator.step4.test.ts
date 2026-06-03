import { describe, it, expect } from 'vitest'
import { evaluateCondition, classify } from './evaluator'
import { defaultRuleset } from './defaultRuleset'
import type { ClientRecord } from '../model/types'
import type { Ruleset, Condition } from './types'

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

describe('evaluateCondition — operator: eq', () => {
  it('eq string match → true', () => {
    const condition: Condition = { field: 'clientType', operator: 'eq', value: 'INDIVIDUAL' }
    expect(evaluateCondition(base, condition)).toBe(true)
  })

  it('eq string mismatch → false', () => {
    const condition: Condition = { field: 'clientType', operator: 'eq', value: 'ENTITY' }
    expect(evaluateCondition(base, condition)).toBe(false)
  })

  it('eq boolean true via string "true" → true', () => {
    const condition: Condition = { field: 'pepStatus', operator: 'eq', value: 'true' }
    const record = { ...base, pepStatus: true }
    expect(evaluateCondition(record, condition)).toBe(true)
  })

  it('eq boolean false via string "true" → false', () => {
    const condition: Condition = { field: 'pepStatus', operator: 'eq', value: 'true' }
    expect(evaluateCondition(base, condition)).toBe(false)
  })

  it('eq null field → false (no throw)', () => {
    const condition: Condition = { field: 'clientType', operator: 'eq', value: 'ENTITY' }
    expect(() => evaluateCondition({ ...base, clientType: null }, condition)).not.toThrow()
    expect(evaluateCondition({ ...base, clientType: null }, condition)).toBe(false)
  })

  it('eq case-insensitive → true', () => {
    const condition: Condition = { field: 'sourceOfFunds', operator: 'eq', value: 'employment' }
    expect(evaluateCondition(base, condition)).toBe(true)
  })
})

describe('evaluateCondition — operator: in', () => {
  it('in match → true', () => {
    const condition: Condition = {
      field: 'countryOfTaxResidence',
      operator: 'in',
      value: ['Russia', 'Netherlands'],
    }
    expect(evaluateCondition(base, condition)).toBe(true)
  })

  it('in no match → false', () => {
    const condition: Condition = {
      field: 'countryOfTaxResidence',
      operator: 'in',
      value: ['Russia', 'Belarus'],
    }
    expect(evaluateCondition(base, condition)).toBe(false)
  })

  it('in null field → false (no throw)', () => {
    const condition: Condition = {
      field: 'countryOfTaxResidence',
      operator: 'in',
      value: ['Netherlands'],
    }
    expect(() =>
      evaluateCondition({ ...base, countryOfTaxResidence: null }, condition),
    ).not.toThrow()
    expect(evaluateCondition({ ...base, countryOfTaxResidence: null }, condition)).toBe(false)
  })

  it('in case-insensitive → true', () => {
    const condition: Condition = {
      field: 'countryOfTaxResidence',
      operator: 'in',
      value: ['netherlands'],
    }
    expect(evaluateCondition(base, condition)).toBe(true)
  })

  it('in non-array value → false (no throw — totality)', () => {
    const condition = {
      field: 'countryOfTaxResidence' as const,
      operator: 'in' as const,
      value: 'Netherlands' as unknown as string[],
    }
    expect(() => evaluateCondition(base, condition)).not.toThrow()
    expect(evaluateCondition(base, condition)).toBe(false)
  })
})

describe('evaluateCondition — operator: gt', () => {
  it('gt number above threshold → true', () => {
    const condition: Condition = { field: 'annualIncome', operator: 'gt', value: 50000 }
    expect(evaluateCondition(base, condition)).toBe(true)
  })

  it('gt number equal threshold → false (strictly greater)', () => {
    const condition: Condition = { field: 'annualIncome', operator: 'gt', value: 100000 }
    expect(evaluateCondition(base, condition)).toBe(false)
  })

  it('gt number below threshold → false', () => {
    const condition: Condition = { field: 'annualIncome', operator: 'gt', value: 200000 }
    expect(evaluateCondition(base, condition)).toBe(false)
  })

  it('gt null field → false (no throw)', () => {
    const condition: Condition = { field: 'annualIncome', operator: 'gt', value: 50000 }
    expect(() => evaluateCondition({ ...base, annualIncome: null }, condition)).not.toThrow()
    expect(evaluateCondition({ ...base, annualIncome: null }, condition)).toBe(false)
  })

  it('gt non-number field → false (no throw)', () => {
    const condition: Condition = { field: 'clientType', operator: 'gt', value: 50000 }
    expect(() => evaluateCondition(base, condition)).not.toThrow()
    expect(evaluateCondition(base, condition)).toBe(false)
  })
})

describe('evaluateCondition — operator: gte', () => {
  it('gte number equal threshold → true', () => {
    const condition: Condition = { field: 'annualIncome', operator: 'gte', value: 100000 }
    expect(evaluateCondition(base, condition)).toBe(true)
  })

  it('gte number above threshold → true', () => {
    const condition: Condition = { field: 'annualIncome', operator: 'gte', value: 50000 }
    expect(evaluateCondition(base, condition)).toBe(true)
  })

  it('gte number below threshold → false', () => {
    const condition: Condition = { field: 'annualIncome', operator: 'gte', value: 200000 }
    expect(evaluateCondition(base, condition)).toBe(false)
  })

  it('gte null field → false (no throw)', () => {
    const condition: Condition = { field: 'annualIncome', operator: 'gte', value: 100000 }
    expect(() => evaluateCondition({ ...base, annualIncome: null }, condition)).not.toThrow()
    expect(evaluateCondition({ ...base, annualIncome: null }, condition)).toBe(false)
  })
})

describe('classify — AND-compound rule (income > 500k AND source in {...})', () => {
  it('both conditions met → MEDIUM', () => {
    const result = classify({ ...base, annualIncome: 600000, sourceOfFunds: 'Inheritance' }, defaultRuleset)
    expect(result.tier).toBe('MEDIUM')
  })

  it('only income condition met → LOW (short-circuit: missing source)', () => {
    const result = classify({ ...base, annualIncome: 600000, sourceOfFunds: 'Employment' }, defaultRuleset)
    expect(result.tier).toBe('LOW')
  })

  it('only source condition met → LOW (short-circuit: income too low)', () => {
    const result = classify({ ...base, annualIncome: 400000, sourceOfFunds: 'Inheritance' }, defaultRuleset)
    expect(result.tier).toBe('LOW')
  })

  it('null income AND Inheritance source → LOW (no throw)', () => {
    expect(() =>
      classify({ ...base, annualIncome: null, sourceOfFunds: 'Inheritance' }, defaultRuleset),
    ).not.toThrow()
    expect(
      classify({ ...base, annualIncome: null, sourceOfFunds: 'Inheritance' }, defaultRuleset).tier,
    ).toBe('LOW')
  })

  it('income > 500k AND null source → LOW (no throw)', () => {
    expect(() =>
      classify({ ...base, annualIncome: 600000, sourceOfFunds: null }, defaultRuleset),
    ).not.toThrow()
    expect(
      classify({ ...base, annualIncome: 600000, sourceOfFunds: null }, defaultRuleset).tier,
    ).toBe('LOW')
  })
})

describe('ClassificationResult shape — step 4 assertions', () => {
  it('contains rulesetVersion from the supplied ruleset', () => {
    const result = classify(base, defaultRuleset)
    expect(result.rulesetVersion).toBe(defaultRuleset.version)
  })

  it('hits array is empty for clean LOW record', () => {
    const result = classify(base, defaultRuleset)
    expect(result.hits).toEqual([])
  })

  it('hits array contains all fired rules (HIGH + MEDIUM both present)', () => {
    const result = classify({ ...base, pepStatus: true, clientType: 'ENTITY' }, defaultRuleset)
    const tiers = result.hits.map((hit) => hit.tier)
    expect(tiers).toContain('HIGH')
    expect(tiers).toContain('MEDIUM')
  })

  it('decidingHits contains only the winning tier', () => {
    const result = classify({ ...base, pepStatus: true, clientType: 'ENTITY' }, defaultRuleset)
    expect(result.decidingHits.every((hit) => hit.tier === 'HIGH')).toBe(true)
  })

  it('explanation is non-empty string', () => {
    const result = classify({ ...base, pepStatus: true }, defaultRuleset)
    expect(typeof result.explanation).toBe('string')
    expect(result.explanation.length).toBeGreaterThan(0)
  })
})

describe('CONFIGURABILITY — same evaluator, different ruleset data → different tier', () => {
  it('lowering income threshold to 300k makes 400k income + Inheritance → MEDIUM', () => {
    const stricterRuleset: Ruleset = {
      ...defaultRuleset,
      version: '1.1.0-test',
      rules: defaultRuleset.rules.map((rule) => {
        if (rule.ruleId !== 'MEDIUM-INCOME-SOF') return rule
        return {
          ...rule,
          conditions: [
            { field: 'annualIncome', operator: 'gt', value: 300000 },
            { field: 'sourceOfFunds', operator: 'in', value: ['Inheritance', 'Gift', 'Other'] },
          ],
        }
      }),
    }

    const record = { ...base, annualIncome: 400000, sourceOfFunds: 'Inheritance' }
    expect(classify(record, defaultRuleset).tier).toBe('LOW')
    expect(classify(record, stricterRuleset).tier).toBe('MEDIUM')
    expect(classify(record, stricterRuleset).rulesetVersion).toBe('1.1.0-test')
  })

  it('adding Iran to HIGH-COUNTRY list classifies Iran client as HIGH without code change', () => {
    const extendedRuleset: Ruleset = {
      ...defaultRuleset,
      version: '1.2.0-test',
      rules: defaultRuleset.rules.map((rule) => {
        if (rule.ruleId !== 'HIGH-COUNTRY') return rule
        return {
          ...rule,
          conditions: [
            {
              field: 'countryOfTaxResidence',
              operator: 'in',
              value: ['Russia', 'Belarus', 'Venezuela', 'Iran'],
            },
          ],
        }
      }),
    }

    const iranClient = { ...base, countryOfTaxResidence: 'Iran' }
    expect(classify(iranClient, defaultRuleset).tier).toBe('LOW')
    expect(classify(iranClient, extendedRuleset).tier).toBe('HIGH')
  })

  it('removing MEDIUM-ENTITY rule makes ENTITY client → LOW with custom ruleset', () => {
    const noEntityRuleset: Ruleset = {
      ...defaultRuleset,
      version: '1.3.0-test',
      rules: defaultRuleset.rules.filter((rule) => rule.ruleId !== 'MEDIUM-ENTITY'),
    }

    const entityClient = { ...base, clientType: 'ENTITY' as const }
    expect(classify(entityClient, defaultRuleset).tier).toBe('MEDIUM')
    expect(classify(entityClient, noEntityRuleset).tier).toBe('LOW')
  })
})
