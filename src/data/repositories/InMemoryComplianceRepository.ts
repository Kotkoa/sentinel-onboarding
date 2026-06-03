import type { ComplianceRecord } from '../../domain/model/types'
import type { ComplianceRepository } from './ComplianceRepository'

export class InMemoryComplianceRepository implements ComplianceRepository {
  private records: ComplianceRecord[] = []

  async save(record: ComplianceRecord): Promise<void> {
    this.records.push(record)
  }

  async list(): Promise<ComplianceRecord[]> {
    return [...this.records].sort((a, b) => b.assessedAt.localeCompare(a.assessedAt))
  }

  async getByClientId(clientId: string): Promise<ComplianceRecord[]> {
    return this.records.filter((record) => record.clientId === clientId)
  }
}
