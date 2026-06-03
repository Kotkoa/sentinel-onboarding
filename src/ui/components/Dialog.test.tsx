import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog } from './Dialog'
import { axe } from '../../test/setup'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
})

describe('Dialog', () => {
  it('renders title when open', () => {
    render(
      <Dialog isOpen title="Test Dialog" onClose={vi.fn()}>
        <p>Content</p>
      </Dialog>,
    )
    expect(screen.getByRole('heading', { name: 'Test Dialog' })).toBeInTheDocument()
  })

  it('renders children content', () => {
    render(
      <Dialog isOpen title="Test Dialog" onClose={vi.fn()}>
        <p>Dialog body content</p>
      </Dialog>,
    )
    expect(screen.getByText('Dialog body content')).toBeInTheDocument()
  })

  it('has correct dialog ARIA role', () => {
    render(
      <Dialog isOpen title="Test Dialog" onClose={vi.fn()}>
        <p>Content</p>
      </Dialog>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('is labelled by title element', () => {
    render(
      <Dialog isOpen title="Accessible Dialog" onClose={vi.fn()}>
        <p>Content</p>
      </Dialog>,
    )
    const dialog = screen.getByRole('dialog')
    const titleId = dialog.getAttribute('aria-labelledby')
    expect(titleId).toBeTruthy()
    expect(screen.getByText('Accessible Dialog').id).toBe(titleId)
  })

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn()
    render(
      <Dialog isOpen title="Test Dialog" onClose={handleClose}>
        <p>Content</p>
      </Dialog>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('close button has accessible label', () => {
    render(
      <Dialog isOpen title="Test" onClose={vi.fn()}>
        <p>Content</p>
      </Dialog>,
    )
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument()
  })

  it('has no a11y violations when open', async () => {
    const { container } = render(
      <Dialog isOpen title="Accessible Dialog" onClose={vi.fn()}>
        <p>Content goes here</p>
      </Dialog>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('Dialog — focus management', () => {
  it('restores focus to trigger element after dialog closes', async () => {
    const handleClose = vi.fn()

    const { rerender } = render(
      <>
        <button id="trigger">Open</button>
        <Dialog isOpen={false} title="Test" onClose={handleClose}>
          <button>Inner button</button>
        </Dialog>
      </>,
    )

    const trigger = document.getElementById('trigger') as HTMLButtonElement
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    rerender(
      <>
        <button id="trigger">Open</button>
        <Dialog isOpen title="Test" onClose={handleClose}>
          <button>Inner button</button>
        </Dialog>
      </>,
    )

    rerender(
      <>
        <button id="trigger">Open</button>
        <Dialog isOpen={false} title="Test" onClose={handleClose}>
          <button>Inner button</button>
        </Dialog>
      </>,
    )

    expect(document.activeElement).toBe(trigger)
  })

  it('Esc dispatches cancel event and onClose is called', async () => {
    const handleClose = vi.fn()
    render(
      <Dialog isOpen title="Test" onClose={handleClose}>
        <p>Content</p>
      </Dialog>,
    )

    const dialog = screen.getByRole('dialog') as HTMLDialogElement
    await act(async () => {
      dialog.dispatchEvent(new Event('cancel', { bubbles: true, cancelable: true }))
    })

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('close button meets 44px touch target requirement', () => {
    render(
      <Dialog isOpen title="Test" onClose={vi.fn()}>
        <p>Content</p>
      </Dialog>,
    )
    const closeButton = screen.getByRole('button', { name: 'Close dialog' })
    expect(closeButton).toHaveClass('min-h-11')
    expect(closeButton).toHaveClass('min-w-11')
  })
})
