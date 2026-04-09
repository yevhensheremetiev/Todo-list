import { useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAutofocusOnOpen } from '../hooks/useAutofocusOnOpen.ts'
import { useEscapeKey } from '../hooks/useEscapeKey.ts'

type Props = {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger,
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId()
  const descId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useAutofocusOnOpen(cancelRef, open)
  useEscapeKey(onCancel, open)

  if (!open) return null

  return createPortal(
    <div
      className="modalOverlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <div className="modal__title" id={titleId}>
            {title}
          </div>
          {description ? (
            <div className="modal__desc" id={descId}>
              {description}
            </div>
          ) : null}
        </div>
        <div className="modal__actions">
          <button ref={cancelRef} type="button" className="btn btn--subtle" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={['btn', danger ? 'btn--danger' : ''].filter(Boolean).join(' ')}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

