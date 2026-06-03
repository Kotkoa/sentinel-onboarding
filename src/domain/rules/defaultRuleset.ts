import type { Ruleset } from './types'

export const defaultRuleset: Ruleset = {
  version: '1.0.0',
  effectiveFrom: '2024-01-01',
  tierPriority: ['HIGH', 'MEDIUM', 'LOW'],
  rules: [
    {
      ruleId: 'HIGH-PEP',
      tier: 'HIGH',
      description: 'Politically Exposed Person',
      conditions: [{ field: 'pepStatus', operator: 'eq', value: 'true' }],
    },
    {
      ruleId: 'HIGH-SANCTIONS',
      tier: 'HIGH',
      description: 'Sanctions screening match',
      conditions: [{ field: 'sanctionsScreeningMatch', operator: 'eq', value: 'true' }],
    },
    {
      ruleId: 'HIGH-ADVERSE-MEDIA',
      tier: 'HIGH',
      description: 'Adverse media flag',
      conditions: [{ field: 'adverseMediaFlag', operator: 'eq', value: 'true' }],
    },
    {
      ruleId: 'HIGH-COUNTRY',
      tier: 'HIGH',
      description: 'High-risk country of tax residence',
      conditions: [
        {
          field: 'countryOfTaxResidence',
          operator: 'in',
          value: ['Russia', 'Belarus', 'Venezuela'],
        },
      ],
    },
    {
      ruleId: 'MEDIUM-ENTITY',
      tier: 'MEDIUM',
      description: 'Client type is ENTITY',
      conditions: [{ field: 'clientType', operator: 'eq', value: 'ENTITY' }],
    },
    {
      ruleId: 'MEDIUM-COUNTRY',
      tier: 'MEDIUM',
      description: 'Medium-risk country of tax residence',
      conditions: [
        {
          field: 'countryOfTaxResidence',
          operator: 'in',
          value: ['Brazil', 'Turkey', 'South Africa', 'Mexico', 'UAE', 'China'],
        },
      ],
    },
    {
      ruleId: 'MEDIUM-INCOME-SOF',
      tier: 'MEDIUM',
      description: 'High income with high-risk source of funds',
      conditions: [
        { field: 'annualIncome', operator: 'gt', value: 500000 },
        { field: 'sourceOfFunds', operator: 'in', value: ['Inheritance', 'Gift', 'Other'] },
      ],
    },
  ],
}
