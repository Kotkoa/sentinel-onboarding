import type { FC } from 'react'
import { computeKpis, computeBranchDistribution } from '../../lib/kpiSelectors'
import { RiskBadge } from '../../ui/components/RiskBadge'
import type { ClientWithClassification } from '../../lib/useCsvClients'
import type { ComplianceRecord } from '../../domain/model/types'
import { formatDate } from '../../lib/formatters'

interface AuditDashboardProps {
  clients: ClientWithClassification[]
  complianceRecords: ComplianceRecord[]
}

interface KpiCardProps {
  label: string
  value: string | number
  description?: string
}

const KpiCard: FC<KpiCardProps> = ({ label, value, description }) => (
  <div className="bg-card rounded-card shadow-card p-4">
    <p className="text-xs font-medium text-neutral uppercase tracking-wide">{label}</p>
    <p className="mt-1 text-2xl font-bold text-text" aria-label={`${label}: ${value}`}>
      {value}
    </p>
    {description && <p className="mt-1 text-xs text-neutral">{description}</p>}
  </div>
)

export const AuditDashboard: FC<AuditDashboardProps> = ({ clients, complianceRecords }) => {
  const kpis = computeKpis(clients)
  const branchDistribution = computeBranchDistribution(clients)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-text">Audit Dashboard</h2>

      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3"
        aria-label="Key performance indicators"
      >
        <KpiCard
          label="Total clients"
          value={kpis.total}
          description="From CSV import"
        />
        <KpiCard
          label="HIGH risk"
          value={`${kpis.highRiskPercent}%`}
          description={`${kpis.highRiskCount} of ${kpis.total} clients`}
        />
        <KpiCard
          label="Open findings"
          value={kpis.openFindingsCount}
          description={`${kpis.clientsWithFindingsCount} clients affected`}
        />
        <KpiCard
          label="Clients with findings"
          value={kpis.clientsWithFindingsCount}
          description={`${Math.round((kpis.clientsWithFindingsCount / Math.max(kpis.total, 1)) * 100)}% of portfolio`}
        />
        <KpiCard
          label="Missing RM"
          value={`${kpis.missingRmPercent}%`}
          description="Attributability gap"
        />
        <KpiCard
          label="Assessments recorded"
          value={complianceRecords.length}
          description="Via intake form"
        />
      </div>

      <section aria-labelledby="branch-distribution-heading">
        <h3 id="branch-distribution-heading" className="text-sm font-semibold text-text mb-3">
          Branch distribution
        </h3>
        <div className="overflow-x-auto rounded-card shadow-card">
          <table
            className="w-full bg-card text-sm"
            aria-label="Branch distribution by risk tier"
          >
            <thead>
              <tr className="border-b border-neutral/20 bg-background">
                <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                  Branch
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-text">
                  Total
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-text">
                  HIGH
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-text">
                  MEDIUM
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-text">
                  LOW
                </th>
              </tr>
            </thead>
            <tbody>
              {branchDistribution.map((branch) => (
                <tr key={branch.branch} className="border-b border-neutral/10">
                  <td className="px-4 py-3 font-medium">{branch.branch}</td>
                  <td className="px-4 py-3 text-right">{branch.count}</td>
                  <td className="px-4 py-3 text-right text-error font-medium">
                    {branch.highCount}
                  </td>
                  <td className="px-4 py-3 text-right text-text">{branch.mediumCount}</td>
                  <td className="px-4 py-3 text-right text-success">{branch.lowCount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-background border-t border-neutral/20 font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">{kpis.total}</td>
                <td className="px-4 py-3 text-right text-error">{kpis.highRiskCount}</td>
                <td className="px-4 py-3 text-right">
                  {clients.filter((client) => client.classification.tier === 'MEDIUM').length}
                </td>
                <td className="px-4 py-3 text-right text-success">
                  {clients.filter((client) => client.classification.tier === 'LOW').length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {complianceRecords.length > 0 && (
        <section aria-labelledby="audit-log-heading">
          <h3 id="audit-log-heading" className="text-sm font-semibold text-text mb-3">
            Assessment audit log
          </h3>
          <div className="overflow-x-auto rounded-card shadow-card">
            <table className="w-full bg-card text-sm" aria-label="Assessment audit log">
              <thead>
                <tr className="border-b border-neutral/20 bg-background">
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                    Client ID
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                    Assessed by
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                    Assessed at
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                    Tier
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                    Ruleset
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                    Sync
                  </th>
                </tr>
              </thead>
              <tbody>
                {complianceRecords.map((record) => (
                  <tr key={record.id} className="border-b border-neutral/10">
                    <td className="px-4 py-3 font-mono text-xs">{record.clientId}</td>
                    <td className="px-4 py-3">{record.assessedBy}</td>
                    <td className="px-4 py-3 text-neutral text-xs">
                      {formatDate(record.assessedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge tier={record.classification.tier} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral">
                      v{record.rulesetVersion}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={
                          record.syncStatus === 'SYNCED'
                            ? 'text-success'
                            : record.syncStatus === 'SYNC_FAILED'
                            ? 'text-error'
                            : 'text-neutral'
                        }
                      >
                        {record.syncStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
