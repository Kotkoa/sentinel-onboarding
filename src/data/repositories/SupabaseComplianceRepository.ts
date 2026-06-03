import type { SupabaseClient } from '@supabase/supabase-js'
import type { ComplianceRecord } from '../../domain/model/types'
import type { ComplianceRepository } from './ComplianceRepository'
import type { ComplianceRecordRow } from '../supabase/database.types'
import { toInsertRow, fromRow } from './mapping'

export class SupabaseComplianceRepository implements ComplianceRepository {
  constructor(private readonly client: SupabaseClient) {}

  async save(record: ComplianceRecord): Promise<void> {
    const { error } = await this.client
      .from('compliance_records')
      .insert(toInsertRow(record))

    if (error) {
      throw new Error(`Failed to save compliance record: ${error.message}`)
    }
  }

  async list(): Promise<ComplianceRecord[]> {
    const { data, error } = await this.client
      .from('compliance_records')
      .select('*')
      .order('assessed_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to list compliance records: ${error.message}`)
    }

    return (data as ComplianceRecordRow[]).map(fromRow)
  }

  async getByClientId(clientId: string): Promise<ComplianceRecord[]> {
    const { data, error } = await this.client
      .from('compliance_records')
      .select('*')
      .eq('client_id', clientId)
      .order('assessed_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get compliance records for client ${clientId}: ${error.message}`)
    }

    return (data as ComplianceRecordRow[]).map(fromRow)
  }
}
