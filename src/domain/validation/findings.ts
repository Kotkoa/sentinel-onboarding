import type { ClientRecord, ClassificationResult, Finding } from '../model/types'

const REQUIRED_FIELDS: Array<{ field: keyof ClientRecord; label: string }> = [
  { field: 'clientName', label: 'client_name' },
  { field: 'countryOfTaxResidence', label: 'country_of_tax_residence' },
  { field: 'kycStatus', label: 'kyc_status' },
  { field: 'onboardingDate', label: 'onboarding_date' },
]

export function detectFindings(
  record: ClientRecord,
  classification: ClassificationResult,
): Finding[] {
  return [
    ...detectMisclassified(record, classification),
    ...detectMissingRm(record),
    ...detectApprovedWithoutIdVerification(record),
    ...detectHighRiskApprovedWithoutEdd(record, classification),
    ...detectMissingRequiredFields(record),
    ...detectInvalidValues(record),
  ]
}

function detectMisclassified(
  record: ClientRecord,
  classification: ClassificationResult,
): Finding[] {
  if (
    record.recordedRiskClassification !== null &&
    record.recordedRiskClassification !== classification.tier
  ) {
    return [
      {
        clientId: record.clientId,
        code: 'MISCLASSIFIED',
        severity: 'CRITICAL',
        description: `Recorded risk '${record.recordedRiskClassification}' does not match computed tier '${classification.tier}'.`,
        field: 'risk_classification',
      },
    ]
  }
  return []
}

function detectMissingRm(record: ClientRecord): Finding[] {
  if (!record.relationshipManager) {
    return [
      {
        clientId: record.clientId,
        code: 'MISSING_RM',
        severity: 'CRITICAL',
        description: 'No relationship manager assigned — attributability gap.',
        field: 'relationship_manager',
      },
    ]
  }
  return []
}

function detectApprovedWithoutIdVerification(record: ClientRecord): Finding[] {
  if (record.kycStatus === 'APPROVED' && !record.idVerificationDate) {
    return [
      {
        clientId: record.clientId,
        code: 'APPROVED_WITHOUT_ID_VERIFICATION',
        severity: 'CRITICAL',
        description: 'KYC status is APPROVED but no ID verification date recorded.',
        field: 'id_verification_date',
      },
    ]
  }
  return []
}

function detectHighRiskApprovedWithoutEdd(
  record: ClientRecord,
  classification: ClassificationResult,
): Finding[] {
  if (classification.tier === 'HIGH' && record.kycStatus === 'APPROVED') {
    return [
      {
        clientId: record.clientId,
        code: 'HIGH_RISK_APPROVED_WITHOUT_EDD',
        severity: 'CRITICAL',
        description: 'HIGH risk client approved without Enhanced Due Diligence (EDD) sign-off.',
        field: 'kyc_status',
      },
    ]
  }
  return []
}

function detectMissingRequiredFields(record: ClientRecord): Finding[] {
  return REQUIRED_FIELDS.filter(({ field }) => record[field] === null).map(({ label }) => ({
    clientId: record.clientId,
    code: 'MISSING_REQUIRED_FIELD' as const,
    severity: 'WARNING' as const,
    description: `Required field '${label}' is missing.`,
    field: label,
  }))
}

function detectInvalidValues(record: ClientRecord): Finding[] {
  if (record.annualIncome !== null && record.annualIncome < 0) {
    return [
      {
        clientId: record.clientId,
        code: 'INVALID_VALUE',
        severity: 'WARNING',
        description: `Annual income ${record.annualIncome} is negative — invalid value.`,
        field: 'annual_income',
      },
    ]
  }
  return []
}
