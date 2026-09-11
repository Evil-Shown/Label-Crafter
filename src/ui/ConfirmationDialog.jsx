import { AlertTriangle, X } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function ConfirmationDialog() {
  const dialog = useLabelStore((s) => s.confirmDialog)
  const dismiss = useLabelStore((s) => s.dismissConfirmation)

  if (!dialog) return null

  const confirm = () => {
    dialog.onConfirm?.()
    dismiss()
  }

  return (
    <div className="lc-modal-overlay !z-[90]" role="presentation">
      <div className="lc-modal lc-confirm-modal !max-w-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="flex items-start gap-3">
          <div className={`lc-confirm-icon ${dialog.tone === 'danger' ? 'is-danger' : ''}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-title" className="text-base font-bold text-[var(--lc-text)]">{dialog.title || 'Please confirm'}</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--lc-text-muted)]">{dialog.message}</p>
          </div>
          <button type="button" onClick={dismiss} className="lc-icon-btn !-mt-1 !-mr-1" aria-label="Close confirmation">
            <X size={15} />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={dismiss} className="lc-btn lc-btn-outline !text-xs">Keep editing</button>
          <button type="button" onClick={confirm} className={`lc-btn ${dialog.tone === 'danger' ? 'lc-btn-danger' : 'lc-btn-primary'} !text-xs`}>
            {dialog.confirmLabel || 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
