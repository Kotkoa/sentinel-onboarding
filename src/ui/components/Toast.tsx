import { type FC, useEffect } from 'react'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  variant?: ToastVariant
  onDismiss: () => void
  durationMs?: number
}

const variantClasses: Record<ToastVariant, string> = {
  success: 'bg-success text-white border-success',
  error: 'bg-error text-white border-error',
  warning: 'bg-card text-text border-warning',
  info: 'bg-primary text-white border-primary',
}

const icons: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

export const Toast: FC<ToastProps> = ({
  message,
  variant = 'info',
  onDismiss,
  durationMs = 4000,
}) => {
  useEffect(() => {
    if (durationMs <= 0) return
    const timer = setTimeout(onDismiss, durationMs)
    return () => clearTimeout(timer)
  }, [durationMs, onDismiss])

  const isError = variant === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-card shadow-card border',
        'min-w-[280px] max-w-sm',
        variantClasses[variant],
      ].join(' ')}
    >
      <span aria-hidden="true" className="text-base leading-none mt-0.5 shrink-0">
        {icons[variant]}
      </span>
      <p className="flex-1 text-sm">{message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 min-h-11 min-w-11 flex items-center justify-center rounded opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current transition-opacity"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
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
  )
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; variant?: ToastVariant }>
  onDismiss: (id: string) => void
}

export const ToastContainer: FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  )
}
