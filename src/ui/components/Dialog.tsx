import { type FC, type ReactNode, useEffect, useRef, useId } from 'react'

interface DialogProps {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export const Dialog: FC<DialogProps> = ({ isOpen, title, onClose, children }) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previousFocusRef = useRef<Element | null>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      previousFocusRef.current = document.activeElement
      dialog.showModal()
    } else {
      dialog.close()
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="rounded-card shadow-card bg-card p-0 max-w-lg w-full backdrop:bg-black/40 open:flex open:flex-col"
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral/20">
        <h2 id={titleId} className="text-base font-semibold text-text">
          {title}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-neutral hover:text-text hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4 overflow-y-auto">{children}</div>
    </dialog>
  )
}
