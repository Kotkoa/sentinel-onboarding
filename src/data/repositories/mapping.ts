import type { ComplianceRecord } from '../../domain/model/types'
import type { ComplianceRecordRow, ComplianceRecordInsert } from '../supabase/database.types'

export function toInsertRow(record: ComplianceRecord): ComplianceRecordInsert {
  return {
    id: record.id,
    client_id: record.clientId,
    assessed_by: record.assessedBy,
    // assessed_at intentionally omitted — server DEFAULT now() sets the authoritative timestamp
    ruleset_version: record.rulesetVersion,
    tier: record.classification.tier,
    branch: record.assessmentData.branch ?? null,
    sync_status: 'SYNCED',
    assessment_data: record.assessmentData,
    classification: record.classification,
    attestation: record.attestation,
  }
}

export function fromRow(row: ComplianceRecordRow): ComplianceRecord {
  const assessmentData = row.assessment_data as ComplianceRecord['assessmentData']
  const classification = row.classification as ComplianceRecord['classification']
  const attestation = row.attestation as ComplianceRecord['attestation']

  return {
    id: row.id,
    clientId: row.client_id,
    assessedBy: row.assessed_by,
    assessedAt: row.assessed_at,
    rulesetVersion: row.ruleset_version,
    syncStatus: 'SYNCED',
    assessmentData,
    classification,
    attestation,
  }
}
