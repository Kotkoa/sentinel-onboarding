import { type FC, useState } from 'react'
import { Button } from '../../ui/components/Button'
import { Card } from '../../ui/components/Card'
import { RiskBadge } from '../../ui/components/RiskBadge'
import { StatusPill } from '../../ui/components/StatusPill'
import { Badge } from '../../ui/components/Badge'
import { Field } from '../../ui/components/Field'
import { Select } from '../../ui/components/Select'
import { DataTable } from '../../ui/components/DataTable'
import { ToastContainer } from '../../ui/components/Toast'
import { Dialog } from '../../ui/components/Dialog'

interface DemoToast {
  id: string
  message: string
  variant: 'success' | 'error' | 'warning' | 'info'
}

const TABLE_ROWS = [
  { id: 'CLT-001', name: 'Alice Chen', tier: 'LOW' as const, branch: 'Mayfair' },
  { id: 'CLT-005', name: "Marcus O'Brien", tier: 'HIGH' as const, branch: 'Edinburgh' },
  { id: 'CLT-012', name: 'Sarah Müller', tier: 'MEDIUM' as const, branch: 'Manchester' },
]

export const DesignSystemDemo: FC = () => {
  const [toasts, setToasts] = useState<DemoToast[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [fieldValue, setFieldValue] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()

  const addToast = (variant: DemoToast['variant']) => {
    const id = `toast-${Date.now()}`
    setToasts((prev) => [
      ...prev,
      { id, message: `${variant.charAt(0).toUpperCase() + variant.slice(1)} notification example`, variant },
    ])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const validateField = (value: string) => {
    setFieldValue(value)
    setFieldError(value.length > 0 && value.length < 3 ? 'Minimum 3 characters required' : undefined)
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold text-text mb-1">Design System</h1>
        <p className="text-sm text-neutral">SENTINEL UI primitives — Halcyon brand tokens</p>
      </header>

      <section aria-labelledby="colors-heading">
        <h2 id="colors-heading" className="text-lg font-semibold text-text mb-4">Colour Tokens</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {[
            { name: 'Primary', bg: 'bg-primary', text: 'text-white', hex: '#1B2A4A' },
            { name: 'Primary Light', bg: 'bg-primary-light', text: 'text-white', hex: '#3D5A80' },
            { name: 'Success', bg: 'bg-success', text: 'text-white', hex: '#2D6A4F' },
            { name: 'Warning', bg: 'bg-warning', text: 'text-text', hex: '#E09F3E' },
            { name: 'Error', bg: 'bg-error', text: 'text-white', hex: '#9B2226' },
            { name: 'Neutral', bg: 'bg-neutral', text: 'text-white', hex: '#6B7280' },
            { name: 'Background', bg: 'bg-background border border-neutral/20', text: 'text-text', hex: '#F8F9FA' },
            { name: 'Card', bg: 'bg-card border border-neutral/20', text: 'text-text', hex: '#FFFFFF' },
            { name: 'Text', bg: 'bg-text', text: 'text-white', hex: '#1F2937' },
          ].map(({ name, bg, text, hex }) => (
            <div key={name} className={`rounded-card p-3 ${bg}`}>
              <p className={`text-xs font-semibold ${text}`}>{name}</p>
              <p className={`text-xs font-mono opacity-80 ${text}`}>{hex}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="typography-heading">
        <h2 id="typography-heading" className="text-lg font-semibold text-text mb-4">Typography</h2>
        <Card>
          <div className="space-y-3">
            <p className="text-2xl font-semibold text-text">Heading 2XL — 24px/600</p>
            <p className="text-xl font-semibold text-text">Heading XL — 20px/600</p>
            <p className="text-lg font-semibold text-text">Heading LG — 18px/600</p>
            <p className="text-base text-text">Body — 16px/400 — Inter, system-ui</p>
            <p className="text-sm text-text">Small — 14px/400</p>
            <p className="text-xs text-neutral">Caption — 12px/400 — Neutral</p>
            <p className="text-xs font-mono text-neutral">Mono — CLT-005 / 0x1B2A4A</p>
          </div>
        </Card>
      </section>

      <section aria-labelledby="buttons-heading">
        <h2 id="buttons-heading" className="text-lg font-semibold text-text mb-4">Buttons</h2>
        <Card>
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="primary" isLoading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </Card>
      </section>

      <section aria-labelledby="badges-heading">
        <h2 id="badges-heading" className="text-lg font-semibold text-text mb-4">Badges &amp; Pills</h2>
        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-neutral mb-2 font-medium uppercase tracking-wide">Risk Badges</p>
              <div className="flex flex-wrap gap-2">
                <RiskBadge tier="LOW" />
                <RiskBadge tier="MEDIUM" />
                <RiskBadge tier="HIGH" />
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral mb-2 font-medium uppercase tracking-wide">Status Pills</p>
              <div className="flex flex-wrap gap-2">
                <StatusPill variant="success">Approved</StatusPill>
                <StatusPill variant="warning">Pending Review</StatusPill>
                <StatusPill variant="error">Rejected</StatusPill>
                <StatusPill variant="neutral">Inactive</StatusPill>
                <StatusPill variant="info">In Progress</StatusPill>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral mb-2 font-medium uppercase tracking-wide">Badges (counts)</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="error">14 critical</Badge>
                <Badge variant="warning">3 warnings</Badge>
                <Badge variant="info">46 total</Badge>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section aria-labelledby="form-heading">
        <h2 id="form-heading" className="text-lg font-semibold text-text mb-4">Form Elements</h2>
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Client Name"
              placeholder="e.g. Alice Chen"
              value={fieldValue}
              onChange={(event) => validateField(event.target.value)}
              error={fieldError}
              hint="Full legal name as per KYC documents"
            />
            <Field
              label="Annual Income"
              type="number"
              placeholder="e.g. 500000"
            />
            <Field
              label="Required Field"
              required
              placeholder="This field is required"
            />
            <Field
              label="Disabled Field"
              disabled
              value="Read-only value"
              onChange={() => undefined}
            />
            <Select
              label="Risk Tier"
              options={[
                { value: '', label: 'Select tier…' },
                { value: 'LOW', label: 'LOW' },
                { value: 'MEDIUM', label: 'MEDIUM' },
                { value: 'HIGH', label: 'HIGH' },
              ]}
            />
            <Select
              label="Branch (with error)"
              options={[
                { value: '', label: 'Select branch…' },
                { value: 'mayfair', label: 'Mayfair' },
              ]}
              error="Please select a branch"
            />
          </div>
        </Card>
      </section>

      <section aria-labelledby="table-heading">
        <h2 id="table-heading" className="text-lg font-semibold text-text mb-4">Data Table</h2>
        <DataTable
          ariaLabel="Demo client table"
          caption="Example client records with risk classifications"
          rows={TABLE_ROWS}
          getRowKey={(row) => row.id}
          columns={[
            {
              key: 'id',
              header: 'Client ID',
              render: (row) => <span className="font-mono text-xs text-neutral">{row.id}</span>,
            },
            {
              key: 'name',
              header: 'Name',
              render: (row) => <span className="font-medium text-text">{row.name}</span>,
            },
            {
              key: 'tier',
              header: 'Risk Tier',
              render: (row) => <RiskBadge tier={row.tier} />,
            },
            {
              key: 'branch',
              header: 'Branch',
              render: (row) => <span className="text-neutral">{row.branch}</span>,
            },
          ]}
        />
      </section>

      <section aria-labelledby="toast-heading">
        <h2 id="toast-heading" className="text-lg font-semibold text-text mb-4">Toasts</h2>
        <Card>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="secondary" onClick={() => addToast('success')}>Success toast</Button>
            <Button variant="secondary" onClick={() => addToast('error')}>Error toast</Button>
            <Button variant="secondary" onClick={() => addToast('warning')}>Warning toast</Button>
            <Button variant="secondary" onClick={() => addToast('info')}>Info toast</Button>
          </div>
          <p className="text-xs text-neutral">Toasts appear bottom-right and auto-dismiss after 4s.</p>
        </Card>
      </section>

      <section aria-labelledby="dialog-heading">
        <h2 id="dialog-heading" className="text-lg font-semibold text-text mb-4">Dialog</h2>
        <Card>
          <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>
            Open Dialog
          </Button>
        </Card>
      </section>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Dialog
        isOpen={isDialogOpen}
        title="Example Dialog"
        onClose={() => setIsDialogOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-text">
            This dialog demonstrates focus-trap, keyboard dismiss (Esc), and correct ARIA labelling.
          </p>
          <p className="text-sm text-neutral">
            Focus is restored to the trigger button when the dialog closes.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsDialogOpen(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
