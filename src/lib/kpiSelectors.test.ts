import { describe, it, expect } from 'vitest'
import { computeKpis, computeBranchDistribution, nullsLastComparator } from './kpiSelectors'
import { loadCsvClients } from '../test/helpers'

describe('computeKpis', () => {
  it('total equals number of valid client records', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    expect(kpis.total).toBe(46)
  })

  it('highRiskCount matches hand-counted HIGH clients from CSV', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    const manualHighCount = clients.filter((client) => client.classification.tier === 'HIGH').length
    expect(kpis.highRiskCount).toBe(manualHighCount)
    expect(kpis.highRiskCount).toBeGreaterThan(0)
  })

  it('highRiskPercent is rounded percentage', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    expect(kpis.highRiskPercent).toBe(Math.round((kpis.highRiskCount / kpis.total) * 100))
  })

  it('openFindingsCount equals total number of findings across all clients', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    const manualTotal = clients.flatMap((client) => client.findings).length
    expect(kpis.openFindingsCount).toBe(manualTotal)
  })

  it('clientsWithFindingsCount equals clients with at least one finding', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    const manualCount = clients.filter((client) => client.findings.length > 0).length
    expect(kpis.clientsWithFindingsCount).toBe(manualCount)
  })

  it('missingRmPercent reflects clients with MISSING_RM finding', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    const missingRmCount = clients.filter((client) =>
      client.findings.some((finding) => finding.code === 'MISSING_RM'),
    ).length
    expect(kpis.missingRmPercent).toBe(Math.round((missingRmCount / clients.length) * 100))
  })

  it('returns zeros for empty clients array', () => {
    const kpis = computeKpis([])
    expect(kpis.total).toBe(0)
    expect(kpis.highRiskCount).toBe(0)
    expect(kpis.highRiskPercent).toBe(0)
    expect(kpis.openFindingsCount).toBe(0)
    expect(kpis.clientsWithFindingsCount).toBe(0)
    expect(kpis.missingRmPercent).toBe(0)
  })
})

describe('computeBranchDistribution', () => {
  it('returns one entry per unique branch', () => {
    const clients = loadCsvClients()
    const distribution = computeBranchDistribution(clients)
    const branches = clients.map((client) => client.record.branch ?? 'Unknown')
    const uniqueBranches = new Set(branches)
    expect(distribution.length).toBe(uniqueBranches.size)
  })

  it('total across all branches equals total clients', () => {
    const clients = loadCsvClients()
    const distribution = computeBranchDistribution(clients)
    const total = distribution.reduce((sum, branch) => sum + branch.count, 0)
    expect(total).toBe(clients.length)
  })

  it('per-branch counts sum to branch total', () => {
    const clients = loadCsvClients()
    const distribution = computeBranchDistribution(clients)
    for (const branch of distribution) {
      expect(branch.highCount + branch.mediumCount + branch.lowCount).toBe(branch.count)
    }
  })

  it('includes Mayfair, Edinburgh, Manchester, Canary Wharf branches', () => {
    const clients = loadCsvClients()
    const distribution = computeBranchDistribution(clients)
    const branchNames = distribution.map((branch) => branch.branch)
    expect(branchNames).toContain('Mayfair')
    expect(branchNames).toContain('Edinburgh')
    expect(branchNames).toContain('Manchester')
    expect(branchNames).toContain('Canary Wharf')
  })
})

describe('nullsLastComparator', () => {
  it('sorts non-null values normally', () => {
    const items = [{ name: 'Zara' }, { name: 'Adam' }, { name: 'Maria' }]
    const comparator = nullsLastComparator<{ name: string | null }>((item) => item.name)
    const sorted = [...items].sort(comparator)
    expect(sorted.map((item) => item.name)).toEqual(['Adam', 'Maria', 'Zara'])
  })

  it('puts null values at the end', () => {
    const items = [{ name: null }, { name: 'Adam' }, { name: null }, { name: 'Zara' }]
    const comparator = nullsLastComparator<{ name: string | null }>((item) => item.name)
    const sorted = [...items].sort(comparator)
    expect(sorted[0]!.name).toBe('Adam')
    expect(sorted[1]!.name).toBe('Zara')
    expect(sorted[2]!.name).toBeNull()
    expect(sorted[3]!.name).toBeNull()
  })

  it('handles all nulls', () => {
    const items = [{ name: null }, { name: null }]
    const comparator = nullsLastComparator<{ name: string | null }>((item) => item.name)
    const sorted = [...items].sort(comparator)
    expect(sorted).toHaveLength(2)
  })
})
