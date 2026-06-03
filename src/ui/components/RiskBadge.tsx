import type { FC } from 'react'
import type { RiskTier } from '../../domain/model/types'

interface RiskBadgeProps {
  tier: RiskTier
}

const tierConfig = {
  LOW: {
    label: 'LOW',
    className: 'bg-success/10 text-success border border-success/30',
  },
  MEDIUM: {
    label: 'MEDIUM',
    className: 'bg-warning/10 text-text border border-warning/60',
  },
  HIGH: {
    label: 'HIGH',
    className: 'bg-error/10 text-error border border-error/30',
  },
} satisfies Record<RiskTier, { label: string; className: string }>

export const RiskBadge: FC<RiskBadgeProps> = ({ tier }) => {
  const config = tierConfig[tier]

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}
      aria-label={`Risk tier: ${config.label}`}
    >
      {config.label}
    </span>
  )
}
