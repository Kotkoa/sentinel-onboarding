import { type FC, useEffect, useState } from 'react'
import { RiskBadge } from '../../ui/components/RiskBadge'
import { formatDate } from '../../lib/formatters'
import type { ComplianceRecord } from '../../domain/model/types'
import type { ComplianceRepository } from '../../data/repositories/ComplianceRepository'

interface AssessmentsListProps {
  records: ComplianceRecord[]
  repository: ComplianceRepository
}

export const AssessmentsList: FC<AssessmentsListProps> = ({ records: localRecords, repository }) => {
  const [persistedRecords, setPersistedRecords] = useState<ComplianceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    repository
      .list()
      .then((rows) => {
        if (!cancelled) {
          setPersistedRecords(rows)
          setIsLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [repository, localRecords.length])

  const mergedRecords = mergeRecords(persistedRecords, localRecords)

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="py-8 text-center text-neutral">
        Loading assessments…
      </div>
    )
  }

  return (
    <section aria-label="RM assessments">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">RM Assessments</h2>
        <span className="text-sm text-neutral">{mergedRecords.length} records</span>
      </div>

      <p className="text-xs text-neutral mb-4">
        Compliance records submitted by relationship managers. Separate from CSV legacy data.
      </p>

      {error && (
        <div role="alert" className="mb-4 p-4 rounded-card border border-error/30 bg-error/5 text-error text-sm">
          Failed to load persisted records: {error}
        </div>
      )}

      {mergedRecords.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-neutral text-base mb-2">No assessments recorded yet.</p>
          <p className="text-neutral text-sm">
            Submit a new assessment via <strong>New Assessment</strong> to see records here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card shadow-card">
          <table className="w-full bg-card text-sm" aria-label="Assessment records">
            <thead>
              <tr className="border-b border-neutral/20 bg-background">
                <th scope="col" className="px-4 py-3 text-left font-semibold text-text">Client ID</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-text">Client name</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-text">Risk tier</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-text">KYC status</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-text">Assessed by</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-text">Assessed at</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-text">Sync</th>
              </tr>
            </thead>
            <tbody>
              {mergedRecords.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-neutral/10 hover:bg-background transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-neutral">{record.clientId}</td>
                  <td className="px-4 py-3 font-medium">{record.assessmentData.clientName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <RiskBadge tier={record.classification.tier} />
                  </td>
                  <td className="px-4 py-3 text-neutral text-xs">
                    {record.assessmentData.kycStatus ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral text-xs">{record.assessedBy}</td>
                  <td className="px-4 py-3 text-neutral text-xs">
                    {formatDate(record.assessedAt.slice(0, 10))}
                  </td>
                  <td className="px-4 py-3">
                    <SyncBadge status={record.syncStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

interface SyncBadgeProps {
  status: ComplianceRecord['syncStatus']
}

const SyncBadge: FC<SyncBadgeProps> = ({ status }) => {
  if (status === 'SYNCED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
        <span aria-hidden="true">✓</span> Synced
      </span>
    )
  }
  if (status === 'LOCAL') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
        <span aria-hidden="true">○</span> Local
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-error">
      <span aria-hidden="true">✕</span> Failed
    </span>
  )
}

function mergeRecords(
  persisted: ComplianceRecord[],
  local: ComplianceRecord[],
): ComplianceRecord[] {
  const persistedIds = new Set(persisted.map((record) => record.id))
  const localOnly = local.filter((record) => !persistedIds.has(record.id))
  return [...persisted, ...localOnly].sort((a, b) =>
    b.assessedAt.localeCompare(a.assessedAt),
  )
}
