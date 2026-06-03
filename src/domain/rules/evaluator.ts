import type { ClientRecord, ClassificationResult, RiskTier, RuleHit } from '../model/types'
import type { Ruleset, Condition } from './types'

type RecordValue = string | number | boolean | null | undefined

export function evaluateCondition(
  record: ClientRecord,
  condition: Condition,
): boolean {
  const fieldValue: RecordValue = record[condition.field]

  if (fieldValue === null || fieldValue === undefined) return false

  switch (condition.operator) {
    case 'eq': {
      if (typeof fieldValue === 'boolean') {
        const condVal = String(condition.value).toLowerCase()
        return fieldValue === (condVal === 'true')
      }
      return String(fieldValue).toLowerCase() === String(condition.value).toLowerCase()
    }
    case 'in': {
      if (!Array.isArray(condition.value)) return false
      return condition.value.some(
        (candidate) => String(fieldValue).toLowerCase() === candidate.toLowerCase(),
      )
    }
    case 'gt': {
      if (typeof fieldValue !== 'number') return false
      return fieldValue > (condition.value as number)
    }
    case 'gte': {
      if (typeof fieldValue !== 'number') return false
      return fieldValue >= (condition.value as number)
    }
    default:
      return false
  }
}

function buildExplanation(hits: RuleHit[], tier: RiskTier): string {
  if (hits.length === 0) return 'No risk triggers identified. Classified as LOW.'

  const decidingDescriptions = hits
    .filter((hit) => hit.tier === tier)
    .map((hit) => hit.description)
    .join('; ')

  return `Classified as ${tier} due to: ${decidingDescriptions}.`
}

export function classify(record: ClientRecord, ruleset: Ruleset): ClassificationResult {
  const hits: RuleHit[] = []

  for (const rule of ruleset.rules) {
    const allConditionsMet = rule.conditions.every((condition) =>
      evaluateCondition(record, condition),
    )
    if (allConditionsMet) {
      hits.push({
        ruleId: rule.ruleId,
        tier: rule.tier,
        description: rule.description,
      })
    }
  }

  let tier: RiskTier = 'LOW'
  for (const priorityTier of ruleset.tierPriority) {
    if (hits.some((hit) => hit.tier === priorityTier)) {
      tier = priorityTier
      break
    }
  }

  const decidingHits = hits.filter((hit) => hit.tier === tier)

  return {
    tier,
    hits,
    decidingHits,
    rulesetVersion: ruleset.version,
    explanation: buildExplanation(hits, tier),
    evaluatedAt: new Date().toISOString(),
  }
}
