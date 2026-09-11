import { Undo2, Check, X, Redo2, Image, FileText } from 'lucide-react'
import { getTemplateFingerprint, useLabelStore } from '../store/labelStore'
import { exportPng, exportPdf } from '../utils/export'
import { formatSize } from '../utils/units'
import { toast } from './Toast'

export default function BottomFooter() {
  const undo = useLabelStore((s) => s.undo)
  const redo = useLabelStore((s) => s.redo)
  const canUndo = useLabelStore((s) => s._history.length > 0)
  const canRedo = useLabelStore((s) => s._future.length > 0)
  const saveToLibrary = useLabelStore((s) => s.saveToLibrary)
  const name = useLabelStore((s) => s.name)
  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)
  const unit = useLabelStore((s) => s.unit) || 'mm'
  const requestConfirmation = useLabelStore((s) => s.requestConfirmation)
  const discardUnsavedChanges = useLabelStore((s) => s.discardUnsavedChanges)
  const hasUnsavedChanges = useLabelStore((s) => getTemplateFingerprint(s) !== s._savedSnapshot)

  const handlePng = async () => {
    const state = useLabelStore.getState()
    const ok = await exportPng(state)
    toast(ok ? 'PNG exported' : 'PNG export failed', ok ? 'success' : 'error')
  }

  const handlePdf = async () => {
    const state = useLabelStore.getState()
    const ok = await exportPdf(state)
    toast(ok ? 'PDF print dialog opened' : 'PDF export blocked — allow popups', ok ? 'success' : 'error')
  }

  return (
    <footer
      className="lc-footer flex h-[58px] shrink-0 items-center justify-between border-t border-[var(--lc-panel-border)] bg-[var(--lc-toolbar-bg)] px-5 backdrop-blur-md"
      style={{ boxShadow: '0 -1px 0 var(--lc-panel-border)' }}
    >
      <p className="text-[11px] font-medium text-[var(--lc-text-muted)]">
        <span className="font-semibold text-[var(--lc-text)]">{name}</span>
        {' · '}
        {formatSize(width, height, unit)}
      </p>

      <div className="flex items-center gap-2">
        <button type="button" onClick={handlePng} className="lc-btn lc-btn-outline !text-xs" title="Export PNG">
          <Image size={14} /> PNG
        </button>
        <button type="button" onClick={handlePdf} className="lc-btn lc-btn-outline !text-xs" title="Export PDF">
          <FileText size={14} /> PDF
        </button>
        <div className="mx-1 h-5 w-px bg-[var(--lc-panel-border)]" />
        <button type="button" onClick={undo} disabled={!canUndo} className="lc-btn lc-btn-outline !text-xs">
          <Undo2 size={14} /> Undo
        </button>
        <button type="button" onClick={redo} disabled={!canRedo} className="lc-btn lc-btn-ghost !text-xs">
          <Redo2 size={14} /> Redo
        </button>
        <div className="mx-1 h-5 w-px bg-[var(--lc-panel-border)]" />
        {hasUnsavedChanges && (
          <>
            <button type="button" onClick={saveToLibrary} className="lc-btn lc-btn-primary !text-xs" title="Save this template to the library">
              <Check size={14} /> Save to Library
            </button>
            <button type="button" onClick={() => requestConfirmation({
              title: 'Discard unsaved changes?',
              message: 'Restore the template to its last saved library version.',
              confirmLabel: 'Discard changes',
              tone: 'danger',
              onConfirm: discardUnsavedChanges,
            })} className="lc-btn lc-btn-danger !text-xs">
              <X size={14} /> Discard
            </button>
          </>
        )}
      </div>
    </footer>
  )
}
