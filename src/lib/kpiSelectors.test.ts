import { describe, it, expect } from 'vitest'
import { computeKpis, computeBranchDistribution, nullsLastComparator } from './kpiSelectors'
import { loadCsvClients } from '../test/helpers'

describe('computeKpis', () => {
  it('total equals 46 (hand-counted from CSV fixture)', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    expect(kpis.total).toBe(46)
  })

  it('highRiskCount equals 18 (hand-counted: PEP/sanctions/adverse_media/high-risk country)', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    expect(kpis.highRiskCount).toBe(18)
  })

  it('highRiskPercent equals 39 (18/46 rounded)', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    expect(kpis.highRiskPercent).toBe(39)
  })

  it('openFindingsCount equals total findings across all clients (dataset-driven)', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    const manualTotal = clients.flatMap((client) => client.findings).length
    expect(kpis.openFindingsCount).toBe(manualTotal)
    expect(kpis.openFindingsCount).toBeGreaterThan(0)
  })

  it('clientsWithFindingsCount equals clients with at least one finding', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    const manualCount = clients.filter((client) => client.findings.length > 0).length
    expect(kpis.clientsWithFindingsCount).toBe(manualCount)
  })

  it('missingRmPercent equals 7 (3 missing RM out of 46, rounded)', () => {
    const clients = loadCsvClients()
    const kpis = computeKpis(clients)
    expect(kpis.missingRmPercent).toBe(7)
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
  it('returns 4 entries — one per branch in the CSV', () => {
    const clients = loadCsvClients()
    const distribution = computeBranchDistribution(clients)
    expect(distribution.length).toBe(4)
  })

  it('Canary Wharf: 11 total, 4 HIGH, 2 MEDIUM, 5 LOW (hand-counted)', () => {
    const clients = loadCsvClients()
    const distribution = computeBranchDistribution(clients)
    const branch = distribution.find((branchEntry) => branchEntry.branch === 'Canary Wharf')
    expect(branch).toBeDefined()
    expect(branch!.count).toBe(11)
    expect(branch!.highCount).toBe(4)
    expect(branch!.mediumCount).toBe(2)
    expect(branch!.lowCount).toBe(5)
  })

  it('Edinburgh: 12 total, 6 HIGH, 3 MEDIUM, 3 LOW (hand-counted)', () => {
    const clients = loadCsvClients()
    const distribution = computeBranchDistribution(clients)
    const branch = distribution.find((branchEntry) => branchEntry.branch === 'Edinburgh')
    expect(branch).toBeDefined()
    expect(branch!.count).toBe(12)
    expect(branch!.highCount).toBe(6)
    expect(branch!.mediumCount).toBe(3)
    expect(branch!.lowCount).toBe(3)
  })

  it('Manchester: 11 total, 4 HIGH, 6 MEDIUM, 1 LOW (hand-counted)', () => {
    const clients = loadCsvClients()
    const distribution = computeBranchDistribution(clients)
    const branch = distribution.find((branchEntry) => branchEntry.branch === 'Manchester')
    expect(branch).toBeDefined()
    expect(branch!.count).toBe(11)
    expect(branch!.highCount).toBe(4)
    expect(branch!.mediumCount).toBe(6)
    expect(branch!.lowCount).toBe(1)
  })

  it('Mayfair: 12 total, 4 HIGH, 3 MEDIUM, 5 LOW (hand-counted)', () => {
    const clients = loadCsvClients()
    const distribution = computeBranchDistribution(clients)
    const branch = distribution.find((branchEntry) => branchEntry.branch === 'Mayfair')
    expect(branch).toBeDefined()
    expect(branch!.count).toBe(12)
    expect(branch!.highCount).toBe(4)
    expect(branch!.mediumCount).toBe(3)
    expect(branch!.lowCount).toBe(5)
  })

  it('total across all branches equals total clients', () => {
    const clients = loadCsvClients()
    const distribution = computeBranchDistribution(clients)
    const total = distribution.reduce((sum, branch) => sum + branch.count, 0)
    expect(total).toBe(46)
  })

  it('per-branch counts sum to branch total', () => {
    const clients = loadCsvClients()
    const distribution = computeBranchDistribution(clients)
    for (const branch of distribution) {
      expect(branch.highCount + branch.mediumCount + branch.lowCount).toBe(branch.count)
    }
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
