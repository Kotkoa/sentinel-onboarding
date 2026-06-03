export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH'

export type KycStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ENHANCED_DUE_DILIGENCE'

export type ClientSource = 'CSV_IMPORT' | 'INTAKE'

export type SyncStatus = 'LOCAL' | 'SYNCED' | 'SYNC_FAILED'

export interface RawCsvRow {
  client_id?: string
  client_name?: string
  client_type?: string
  country_of_tax_residence?: string
  pep_status?: string
  sanctions_screening_match?: string
  adverse_media_flag?: string
  annual_income?: string
  source_of_funds?: string
  kyc_status?: string
  id_verification_date?: string
  relationship_manager?: string
  branch?: string
  onboarding_date?: string
  risk_classification?: string
  documentation_complete?: string
}

export interface ClientRecord {
  clientId: string
  clientName: string | null
  clientType: 'INDIVIDUAL' | 'ENTITY' | null
  countryOfTaxResidence: string | null
  pepStatus: boolean | null
  sanctionsScreeningMatch: boolean | null
  adverseMediaFlag: boolean | null
  annualIncome: number | null
  sourceOfFunds: string | null
  kycStatus: KycStatus | null
  idVerificationDate: string | null
  relationshipManager: string | null
  branch: string | null
  onboardingDate: string | null
  recordedRiskClassification: RiskTier | null
  documentationComplete: boolean | null
  source: ClientSource
}

export interface RuleHit {
  ruleId: string
  tier: RiskTier
  description: string
}

export interface ClassificationResult {
  tier: RiskTier
  hits: RuleHit[]
  decidingHits: RuleHit[]
  rulesetVersion: string
  explanation: string
  evaluatedAt: string
}

export type FindingCode =
  | 'MISCLASSIFIED'
  | 'MISSING_RM'
  | 'APPROVED_WITHOUT_ID_VERIFICATION'
  | 'HIGH_RISK_APPROVED_WITHOUT_EDD'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_VALUE'

export type FindingSeverity = 'CRITICAL' | 'WARNING' | 'INFO'

export interface Finding {
  clientId: string
  code: FindingCode
  severity: FindingSeverity
  description: string
  field?: string
}

export interface AttestationRecord {
  attestedBy: string
  attestedAt: string
  statement: string
}

export interface ComplianceRecord {
  id: string
  clientId: string
  assessmentData: Readonly<ClientRecord>
  classification: ClassificationResult
  assessedBy: string
  assessedAt: string
  rulesetVersion: string
  attestation: AttestationRecord
  syncStatus: SyncStatus
}
