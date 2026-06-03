import type { FC } from 'react'
import { Badge } from '../../ui/components/Badge'
import type { ClientWithClassification } from '../../lib/useCsvClients'
import type { Finding, FindingCode } from '../../domain/model/types'

interface FindingsPanelProps {
  clients: ClientWithClassification[]
}

const findingSeverityVariant = {
  CRITICAL: 'error',
  WARNING: 'warning',
  INFO: 'info',
} satisfies Record<Finding['severity'], 'error' | 'warning' | 'info'>

const findingCodeLabels: Record<FindingCode, string> = {
  MISCLASSIFIED: 'Misclassified',
  MISSING_RM: 'Missing RM',
  APPROVED_WITHOUT_ID_VERIFICATION: 'Approved without ID verification',
  HIGH_RISK_APPROVED_WITHOUT_EDD: 'HIGH risk approved without EDD',
  MISSING_REQUIRED_FIELD: 'Missing required field',
  INVALID_VALUE: 'Invalid value',
}

export const FindingsPanel: FC<FindingsPanelProps> = ({ clients }) => {
  const allFindings = clients.flatMap((client) =>
    client.findings.map((finding) => ({
      ...finding,
      clientName: client.record.clientName ?? finding.clientId,
    })),
  )

  const criticalCount = allFindings.filter((finding) => finding.severity === 'CRITICAL').length
  const warningCount = allFindings.filter((finding) => finding.severity === 'WARNING').length

  if (allFindings.length === 0) {
    return (
      <div
        role="status"
        aria-label="No findings"
        className="py-16 text-center text-neutral"
      >
        <p className="text-base">No findings detected across all clients.</p>
      </div>
    )
  }

  return (
    <section aria-labelledby="findings-heading">
      <div className="flex items-center gap-4 mb-4">
        <h2 id="findings-heading" className="text-lg font-semibold text-text">
          Compliance Findings
        </h2>
        <div className="flex items-center gap-2" aria-label="Findings summary">
          {criticalCount > 0 && (
            <Badge variant="error">{criticalCount} critical</Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="warning">{warningCount} warning</Badge>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-card shadow-card">
        <table className="w-full bg-card text-sm" aria-label="Compliance findings">
          <caption className="sr-only">
            All compliance findings detected from CSV import data
          </caption>
          <thead>
            <tr className="border-b border-neutral/20 bg-background">
              <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                Client
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                Finding
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                Severity
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                Field
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {allFindings.map((finding, index) => (
              <tr key={`${finding.clientId}-${finding.code}-${index}`} className="border-b border-neutral/10">
                <td className="px-4 py-3">
                  <div>
                    <span className="font-medium text-text">{finding.clientName}</span>
                    <span className="block text-xs font-mono text-neutral">{finding.clientId}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">
                    {findingCodeLabels[finding.code] ?? finding.code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={findingSeverityVariant[finding.severity]}>
                    {finding.severity}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral">
                  {finding.field ?? '—'}
                </td>
                <td className="px-4 py-3 text-neutral text-xs max-w-xs">
                  {finding.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
