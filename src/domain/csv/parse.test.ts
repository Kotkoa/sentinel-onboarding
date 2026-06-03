import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseCsv } from './parse'

const csvFixture = readFileSync(
  join(__dirname, '../../test/fixtures/client_onboarding.csv'),
  'utf-8',
)

describe('parseCsv', () => {
  it('returns ~46 rows from the fixture', () => {
    const rows = parseCsv(csvFixture)
    expect(rows.length).toBe(46)
  })

  it('maps header columns to correct field names', () => {
    const rows = parseCsv(csvFixture)
    const first = rows[0]
    expect(first).toBeDefined()
    expect(first?.client_id).toBe('CLT-001')
    expect(first?.country_of_tax_residence).toBe('Netherlands')
    expect(first?.risk_classification).toBe('LOW')
    expect(first?.documentation_complete).toBe('TRUE')
  })

  it('returns undefined for empty cells, not empty string', () => {
    const csv = 'client_id,id_verification_date\nCLT-001,\nCLT-002,2024-01-01'
    const rows = parseCsv(csv)
    expect(rows[0]?.id_verification_date).toBeUndefined()
    expect(rows[1]?.id_verification_date).toBe('2024-01-01')
  })

  it('does not drop any rows including dirty ones', () => {
    const rows = parseCsv(csvFixture)
    const ids = rows.map((row) => row.client_id)
    expect(ids).toContain('CLT-005')
    expect(ids).toContain('CLT-012')
    expect(ids).toContain('CLT-017')
    expect(ids).toContain('CLT-023')
    expect(ids).toContain('CLT-027')
    expect(ids).toContain('CLT-031')
    expect(ids).toContain('CLT-042')
  })

  it('handles empty input gracefully', () => {
    expect(parseCsv('')).toEqual([])
    expect(parseCsv('client_id,branch\n')).toEqual([])
  })
})
