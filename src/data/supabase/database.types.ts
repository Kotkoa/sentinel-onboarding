export interface ComplianceRecordRow {
  id: string
  client_id: string
  assessed_by: string
  assessed_at: string
  ruleset_version: string
  tier: string
  branch: string | null
  sync_status: string
  assessment_data: unknown
  classification: unknown
  attestation: unknown
  created_at: string
}

export interface ComplianceRecordInsert {
  id?: string
  client_id: string
  assessed_by: string
  assessed_at?: string
  ruleset_version: string
  tier: string
  branch?: string | null
  sync_status?: string
  assessment_data: unknown
  classification: unknown
  attestation: unknown
  created_at?: string
}
