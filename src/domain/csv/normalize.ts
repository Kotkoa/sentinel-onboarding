import type { RawCsvRow, ClientRecord, RiskTier, KycStatus } from '../model/types'

function parseBoolean(value: string | undefined): boolean | null {
  if (value === undefined || value === '') return null
  const normalised = value.trim().toUpperCase()
  if (normalised === 'TRUE') return true
  if (normalised === 'FALSE') return false
  return null
}

function parseIncome(value: string | undefined): number | null {
  if (value === undefined || value === '') return null
  const parsed = Number(value)
  if (isNaN(parsed)) return null
  return parsed
}

function parseRiskTier(value: string | undefined): RiskTier | null {
  if (value === undefined || value === '') return null
  const upper = value.trim().toUpperCase()
  if (upper === 'LOW' || upper === 'MEDIUM' || upper === 'HIGH') return upper
  return null
}

function parseKycStatus(value: string | undefined): KycStatus | null {
  if (value === undefined || value === '') return null
  const upper = value.trim().toUpperCase()
  const valid: KycStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'ENHANCED_DUE_DILIGENCE']
  return valid.includes(upper as KycStatus) ? (upper as KycStatus) : null
}

function parseClientType(value: string | undefined): 'INDIVIDUAL' | 'ENTITY' | null {
  if (value === undefined || value === '') return null
  const upper = value.trim().toUpperCase()
  if (upper === 'INDIVIDUAL' || upper === 'ENTITY') return upper
  return null
}

function parseStringOrNull(value: string | undefined): string | null {
  if (value === undefined || value.trim() === '') return null
  return value.trim()
}

export function normalizeRow(raw: RawCsvRow): ClientRecord | null {
  if (!raw.client_id || raw.client_id.trim() === '') return null

  return {
    clientId: raw.client_id.trim(),
    clientName: parseStringOrNull(raw.client_name),
    clientType: parseClientType(raw.client_type),
    countryOfTaxResidence: parseStringOrNull(raw.country_of_tax_residence),
    pepStatus: parseBoolean(raw.pep_status),
    sanctionsScreeningMatch: parseBoolean(raw.sanctions_screening_match),
    adverseMediaFlag: parseBoolean(raw.adverse_media_flag),
    annualIncome: parseIncome(raw.annual_income),
    sourceOfFunds: parseStringOrNull(raw.source_of_funds),
    kycStatus: parseKycStatus(raw.kyc_status),
    idVerificationDate: parseStringOrNull(raw.id_verification_date),
    relationshipManager: parseStringOrNull(raw.relationship_manager),
    branch: parseStringOrNull(raw.branch),
    onboardingDate: parseStringOrNull(raw.onboarding_date),
    recordedRiskClassification: parseRiskTier(raw.risk_classification),
    documentationComplete: parseBoolean(raw.documentation_complete),
    source: 'CSV_IMPORT',
  }
}
