import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Field } from './Field'
import { axe } from '../../test/setup'

describe('Field', () => {
  it('renders label associated with input', () => {
    render(<Field label="Client Name" />)
    expect(screen.getByLabelText('Client Name')).toBeInTheDocument()
  })

  it('has minimum 44px touch target', () => {
    const { container } = render(<Field label="Name" />)
    const input = container.querySelector('input') as HTMLElement
    expect(input.className).toContain('min-h-[44px]')
  })

  it('shows hint text', () => {
    render(<Field label="Name" hint="Enter full legal name" />)
    expect(screen.getByText('Enter full legal name')).toBeInTheDocument()
  })

  it('shows error message when error prop provided', () => {
    render(<Field label="Name" error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('sets aria-invalid when error is present', () => {
    render(<Field label="Name" error="Required" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('links error via aria-describedby', () => {
    render(<Field label="Name" id="client-name" error="Required" />)
    const input = screen.getByRole('textbox')
    const errorId = input.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(document.getElementById(errorId!)).toHaveTextContent('Required')
  })

  it('links hint via aria-describedby', () => {
    render(<Field label="Name" id="client-name-hint" hint="Full legal name" />)
    const input = screen.getByRole('textbox')
    const hintId = input.getAttribute('aria-describedby')
    expect(hintId).toBeTruthy()
    expect(document.getElementById(hintId!)).toHaveTextContent('Full legal name')
  })

  it('shows required asterisk when required', () => {
    const { container } = render(<Field label="Name" required />)
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('*')
  })

  it('calls onChange when value changes', async () => {
    const handleChange = vi.fn()
    render(<Field label="Name" onChange={handleChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'Alice')
    expect(handleChange).toHaveBeenCalled()
  })

  it('is keyboard accessible', async () => {
    render(<Field label="Name" />)
    const input = screen.getByRole('textbox')
    input.focus()
    expect(document.activeElement).toBe(input)
  })

  it('has no a11y violations', async () => {
    const { container } = render(<Field label="Client Name" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no a11y violations with error', async () => {
    const { container } = render(<Field label="Client Name" error="Required" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no a11y violations with hint', async () => {
    const { container } = render(<Field label="Client Name" hint="Hint text" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
