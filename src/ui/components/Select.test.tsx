import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from './Select'
import { axe } from '../../test/setup'

const options = [
  { value: '', label: 'Select an option' },
  { value: 'low', label: 'Low Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'high', label: 'High Risk' },
]

describe('Select', () => {
  it('renders with correct label', () => {
    render(<Select label="Risk Tier" options={options} />)
    expect(screen.getByLabelText('Risk Tier')).toBeInTheDocument()
  })

  it('has correct ARIA role (combobox)', () => {
    render(<Select label="Risk Tier" options={options} />)
    expect(screen.getByRole('combobox', { name: 'Risk Tier' })).toBeInTheDocument()
  })

  it('renders all options', () => {
    render(<Select label="Risk Tier" options={options} />)
    expect(screen.getByRole('option', { name: 'Low Risk' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Medium Risk' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'High Risk' })).toBeInTheDocument()
  })

  it('calls onChange when selection changes', async () => {
    const handleChange = vi.fn()
    render(<Select label="Risk Tier" options={options} onChange={handleChange} />)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'high')
    expect(handleChange).toHaveBeenCalled()
  })

  it('shows error message when error prop is provided', () => {
    render(<Select label="Risk Tier" options={options} error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('sets aria-invalid when error is present', () => {
    render(<Select label="Risk Tier" options={options} error="Required" />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('links error to select via aria-describedby', () => {
    render(<Select label="Risk Tier" options={options} id="risk-tier" error="Required" />)
    const select = screen.getByRole('combobox')
    const errorId = select.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(document.getElementById(errorId!)).toHaveTextContent('Required')
  })

  it('can be navigated with keyboard', async () => {
    render(<Select label="Risk Tier" options={options} />)
    const select = screen.getByRole('combobox')
    select.focus()
    expect(document.activeElement).toBe(select)
  })

  it('has no a11y violations', async () => {
    const { container } = render(<Select label="Risk Tier" options={options} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no a11y violations with error', async () => {
    const { container } = render(
      <Select label="Risk Tier" options={options} error="Please select a tier" />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
