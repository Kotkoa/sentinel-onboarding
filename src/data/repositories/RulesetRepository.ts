import type { Ruleset } from '../../domain/rules/types'
import { defaultRuleset } from '../../domain/rules/defaultRuleset'

export interface RulesetRepository {
  getActive(): Promise<Ruleset>
}

export class BundledRulesetRepository implements RulesetRepository {
  async getActive(): Promise<Ruleset> {
    return defaultRuleset
  }
}
