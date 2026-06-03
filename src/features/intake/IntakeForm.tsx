import { type FC, useState, useMemo, useId, useEffect } from 'react'
import { classify } from '../../domain/rules/evaluator'
import { defaultRuleset } from '../../domain/rules/defaultRuleset'
import { RiskBadge } from '../../ui/components/RiskBadge'
import { Button } from '../../ui/components/Button'
import { intakeSchema, type IntakeFormData } from './intakeSchema'
import type { ClientRecord, ClassificationResult, ComplianceRecord } from '../../domain/model/types'
import type { ComplianceRepository } from '../../data/repositories/ComplianceRepository'

interface IntakeFormProps {
  repository: ComplianceRepository
  assessedBy: string
  onSuccess?: (record: ComplianceRecord) => void
}

type FormErrors = Partial<Record<keyof IntakeFormData, string>>

const COUNTRIES = [
  'Australia', 'Belarus', 'Brazil', 'Canada', 'China', 'France', 'Germany',
  'Japan', 'Mexico', 'Netherlands', 'Russia', 'Singapore', 'South Africa',
  'Turkey', 'UAE', 'United Kingdom', 'Venezuela',
]

const SOURCE_OF_FUNDS = [
  'Business Income', 'Employment', 'Gift', 'Inheritance', 'Investment Returns',
  'Other', 'Pension', 'Property Sale',
]

const BRANCHES = ['Canary Wharf', 'Edinburgh', 'Mayfair', 'Manchester']

type Step = 'form' | 'attestation' | 'success'

function buildClientRecord(data: IntakeFormData, clientId: string): ClientRecord {
  return {
    clientId,
    clientName: data.clientName,
    clientType: data.clientType,
    countryOfTaxResidence: data.countryOfTaxResidence,
    pepStatus: data.pepStatus,
    sanctionsScreeningMatch: data.sanctionsScreeningMatch,
    adverseMediaFlag: data.adverseMediaFlag,
    annualIncome: data.annualIncome,
    sourceOfFunds: data.sourceOfFunds,
    kycStatus: data.kycStatus,
    idVerificationDate: data.idVerificationDate ?? null,
    relationshipManager: data.relationshipManager,
    branch: data.branch,
    onboardingDate: new Date().toISOString().split('T')[0] ?? null,
    recordedRiskClassification: null,
    documentationComplete: data.documentationComplete,
    source: 'INTAKE',
  }
}

export const IntakeForm: FC<IntakeFormProps> = ({ repository, assessedBy, onSuccess }) => {
  const formId = useId()

  const [step, setStep] = useState<Step>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [pendingRecord, setPendingRecord] = useState<{
    clientRecord: ClientRecord
    classification: ClassificationResult
  } | null>(null)

  const [formData, setFormData] = useState<Partial<IntakeFormData>>({
    pepStatus: false,
    sanctionsScreeningMatch: false,
    adverseMediaFlag: false,
    documentationComplete: false,
    kycStatus: 'PENDING',
  })

  const liveClassification = useMemo<ClassificationResult | null>(() => {
    if (!formData.countryOfTaxResidence && !formData.pepStatus) return null

    const partial: ClientRecord = {
      clientId: 'PREVIEW',
      clientName: formData.clientName ?? null,
      clientType: formData.clientType ?? null,
      countryOfTaxResidence: formData.countryOfTaxResidence ?? null,
      pepStatus: formData.pepStatus ?? false,
      sanctionsScreeningMatch: formData.sanctionsScreeningMatch ?? false,
      adverseMediaFlag: formData.adverseMediaFlag ?? false,
      annualIncome: formData.annualIncome ?? null,
      sourceOfFunds: formData.sourceOfFunds ?? null,
      kycStatus: formData.kycStatus ?? null,
      idVerificationDate: formData.idVerificationDate ?? null,
      relationshipManager: formData.relationshipManager ?? null,
      branch: formData.branch ?? null,
      onboardingDate: null,
      recordedRiskClassification: null,
      documentationComplete: formData.documentationComplete ?? false,
      source: 'INTAKE',
    }

    return classify(partial, defaultRuleset)
  }, [formData])

  const isHighRisk = liveClassification?.tier === 'HIGH'

  useEffect(() => {
    if (isHighRisk && formData.kycStatus !== 'ENHANCED_DUE_DILIGENCE') {
      setFormData((prev) => ({ ...prev, kycStatus: 'ENHANCED_DUE_DILIGENCE' }))
    } else if (!isHighRisk && formData.kycStatus === 'ENHANCED_DUE_DILIGENCE') {
      setFormData((prev) => ({ ...prev, kycStatus: 'PENDING' }))
    }
  }, [isHighRisk, formData.kycStatus])

  const setField = <TKey extends keyof IntakeFormData>(key: TKey, value: IntakeFormData[TKey]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  const handleSubmit = () => {
    const result = intakeSchema.safeParse(formData)

    if (!result.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof IntakeFormData
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    const clientRecord = buildClientRecord(result.data, `INTAKE-${Date.now()}`)
    const classification = classify(clientRecord, defaultRuleset)

    if (classification.tier === 'HIGH' && result.data.kycStatus === 'APPROVED') {
      setErrors({ kycStatus: 'HIGH risk clients require Enhanced Due Diligence — APPROVED is not permitted.' })
      return
    }

    setPendingRecord({ clientRecord, classification })
    setStep('attestation')
  }

  const handleAttest = async () => {
    if (!pendingRecord) return

    setIsSubmitting(true)

    const complianceRecord: ComplianceRecord = {
      id: `CR-${Date.now()}`,
      clientId: pendingRecord.clientRecord.clientId,
      assessmentData: pendingRecord.clientRecord,
      classification: pendingRecord.classification,
      assessedBy,
      assessedAt: new Date().toISOString(),
      rulesetVersion: pendingRecord.classification.rulesetVersion,
      attestation: {
        attestedBy: assessedBy,
        attestedAt: new Date().toISOString(),
        statement: 'I attest that the information provided is accurate and complete to the best of my knowledge, in accordance with MLR 2017 and SYSC requirements.',
      },
      syncStatus: 'LOCAL',
    }

    await repository.save(complianceRecord)
    setIsSubmitting(false)
    setStep('success')
    onSuccess?.(complianceRecord)
  }

  return (
    <section aria-labelledby={`${formId}-title`} className="max-w-2xl mx-auto">
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveClassification
          ? `Live classification: ${liveClassification.tier}. ${liveClassification.explanation}`
          : ''}
      </div>

      {step === 'success' && (
        <div className="py-12 text-center">
          <div className="text-success text-5xl mb-4">✓</div>
          <h2 id={`${formId}-title`} className="text-xl font-semibold text-text mb-2">Assessment recorded</h2>
          <p className="text-neutral">The compliance record has been saved successfully.</p>
          <Button
            className="mt-6"
            variant="secondary"
            onClick={() => {
              setFormData({
                pepStatus: false,
                sanctionsScreeningMatch: false,
                adverseMediaFlag: false,
                documentationComplete: false,
                kycStatus: 'PENDING',
              })
              setErrors({})
              setPendingRecord(null)
              setStep('form')
            }}
          >
            New assessment
          </Button>
        </div>
      )}

      {step === 'attestation' && pendingRecord && (
        <div className="max-w-lg mx-auto space-y-6">
          <h2 id={`${formId}-title`} className="text-lg font-semibold text-text">Attestation</h2>
          <div className="bg-background rounded-card p-4 space-y-2 text-sm">
            <p>
              <span className="font-medium">Client:</span> {pendingRecord.clientRecord.clientName}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium">Computed risk tier:</span>
              <RiskBadge tier={pendingRecord.classification.tier} />
            </p>
            <p className="text-neutral text-xs">{pendingRecord.classification.explanation}</p>
          </div>
          <div className="bg-warning/5 border border-warning/40 rounded-card p-4 text-sm">
            <p className="font-medium text-text mb-2">Attestation statement</p>
            <p className="text-neutral text-xs leading-relaxed">
              I attest that the information provided is accurate and complete to the best of my
              knowledge, in accordance with MLR 2017 and SYSC requirements. I understand that this
              record is subject to regulatory review.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setStep('form')}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button
              onClick={handleAttest}
              isLoading={isSubmitting}
              aria-label="Confirm and attest the compliance record"
            >
              Confirm & Attest
            </Button>
          </div>
        </div>
      )}

      {step === 'form' && (
      <div>
      <h2 id={`${formId}-title`} className="text-lg font-semibold text-text mb-6">
        New Client Assessment
      </h2>

      {liveClassification && (
        <div
          className={[
            'mb-6 p-4 rounded-card border text-sm flex items-start gap-3',
            liveClassification.tier === 'HIGH'
              ? 'bg-error/5 border-error/30'
              : liveClassification.tier === 'MEDIUM'
              ? 'bg-warning/5 border-warning/40'
              : 'bg-success/5 border-success/30',
          ].join(' ')}
          aria-hidden="true"
        >
          <span className="text-neutral shrink-0">Live classification:</span>
          <RiskBadge tier={liveClassification.tier} />
          <span className="text-xs text-neutral ml-2">{liveClassification.explanation}</span>
        </div>
      )}

      {isHighRisk && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-card border border-error/30 bg-error/5 text-sm"
        >
          <p className="font-semibold text-error mb-1">Enhanced Due Diligence required</p>
          <p className="text-text">
            This client is classified as HIGH risk. Senior compliance sign-off is required before
            approval. KYC status has been set to Enhanced Due Diligence automatically.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${formId}-clientName`} className="text-sm font-medium text-text">
              Client name <span aria-hidden="true" className="text-error">*</span>
            </label>
            <input
              id={`${formId}-clientName`}
              type="text"
              value={formData.clientName ?? ''}
              onChange={(event) => setField('clientName', event.target.value)}
              aria-invalid={errors.clientName ? 'true' : undefined}
              aria-describedby={errors.clientName ? `${formId}-clientName-error` : undefined}
              className={[
                'min-h-11 px-3 py-2 rounded-lg border text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.clientName ? 'border-error' : 'border-neutral/40',
              ].join(' ')}
            />
            {errors.clientName && (
              <span id={`${formId}-clientName-error`} role="alert" className="text-xs text-error">
                {errors.clientName}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`${formId}-branch`} className="text-sm font-medium text-text">
              Branch <span aria-hidden="true" className="text-error">*</span>
            </label>
            <select
              id={`${formId}-branch`}
              value={formData.branch ?? ''}
              onChange={(event) => setField('branch', event.target.value)}
              aria-invalid={errors.branch ? 'true' : undefined}
              aria-describedby={errors.branch ? `${formId}-branch-error` : undefined}
              className={[
                'min-h-11 px-3 py-2 rounded-lg border text-sm bg-white',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.branch ? 'border-error' : 'border-neutral/40',
              ].join(' ')}
            >
              <option value="">Select branch</option>
              {BRANCHES.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            {errors.branch && (
              <span id={`${formId}-branch-error`} role="alert" className="text-xs text-error">
                {errors.branch}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${formId}-clientType`} className="text-sm font-medium text-text">
              Client type <span aria-hidden="true" className="text-error">*</span>
            </label>
            <select
              id={`${formId}-clientType`}
              value={formData.clientType ?? ''}
              onChange={(event) =>
                setField('clientType', event.target.value as 'INDIVIDUAL' | 'ENTITY')
              }
              aria-invalid={errors.clientType ? 'true' : undefined}
              aria-describedby={errors.clientType ? `${formId}-clientType-error` : undefined}
              className={[
                'min-h-11 px-3 py-2 rounded-lg border text-sm bg-white',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.clientType ? 'border-error' : 'border-neutral/40',
              ].join(' ')}
            >
              <option value="">Select type</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="ENTITY">Entity</option>
            </select>
            {errors.clientType && (
              <span id={`${formId}-clientType-error`} role="alert" className="text-xs text-error">
                {errors.clientType}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${formId}-countryOfTaxResidence`}
              className="text-sm font-medium text-text"
            >
              Country of tax residence <span aria-hidden="true" className="text-error">*</span>
            </label>
            <select
              id={`${formId}-countryOfTaxResidence`}
              value={formData.countryOfTaxResidence ?? ''}
              onChange={(event) => setField('countryOfTaxResidence', event.target.value)}
              aria-invalid={errors.countryOfTaxResidence ? 'true' : undefined}
              aria-describedby={
                errors.countryOfTaxResidence
                  ? `${formId}-countryOfTaxResidence-error`
                  : undefined
              }
              className={[
                'min-h-11 px-3 py-2 rounded-lg border text-sm bg-white',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.countryOfTaxResidence ? 'border-error' : 'border-neutral/40',
              ].join(' ')}
            >
              <option value="">Select country</option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {errors.countryOfTaxResidence && (
              <span
                id={`${formId}-countryOfTaxResidence-error`}
                role="alert"
                className="text-xs text-error"
              >
                {errors.countryOfTaxResidence}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {(
            [
              { key: 'pepStatus', label: 'PEP status' },
              { key: 'sanctionsScreeningMatch', label: 'Sanctions screening match' },
              { key: 'adverseMediaFlag', label: 'Adverse media flag' },
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <label htmlFor={`${formId}-${key}`} className="text-sm font-medium text-text">
                {label}
              </label>
              <select
                id={`${formId}-${key}`}
                value={formData[key] === true ? 'true' : 'false'}
                onChange={(event) => setField(key, event.target.value === 'true')}
                className="min-h-11 px-3 py-2 rounded-lg border border-neutral/40 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${formId}-annualIncome`} className="text-sm font-medium text-text">
              Annual income (£) <span aria-hidden="true" className="text-error">*</span>
            </label>
            <input
              id={`${formId}-annualIncome`}
              type="number"
              min="0"
              value={formData.annualIncome ?? ''}
              onChange={(event) => {
                if (event.target.value === '') {
                  setFormData((prev) => ({ ...prev, annualIncome: undefined }))
                } else {
                  setField('annualIncome', Number(event.target.value))
                }
              }}
              aria-invalid={errors.annualIncome ? 'true' : undefined}
              aria-describedby={errors.annualIncome ? `${formId}-annualIncome-error` : undefined}
              className={[
                'min-h-11 px-3 py-2 rounded-lg border text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.annualIncome ? 'border-error' : 'border-neutral/40',
              ].join(' ')}
            />
            {errors.annualIncome && (
              <span id={`${formId}-annualIncome-error`} role="alert" className="text-xs text-error">
                {errors.annualIncome}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`${formId}-sourceOfFunds`} className="text-sm font-medium text-text">
              Source of funds <span aria-hidden="true" className="text-error">*</span>
            </label>
            <select
              id={`${formId}-sourceOfFunds`}
              value={formData.sourceOfFunds ?? ''}
              onChange={(event) => setField('sourceOfFunds', event.target.value)}
              aria-invalid={errors.sourceOfFunds ? 'true' : undefined}
              aria-describedby={errors.sourceOfFunds ? `${formId}-sourceOfFunds-error` : undefined}
              className={[
                'min-h-11 px-3 py-2 rounded-lg border text-sm bg-white',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.sourceOfFunds ? 'border-error' : 'border-neutral/40',
              ].join(' ')}
            >
              <option value="">Select source</option>
              {SOURCE_OF_FUNDS.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            {errors.sourceOfFunds && (
              <span
                id={`${formId}-sourceOfFunds-error`}
                role="alert"
                className="text-xs text-error"
              >
                {errors.sourceOfFunds}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${formId}-kycStatus`} className="text-sm font-medium text-text">
              KYC status <span aria-hidden="true" className="text-error">*</span>
            </label>
            <select
              id={`${formId}-kycStatus`}
              value={formData.kycStatus ?? ''}
              onChange={(event) =>
                setField(
                  'kycStatus',
                  event.target.value as IntakeFormData['kycStatus'],
                )
              }
              aria-invalid={errors.kycStatus ? 'true' : undefined}
              aria-describedby={errors.kycStatus ? `${formId}-kycStatus-error` : undefined}
              className={[
                'min-h-11 px-3 py-2 rounded-lg border text-sm bg-white',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.kycStatus ? 'border-error' : 'border-neutral/40',
              ].join(' ')}
            >
              <option value="">Select status</option>
              <option value="PENDING">Pending</option>
              {!isHighRisk && <option value="APPROVED">Approved</option>}
              <option value="REJECTED">Rejected</option>
              <option value="ENHANCED_DUE_DILIGENCE">Enhanced Due Diligence</option>
            </select>
            {errors.kycStatus && (
              <span id={`${formId}-kycStatus-error`} role="alert" className="text-xs text-error">
                {errors.kycStatus}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${formId}-relationshipManager`}
              className="text-sm font-medium text-text"
            >
              Relationship manager <span aria-hidden="true" className="text-error">*</span>
            </label>
            <input
              id={`${formId}-relationshipManager`}
              type="text"
              value={formData.relationshipManager ?? ''}
              onChange={(event) => setField('relationshipManager', event.target.value)}
              aria-invalid={errors.relationshipManager ? 'true' : undefined}
              aria-describedby={
                errors.relationshipManager
                  ? `${formId}-relationshipManager-error`
                  : undefined
              }
              className={[
                'min-h-11 px-3 py-2 rounded-lg border text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.relationshipManager ? 'border-error' : 'border-neutral/40',
              ].join(' ')}
            />
            {errors.relationshipManager && (
              <span
                id={`${formId}-relationshipManager-error`}
                role="alert"
                className="text-xs text-error"
              >
                {errors.relationshipManager}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSubmit} aria-label="Submit the client assessment">
            Submit assessment
          </Button>
          <span className="text-xs text-neutral">* Required fields</span>
        </div>
      </div>
      </div>
      )}
    </section>
  )
}
