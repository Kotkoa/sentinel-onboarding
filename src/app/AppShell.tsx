import { type FC, useState, useCallback, useEffect, useRef } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { ClientsList } from '../features/clients-list/ClientsList'
import { IntakeForm } from '../features/intake/IntakeForm'
import { AuditDashboard } from '../features/audit/AuditDashboard'
import { FindingsPanel } from '../features/findings/FindingsPanel'
import { DesignSystemDemo } from '../features/design-system/DesignSystemDemo'
import { InMemoryComplianceRepository } from '../data/repositories/InMemoryComplianceRepository'
import { useCsvClients } from '../lib/useCsvClients'
import type { ComplianceRecord } from '../domain/model/types'

const NAV_LINKS = [
  { to: '/', label: 'Clients', end: true },
  { to: '/intake', label: 'New Assessment' },
  { to: '/audit', label: 'Audit Dashboard' },
  { to: '/findings', label: 'Findings' },
  { to: '/design-system', label: 'Design System' },
]

const EmptyState: FC = () => (
  <div className="py-16 text-center">
    <p className="text-neutral text-base mb-2">No client data loaded.</p>
    <p className="text-neutral text-sm">
      Place{' '}
      <code className="font-mono bg-background px-1 py-0.5 rounded">
        client_onboarding.csv
      </code>{' '}
      in the{' '}
      <code className="font-mono bg-background px-1 py-0.5 rounded">public/</code> folder
      and refresh.
    </p>
  </div>
)

export const AppShell: FC = () => {
  const repositoryRef = useRef(new InMemoryComplianceRepository())
  const [loadedCsv, setLoadedCsv] = useState<string | null>(null)
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([])

  useEffect(() => {
    fetch('/client_onboarding.csv')
      .then((response) => (response.ok ? response.text() : null))
      .catch(() => null)
      .then((text) => setLoadedCsv(text))
  }, [])

  const { clients, isLoading, error } = useCsvClients(loadedCsv)

  const handleSuccess = useCallback((record: ComplianceRecord) => {
    setComplianceRecords((prev) => [...prev, record])
  }, [])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
      >
        Skip to main content
      </a>

      <header className="bg-primary text-white px-6 py-4" role="banner">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Halcyon Capital Partners</h1>
            <p className="text-sm text-primary-light">SENTINEL Onboarding</p>
          </div>
          {clients.length > 0 && (
            <span className="text-sm opacity-70">{clients.length} clients loaded</span>
          )}
        </div>
      </header>

      <nav aria-label="Primary navigation" className="bg-white border-b border-neutral/20 px-6">
        <ul className="flex gap-1 max-w-7xl mx-auto" role="list">
          {NAV_LINKS.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'inline-flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-11',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-neutral hover:text-text hover:border-neutral/40',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main id="main-content" className="px-6 py-6 max-w-7xl mx-auto">
        {isLoading && (
          <div role="status" aria-live="polite" className="py-8 text-center text-neutral">
            Loading client data…
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 p-4 rounded-card border border-error/30 bg-error/5 text-error text-sm"
          >
            {error}
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              !isLoading && clients.length === 0 ? (
                <EmptyState />
              ) : (
                <ClientsList clients={clients} />
              )
            }
          />
          <Route
            path="/intake"
            element={
              <IntakeForm
                repository={repositoryRef.current}
                assessedBy="Current User"
                onSuccess={handleSuccess}
              />
            }
          />
          <Route
            path="/audit"
            element={<AuditDashboard clients={clients} complianceRecords={complianceRecords} />}
          />
          <Route path="/findings" element={<FindingsPanel clients={clients} />} />
          <Route path="/design-system" element={<DesignSystemDemo />} />
        </Routes>
      </main>
    </>
  )
}
