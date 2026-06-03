import type { ClientRecord, ClassificationResult } from '../model/types'
import type { Ruleset } from './types'

export function classify(_record: ClientRecord, _ruleset: Ruleset): ClassificationResult {
  return {
    tier: 'LOW',
    hits: [],
    decidingHits: [],
    rulesetVersion: _ruleset.version,
    explanation: '',
    evaluatedAt: new Date().toISOString(),
  }
}
