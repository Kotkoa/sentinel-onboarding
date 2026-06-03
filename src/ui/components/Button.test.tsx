import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'
import { axe } from '../../test/setup'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('has minimum 44px touch target height', () => {
    const { container } = render(<Button>Action</Button>)
    const button = container.firstChild as HTMLElement
    expect(button.className).toContain('min-h-[44px]')
  })

  it('has minimum 44px touch target width', () => {
    const { container } = render(<Button>Action</Button>)
    const button = container.firstChild as HTMLElement
    expect(button.className).toContain('min-w-[44px]')
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('calls onClick when Enter key is pressed', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Press Enter</Button>)
    const button = screen.getByRole('button')
    button.focus()
    await userEvent.keyboard('{Enter}')
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('calls onClick when Space key is pressed', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Press Space</Button>)
    const button = screen.getByRole('button')
    button.focus()
    await userEvent.keyboard(' ')
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} disabled>Disabled</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('shows loading state', () => {
    render(<Button isLoading>Submit</Button>)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('is disabled when loading', () => {
    render(<Button isLoading>Submit</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no a11y violations when disabled', async () => {
    const { container } = render(<Button disabled>Disabled Button</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
