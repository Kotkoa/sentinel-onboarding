import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toast, ToastContainer } from './Toast'
import { axe } from '../../test/setup'

describe('Toast', () => {
  it('renders message text', () => {
    render(<Toast message="Operation successful" onDismiss={vi.fn()} />)
    expect(screen.getByText('Operation successful')).toBeInTheDocument()
  })

  it('has role="status" and aria-live="polite"', () => {
    render(<Toast message="Test" onDismiss={vi.fn()} />)
    const toast = screen.getByRole('status')
    expect(toast).toHaveAttribute('aria-live', 'polite')
  })

  it('dismiss button has accessible label', () => {
    render(<Toast message="Test" onDismiss={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button clicked', async () => {
    const handleDismiss = vi.fn()
    render(<Toast message="Test" onDismiss={handleDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    expect(handleDismiss).toHaveBeenCalledTimes(1)
  })

  it('auto-dismisses after durationMs', async () => {
    vi.useFakeTimers()
    const handleDismiss = vi.fn()
    render(<Toast message="Test" onDismiss={handleDismiss} durationMs={2000} />)
    vi.advanceTimersByTime(2000)
    expect(handleDismiss).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('does not auto-dismiss when durationMs is 0', async () => {
    vi.useFakeTimers()
    const handleDismiss = vi.fn()
    render(<Toast message="Test" onDismiss={handleDismiss} durationMs={0} />)
    vi.advanceTimersByTime(10000)
    expect(handleDismiss).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('has no a11y violations for each variant', async () => {
    const variants = ['success', 'error', 'warning', 'info'] as const
    for (const variant of variants) {
      const { container } = render(
        <Toast message="Notification" variant={variant} onDismiss={vi.fn()} />,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    }
  })
})

describe('ToastContainer', () => {
  it('renders nothing when toasts array is empty', () => {
    const { container } = render(<ToastContainer toasts={[]} onDismiss={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all toasts', () => {
    const toasts = [
      { id: 't1', message: 'First toast', variant: 'success' as const },
      { id: 't2', message: 'Second toast', variant: 'error' as const },
    ]
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />)
    expect(screen.getByText('First toast')).toBeInTheDocument()
    expect(screen.getByText('Second toast')).toBeInTheDocument()
  })

  it('calls onDismiss with correct id', async () => {
    const handleDismiss = vi.fn()
    const toasts = [{ id: 'toast-abc', message: 'Dismissable', variant: 'info' as const }]
    render(<ToastContainer toasts={toasts} onDismiss={handleDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    expect(handleDismiss).toHaveBeenCalledWith('toast-abc')
  })

  it('has no a11y violations', async () => {
    const toasts = [
      { id: 't1', message: 'Success', variant: 'success' as const },
      { id: 't2', message: 'Warning', variant: 'warning' as const },
    ]
    const { container } = render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
