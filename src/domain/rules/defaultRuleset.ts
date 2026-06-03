import type { Ruleset } from './types'

export const defaultRuleset: Ruleset = {
  version: '1.0.0',
  effectiveFrom: '2024-01-01',
  tierPriority: ['HIGH', 'MEDIUM', 'LOW'],
  rules: [],
}
