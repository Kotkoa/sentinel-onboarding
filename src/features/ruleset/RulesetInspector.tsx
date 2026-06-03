import { type FC, useEffect, useState } from 'react'
import { BundledRulesetRepository } from '../../data/repositories/RulesetRepository'
import { Card } from '../../ui/components/Card'
import { RiskBadge } from '../../ui/components/RiskBadge'
import type { Ruleset } from '../../domain/rules/types'
import type { RiskTier } from '../../domain/model/types'

const repository = new BundledRulesetRepository()

function formatConditionValue(value: string | number | string[]): string {
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

function formatOperator(operator: string): string {
  switch (operator) {
    case 'eq': return '='
    case 'in': return 'in'
    case 'gt': return '>'
    case 'gte': return '>='
    default: return operator
  }
}

export const RulesetInspector: FC = () => {
  const [ruleset, setRuleset] = useState<Ruleset | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    repository.getActive()
      .then((loadedRuleset) => {
        if (!cancelled) {
          setRuleset(loadedRuleset)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="py-8 text-center text-neutral">
        Loading ruleset…
      </div>
    )
  }

  if (!ruleset) {
    return (
      <div role="alert" className="py-8 text-center text-error">
        Failed to load active ruleset.
      </div>
    )
  }

  const highRules = ruleset.rules.filter((rule) => rule.tier === 'HIGH')
  const mediumRules = ruleset.rules.filter((rule) => rule.tier === 'MEDIUM')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text">Active Ruleset</h2>
          <p className="text-sm text-neutral mt-0.5">
            Rules are evaluated in priority order: HIGH → MEDIUM → LOW.
            Highest matching tier wins.
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            v{ruleset.version}
          </span>
          <p className="text-xs text-neutral mt-1">
            Effective {ruleset.effectiveFrom}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {(['HIGH', 'MEDIUM'] as RiskTier[]).map((tier) => {
          const rules = tier === 'HIGH' ? highRules : mediumRules
          return (
            <Card key={tier} as="section" aria-label={`${tier} risk rules`}>
              <div className="flex items-center gap-3 mb-4">
                <RiskBadge tier={tier} />
                <span className="text-sm text-neutral">
                  {rules.length} rule{rules.length !== 1 ? 's' : ''} — any one triggers {tier}
                </span>
              </div>

              <table className="w-full text-sm" aria-label={`${tier} risk classification rules`}>
                <thead>
                  <tr className="border-b border-neutral/20">
                    <th scope="col" className="text-left py-2 pr-4 font-medium text-neutral w-32">
                      Rule ID
                    </th>
                    <th scope="col" className="text-left py-2 pr-4 font-medium text-neutral">
                      Description
                    </th>
                    <th scope="col" className="text-left py-2 font-medium text-neutral">
                      Conditions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, ruleIndex) => (
                    <tr
                      key={rule.ruleId}
                      className={ruleIndex < rules.length - 1 ? 'border-b border-neutral/10' : ''}
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-primary align-top">
                        {rule.ruleId}
                      </td>
                      <td className="py-3 pr-4 text-text align-top">
                        {rule.description}
                      </td>
                      <td className="py-3 align-top">
                        <div className="space-y-1">
                          {rule.conditions.map((condition, conditionIndex) => (
                            <div key={conditionIndex} className="flex items-baseline gap-1.5 flex-wrap">
                              {conditionIndex > 0 && (
                                <span className="text-xs font-semibold text-warning uppercase">AND</span>
                              )}
                              <code className="text-xs bg-background px-1.5 py-0.5 rounded font-mono text-text">
                                {condition.field}
                              </code>
                              <span className="text-xs text-neutral font-medium">
                                {formatOperator(condition.operator)}
                              </span>
                              <span className="text-xs text-text font-medium">
                                {formatConditionValue(condition.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )
        })}

        <Card as="section" aria-label="LOW risk rules">
          <div className="flex items-center gap-3">
            <RiskBadge tier="LOW" />
            <p className="text-sm text-neutral">
              Default floor — applied when no HIGH or MEDIUM conditions match.
              No explicit rules required.
            </p>
          </div>
        </Card>
      </div>

      <p className="text-xs text-neutral flex items-center gap-1.5 flex-wrap">
        <span>Tier priority order:</span>
        {ruleset.tierPriority.map((tier, tierIndex) => (
          <span key={tier} className="inline-flex items-center gap-1">
            {tierIndex > 0 && <span className="text-neutral">→</span>}
            <RiskBadge tier={tier} />
          </span>
        ))}
      </p>
    </div>
  )
}
