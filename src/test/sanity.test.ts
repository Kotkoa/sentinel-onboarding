import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('sanity', () => {
  it('is always true', () => {
    expect(true).toBe(true)
  })

  it('CSV fixture is accessible', () => {
    const fixturePath = join(__dirname, 'fixtures/client_onboarding.csv')
    const content = readFileSync(fixturePath, 'utf-8')
    expect(content.length).toBeGreaterThan(0)
    expect(content).toContain('client_id')
  })
})
