import type { RiskTier } from '../model/types'

export type ConditionOperator = 'eq' | 'in' | 'gt' | 'gte'

export interface Condition {
  field: string
  operator: ConditionOperator
  value: string | number | string[]
}

export interface Rule {
  ruleId: string
  tier: RiskTier
  description: string
  conditions: Condition[]
}

export interface Ruleset {
  version: string
  effectiveFrom: string
  tierPriority: RiskTier[]
  rules: Rule[]
}
