import { type FC, useState, useCallback, useRef } from 'react'
import { RiskBadge } from '../../ui/components/RiskBadge'
import { Badge } from '../../ui/components/Badge'
import { Dialog } from '../../ui/components/Dialog'
import { formatDate } from '../../lib/formatters'
import { nullsLastComparator } from '../../lib/sort'
import type { ClientWithClassification } from '../../lib/useCsvClients'
import type { RiskTier } from '../../domain/model/types'
import type { SortDirection } from '../../lib/sort'

interface ClientsListProps {
  clients: ClientWithClassification[]
}

type TierFilter = RiskTier | 'ALL'
type FindingFilter = 'ALL' | 'HAS_FINDINGS'
type SortColumn = 'clientId' | 'branch' | 'computedTier' | 'onboardingDate' | 'findingsCount'

interface Filters {
  branch: string
  tier: TierFilter
  findings: FindingFilter
}

interface SortState {
  column: SortColumn
  direction: SortDirection
}

const TIER_ORDER: Record<RiskTier, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 }

export const ClientsList: FC<ClientsListProps> = ({ clients }) => {
  const [filters, setFilters] = useState<Filters>({
    branch: 'ALL',
    tier: 'ALL',
    findings: 'ALL',
  })
  const [sort, setSort] = useState<SortState>({ column: 'clientId', direction: 'asc' })
  const [selectedClient, setSelectedClient] = useState<ClientWithClassification | null>(null)
  const triggerElementRef = useRef<HTMLElement | null>(null)

  const handleSortColumn = useCallback((column: SortColumn) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    )
  }, [])

  const branches = Array.from(
    new Set(clients.map((client) => client.record.branch ?? 'Unknown')),
  ).sort()

  const filtered = clients
    .filter((client) => {
      if (filters.branch !== 'ALL' && (client.record.branch ?? 'Unknown') !== filters.branch) {
        return false
      }
      if (filters.tier !== 'ALL' && client.classification.tier !== filters.tier) {
        return false
      }
      if (filters.findings === 'HAS_FINDINGS' && client.findings.length === 0) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sort.column) {
        case 'clientId':
          return nullsLastComparator(
            (item: ClientWithClassification) => item.record.clientId,
            sort.direction,
          )(a, b)
        case 'branch':
          return nullsLastComparator(
            (item: ClientWithClassification) => item.record.branch,
            sort.direction,
          )(a, b)
        case 'computedTier': {
          const aOrder = TIER_ORDER[a.classification.tier]
          const bOrder = TIER_ORDER[b.classification.tier]
          return sort.direction === 'asc' ? aOrder - bOrder : bOrder - aOrder
        }
        case 'onboardingDate':
          return nullsLastComparator(
            (item: ClientWithClassification) => item.record.onboardingDate,
            sort.direction,
          )(a, b)
        case 'findingsCount':
          return sort.direction === 'asc'
            ? a.findings.length - b.findings.length
            : b.findings.length - a.findings.length
        default:
          return 0
      }
    })

  const openDialog = useCallback((client: ClientWithClassification, trigger: HTMLElement) => {
    triggerElementRef.current = trigger
    setSelectedClient(client)
  }, [])

  const closeDialog = useCallback(() => {
    setSelectedClient(null)
    triggerElementRef.current?.focus()
  }, [])

  const handleRowKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTableRowElement>, client: ClientWithClassification) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openDialog(client, event.currentTarget)
      }
    },
    [openDialog],
  )

  const isMisclassified = (client: ClientWithClassification) =>
    client.record.recordedRiskClassification !== null &&
    client.record.recordedRiskClassification !== client.classification.tier

  return (
    <section aria-label="Clients list">
      <div
        className="flex flex-wrap gap-3 mb-4"
        role="group"
        aria-label="Filter clients"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-branch" className="text-xs font-medium text-neutral">
            Branch
          </label>
          <select
            id="filter-branch"
            value={filters.branch}
            onChange={(event) => setFilters({ ...filters, branch: event.target.value })}
            className="min-h-11 px-3 py-2 rounded-lg border border-neutral/40 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All branches</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-tier" className="text-xs font-medium text-neutral">
            Risk tier
          </label>
          <select
            id="filter-tier"
            value={filters.tier}
            onChange={(event) => setFilters({ ...filters, tier: event.target.value as TierFilter })}
            className="min-h-11 px-3 py-2 rounded-lg border border-neutral/40 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All tiers</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-findings" className="text-xs font-medium text-neutral">
            Findings
          </label>
          <select
            id="filter-findings"
            value={filters.findings}
            onChange={(event) =>
              setFilters({ ...filters, findings: event.target.value as FindingFilter })
            }
            className="min-h-11 px-3 py-2 rounded-lg border border-neutral/40 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All clients</option>
            <option value="HAS_FINDINGS">Has findings</option>
          </select>
        </div>

        <div className="flex items-end">
          <span className="text-sm text-neutral py-2">
            {filtered.length} of {clients.length} clients
          </span>
        </div>
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {filtered.length === 0 ? 'No clients match the current filters.' : `${filtered.length} clients shown.`}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-neutral">
          <p className="text-base">No clients match the current filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card shadow-card">
          <table className="w-full bg-card text-sm" aria-label="Client records">
            <thead>
              <tr className="border-b border-neutral/20 bg-background">
                <SortableHeader
                  column="clientId"
                  label="Client ID"
                  sort={sort}
                  onSort={handleSortColumn}
                />
                <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                  Name
                </th>
                <SortableHeader
                  column="branch"
                  label="Branch"
                  sort={sort}
                  onSort={handleSortColumn}
                />
                <SortableHeader
                  column="computedTier"
                  label="Computed tier"
                  sort={sort}
                  onSort={handleSortColumn}
                />
                <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                  Recorded tier
                </th>
                <SortableHeader
                  column="findingsCount"
                  label="Findings"
                  sort={sort}
                  onSort={handleSortColumn}
                />
                <th scope="col" className="px-4 py-3 text-left font-semibold text-text">
                  KYC status
                </th>
                <SortableHeader
                  column="onboardingDate"
                  label="Onboarding date"
                  sort={sort}
                  onSort={handleSortColumn}
                />
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const misclassified = isMisclassified(client)
                return (
                  <tr
                    key={client.record.clientId}
                    tabIndex={0}
                    onClick={(event) => openDialog(client, event.currentTarget)}
                    onKeyDown={(event) => handleRowKeyDown(event, client)}
                    className={[
                      'border-b border-neutral/10 cursor-pointer transition-colors',
                      'hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                      misclassified ? 'bg-warning/5' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    data-testid={`row-${client.record.clientId}`}
                    data-misclassified={misclassified ? 'true' : undefined}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-neutral">
                      <span className="sr-only">
                        {`View details for ${client.record.clientName ?? client.record.clientId}. `}
                      </span>
                      {client.record.clientId}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {client.record.clientName ?? '—'}
                        {misclassified && (
                          <Badge variant="warning" aria-label="Misclassification detected">
                            ⚠ Mismatch
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral">{client.record.branch ?? '—'}</td>
                    <td className="px-4 py-3">
                      <RiskBadge tier={client.classification.tier} />
                    </td>
                    <td className="px-4 py-3">
                      {client.record.recordedRiskClassification ? (
                        <RiskBadge tier={client.record.recordedRiskClassification} />
                      ) : (
                        <span className="text-neutral">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {client.findings.length > 0 ? (
                        <Badge variant="error">{client.findings.length} finding{client.findings.length > 1 ? 's' : ''}</Badge>
                      ) : (
                        <span className="text-neutral text-xs">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral text-xs">
                      {client.record.kycStatus ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral text-xs">
                      {formatDate(client.record.onboardingDate)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedClient && (
        <Dialog
          isOpen
          title={`${selectedClient.record.clientName ?? selectedClient.record.clientId} — Details`}
          onClose={closeDialog}
        >
          <ClientDetailPanel client={selectedClient} />
        </Dialog>
      )}
    </section>
  )
}

interface SortableHeaderProps {
  column: SortColumn
  label: string
  sort: SortState
  onSort: (column: SortColumn) => void
}

const SortableHeader: FC<SortableHeaderProps> = ({ column, label, sort, onSort }) => {
  const isActive = sort.column === column
  const ariaSort = isActive ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className="px-4 py-3 text-left font-semibold text-text"
    >
      <button
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded transition-colors min-h-11 -my-3 px-0 py-3"
        aria-label={`Sort by ${label}${isActive ? `, currently ${ariaSort}` : ''}`}
      >
        {label}
        <span aria-hidden="true" className="text-xs">
          {isActive ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
        </span>
      </button>
    </th>
  )
}

interface ClientDetailPanelProps {
  client: ClientWithClassification
}

const ClientDetailPanel: FC<ClientDetailPanelProps> = ({ client }) => {
  const { record, classification, findings } = client

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-neutral font-medium uppercase tracking-wide">Client ID</dt>
          <dd className="mt-1 font-mono text-xs">{record.clientId}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral font-medium uppercase tracking-wide">Branch</dt>
          <dd className="mt-1">{record.branch ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral font-medium uppercase tracking-wide">KYC Status</dt>
          <dd className="mt-1">{record.kycStatus ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral font-medium uppercase tracking-wide">RM</dt>
          <dd className="mt-1">{record.relationshipManager ?? <span className="text-error font-medium">Missing</span>}</dd>
        </div>
      </div>

      <div className="border-t border-neutral/20 pt-4">
        <h3 className="text-xs text-neutral font-medium uppercase tracking-wide mb-2">
          Classification
        </h3>
        <div className="flex items-start gap-4">
          <div>
            <span className="text-xs text-neutral">Computed</span>
            <div className="mt-1">
              <RiskBadge tier={classification.tier} />
            </div>
          </div>
          <div>
            <span className="text-xs text-neutral">Recorded</span>
            <div className="mt-1">
              {record.recordedRiskClassification ? (
                <RiskBadge tier={record.recordedRiskClassification} />
              ) : (
                <span className="text-neutral">—</span>
              )}
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-neutral bg-background rounded p-2">
          {classification.explanation}
        </p>
      </div>

      {findings.length > 0 && (
        <div className="border-t border-neutral/20 pt-4">
          <h3 className="text-xs text-neutral font-medium uppercase tracking-wide mb-2">
            Findings ({findings.length})
          </h3>
          <ul className="space-y-2" aria-label="Compliance findings">
            {findings.map((finding, index) => (
              <li
                key={index}
                className="flex items-start gap-2 bg-error/5 border border-error/20 rounded p-2"
              >
                <span className="text-error text-xs font-semibold shrink-0">{finding.severity}</span>
                <span className="text-xs">{finding.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
