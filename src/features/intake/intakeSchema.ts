import { z } from 'zod'

export const intakeSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientType: z.enum(['INDIVIDUAL', 'ENTITY'], { required_error: 'Client type is required' }),
  countryOfTaxResidence: z.string().min(1, 'Country is required'),
  pepStatus: z.boolean(),
  sanctionsScreeningMatch: z.boolean(),
  adverseMediaFlag: z.boolean(),
  annualIncome: z
    .number({ invalid_type_error: 'Annual income must be a number' })
    .min(0, 'Annual income must be non-negative'),
  sourceOfFunds: z.string().min(1, 'Source of funds is required'),
  kycStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ENHANCED_DUE_DILIGENCE'], {
    required_error: 'KYC status is required',
  }),
  idVerificationDate: z.string().optional(),
  relationshipManager: z.string().min(1, 'Relationship manager is required'),
  branch: z.string().min(1, 'Branch is required'),
  documentationComplete: z.boolean(),
})

export type IntakeFormData = z.infer<typeof intakeSchema>
