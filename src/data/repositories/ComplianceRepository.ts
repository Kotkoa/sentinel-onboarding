import type { ComplianceRecord } from '../../domain/model/types'

export interface ComplianceRepository {
  save(record: ComplianceRecord): Promise<void>
  list(): Promise<ComplianceRecord[]>
  getByClientId(clientId: string): Promise<ComplianceRecord[]>
}
