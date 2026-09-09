import { Undo2, Check, X, Redo2 } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function BottomFooter() {
  const undo = useLabelStore((s) => s.undo)
  const redo = useLabelStore((s) => s.redo)
  const canUndo = useLabelStore((s) => s.canUndo())
  const canRedo = useLabelStore((s) => s.canRedo())
  const exportTemplate = useLabelStore((s) => s.exportTemplate)
  const name = useLabelStore((s) => s.name)
  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)

  const handleSave = () => {
    const json = exportTemplate()
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${json.id || 'label'}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <footer
      className="flex h-[52px] shrink-0 items-center justify-between border-t border-[var(--lc-panel-border)] bg-[var(--lc-toolbar-bg)] px-5 backdrop-blur-md"
      style={{ boxShadow: '0 -1px 0 var(--lc-panel-border)' }}
    >
      {/* Status */}
      <p className="text-[11px] font-medium text-[var(--lc-text-muted)]">
        <span className="font-semibold text-[var(--lc-text)]">{name}</span>
        {' · '}
        {width} × {height} mm
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={undo} disabled={!canUndo} className="lc-btn lc-btn-outline !text-xs">
          <Undo2 size={14} />
          Undo
        </button>
        <button type="button" onClick={redo} disabled={!canRedo} className="lc-btn lc-btn-ghost !text-xs">
          <Redo2 size={14} />
          Redo
        </button>
        <div className="mx-1 h-5 w-px bg-[var(--lc-panel-border)]" />
        <button type="button" onClick={handleSave} className="lc-btn lc-btn-primary !text-xs">
          <Check size={14} />
          Save Changes
        </button>
        <button
          type="button"
          onClick={() => { if (confirm('Discard unsaved changes?')) undo() }}
          className="lc-btn lc-btn-danger !text-xs"
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </footer>
  )
}
