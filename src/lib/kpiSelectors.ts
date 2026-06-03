import type { ClientWithClassification } from './useCsvClients'
import type { RiskTier } from '../domain/model/types'

export interface KpiSummary {
  total: number
  highRiskCount: number
  highRiskPercent: number
  openFindingsCount: number
  clientsWithFindingsCount: number
  missingRmPercent: number
}

export interface BranchDistribution {
  branch: string
  count: number
  highCount: number
  mediumCount: number
  lowCount: number
}

export function computeKpis(clients: ClientWithClassification[]): KpiSummary {
  const total = clients.length
  const highRiskCount = clients.filter((client) => client.classification.tier === 'HIGH').length
  const allFindings = clients.flatMap((client) => client.findings)
  const openFindingsCount = allFindings.length
  const clientsWithFindingsCount = clients.filter((client) => client.findings.length > 0).length
  const missingRmCount = clients.filter((client) =>
    client.findings.some((finding) => finding.code === 'MISSING_RM'),
  ).length

  return {
    total,
    highRiskCount,
    highRiskPercent: total > 0 ? Math.round((highRiskCount / total) * 100) : 0,
    openFindingsCount,
    clientsWithFindingsCount,
    missingRmPercent: total > 0 ? Math.round((missingRmCount / total) * 100) : 0,
  }
}

export function computeBranchDistribution(
  clients: ClientWithClassification[],
): BranchDistribution[] {
  const branchMap = new Map<string, BranchDistribution>()

  for (const client of clients) {
    const branch = client.record.branch ?? 'Unknown'
    const existing = branchMap.get(branch) ?? {
      branch,
      count: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    }

    const tier: RiskTier = client.classification.tier
    branchMap.set(branch, {
      ...existing,
      count: existing.count + 1,
      highCount: existing.highCount + (tier === 'HIGH' ? 1 : 0),
      mediumCount: existing.mediumCount + (tier === 'MEDIUM' ? 1 : 0),
      lowCount: existing.lowCount + (tier === 'LOW' ? 1 : 0),
    })
  }

  return Array.from(branchMap.values()).sort((branchA, branchB) =>
    branchA.branch.localeCompare(branchB.branch),
  )
}

export function nullsLastComparator<T>(
  getValue: (item: T) => string | null,
): (itemA: T, itemB: T) => number {
  return (itemA, itemB) => {
    const valueA = getValue(itemA)
    const valueB = getValue(itemB)
    if (valueA === null && valueB === null) return 0
    if (valueA === null) return 1
    if (valueB === null) return -1
    return valueA.localeCompare(valueB)
  }
}
