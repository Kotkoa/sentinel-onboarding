import { describe, it, expect } from 'vitest'
import { BundledRulesetRepository } from './RulesetRepository'

describe('BundledRulesetRepository', () => {
  it('getActive() returns the default ruleset', async () => {
    const repo = new BundledRulesetRepository()
    const ruleset = await repo.getActive()
    expect(ruleset.version).toBeTruthy()
    expect(ruleset.rules.length).toBeGreaterThan(0)
    expect(ruleset.tierPriority).toEqual(['HIGH', 'MEDIUM', 'LOW'])
  })

  it('returned ruleset encodes 4 HIGH rules', async () => {
    const repo = new BundledRulesetRepository()
    const ruleset = await repo.getActive()
    const highRules = ruleset.rules.filter((rule) => rule.tier === 'HIGH')
    expect(highRules.length).toBe(4)
  })

  it('returned ruleset encodes 3 MEDIUM rules (including compound income+SoF)', async () => {
    const repo = new BundledRulesetRepository()
    const ruleset = await repo.getActive()
    const mediumRules = ruleset.rules.filter((rule) => rule.tier === 'MEDIUM')
    expect(mediumRules.length).toBe(3)
  })

  it('compound MEDIUM-INCOME-SOF rule has 2 conditions (AND)', async () => {
    const repo = new BundledRulesetRepository()
    const ruleset = await repo.getActive()
    const incomeRule = ruleset.rules.find((rule) => rule.ruleId === 'MEDIUM-INCOME-SOF')
    expect(incomeRule).toBeDefined()
    expect(incomeRule!.conditions.length).toBe(2)
  })

  it('effectiveFrom is a valid date string', async () => {
    const repo = new BundledRulesetRepository()
    const ruleset = await repo.getActive()
    expect(new Date(ruleset.effectiveFrom).toString()).not.toBe('Invalid Date')
  })
})
