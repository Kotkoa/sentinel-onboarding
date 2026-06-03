import type { ClientRecord, ClassificationResult, Finding } from '../model/types'

export function detectFindings(
  record: ClientRecord,
  classification: ClassificationResult,
): Finding[] {
  const findings: Finding[] = []

  if (
    record.recordedRiskClassification !== null &&
    record.recordedRiskClassification !== classification.tier
  ) {
    findings.push({
      clientId: record.clientId,
      code: 'MISCLASSIFIED',
      severity: 'CRITICAL',
      description: `Recorded risk '${record.recordedRiskClassification}' does not match computed tier '${classification.tier}'.`,
      field: 'risk_classification',
    })
  }

  if (!record.relationshipManager) {
    findings.push({
      clientId: record.clientId,
      code: 'MISSING_RM',
      severity: 'CRITICAL',
      description: 'No relationship manager assigned — attributability gap.',
      field: 'relationship_manager',
    })
  }

  if (record.kycStatus === 'APPROVED' && !record.idVerificationDate) {
    findings.push({
      clientId: record.clientId,
      code: 'APPROVED_WITHOUT_ID_VERIFICATION',
      severity: 'CRITICAL',
      description: 'KYC status is APPROVED but no ID verification date recorded.',
      field: 'id_verification_date',
    })
  }

  if (classification.tier === 'HIGH' && record.kycStatus === 'APPROVED') {
    findings.push({
      clientId: record.clientId,
      code: 'HIGH_RISK_APPROVED_WITHOUT_EDD',
      severity: 'CRITICAL',
      description:
        'HIGH risk client approved without Enhanced Due Diligence (EDD) sign-off.',
      field: 'kyc_status',
    })
  }

  return findings
}
