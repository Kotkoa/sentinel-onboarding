import { parseCsv } from '../domain/csv/parse'
import { normalizeRow } from '../domain/csv/normalize'
import { classify } from '../domain/rules/evaluator'
import { detectFindings } from '../domain/validation/findings'
import { defaultRuleset } from '../domain/rules/defaultRuleset'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { ClientRecord } from '../domain/model/types'
import type { ClientWithClassification } from '../lib/useCsvClients'

export function loadCsvClients(): ClientWithClassification[] {
  const csvText = readFileSync(
    join(__dirname, 'fixtures/client_onboarding.csv'),
    'utf-8',
  )
  return parseCsv(csvText)
    .map(normalizeRow)
    .filter((record): record is ClientRecord => record !== null)
    .map((record) => {
      const classification = classify(record, defaultRuleset)
      const findings = detectFindings(record, classification)
      return { record, classification, findings }
    })
}
