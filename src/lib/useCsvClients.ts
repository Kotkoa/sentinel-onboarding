import { useState, useEffect } from 'react'
import { parseCsv } from '../domain/csv/parse'
import { normalizeRow } from '../domain/csv/normalize'
import { classify } from '../domain/rules/evaluator'
import { detectFindings } from '../domain/validation/findings'
import { defaultRuleset } from '../domain/rules/defaultRuleset'
import type { ClientRecord, ClassificationResult, Finding } from '../domain/model/types'

export interface ClientWithClassification {
  record: ClientRecord
  classification: ClassificationResult
  findings: Finding[]
}

interface UseCsvClientsResult {
  clients: ClientWithClassification[]
  isLoading: boolean
  error: string | null
}

export function useCsvClients(csvText: string | null): UseCsvClientsResult {
  const [clients, setClients] = useState<ClientWithClassification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!csvText) {
      setClients([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const rawRows = parseCsv(csvText)
      const processed = rawRows
        .map(normalizeRow)
        .filter((record): record is ClientRecord => record !== null)
        .map((record) => {
          const classification = classify(record, defaultRuleset)
          const findings = detectFindings(record, classification)
          return { record, classification, findings }
        })

      setClients(processed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV data')
    } finally {
      setIsLoading(false)
    }
  }, [csvText])

  return { clients, isLoading, error }
}
