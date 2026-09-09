import {
  Type,
  Barcode,
  QrCode,
  Heading,
  Image as ImageIcon,
  Minus,
  Shapes,
  Frame,
  Layers,
  ChevronUp,
  ChevronDown,
  Trash2,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function ComponentsSidebar() {
  const labelType = useLabelStore((s) => s.labelType)
  const addTextField = useLabelStore((s) => s.addTextField)
  const addBarcodeField = useLabelStore((s) => s.addBarcodeField)
  const addQrField = useLabelStore((s) => s.addQrField)
  const addHeaderField = useLabelStore((s) => s.addHeaderField)
  const addImageField = useLabelStore((s) => s.addImageField)
  const addLineField = useLabelStore((s) => s.addLineField)
  const addDxfField = useLabelStore((s) => s.addDxfField)
  const setModal = useLabelStore((s) => s.setModal)

  const fields = useLabelStore((s) => s.fields)
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const select = useLabelStore((s) => s.select)
  const reorderField = useLabelStore((s) => s.reorderField)
  const deleteField = useLabelStore((s) => s.deleteField)

  const isOffcut = labelType === 'offcut'
  const badgeLabel = `${(labelType || 'production').toUpperCase()}`
  const badgeClass = isOffcut ? 'bg-[#7c3aed]' : 'bg-[#2563eb]'

  const componentButtons = [
    { label: 'Add Text Field', icon: Type, onClick: addTextField },
    { label: 'Add Barcode', icon: Barcode, onClick: addBarcodeField },
    { label: 'Add QR Code', icon: QrCode, onClick: addQrField },
    { label: 'Add Header', icon: Heading, onClick: addHeaderField },
    { label: 'Add Logo/Image', icon: ImageIcon, onClick: addImageField },
    { label: 'Add Line', icon: Minus, onClick: addLineField },
    { label: 'Add Custom Shape…', icon: Shapes, onClick: () => setModal('showAddShapeModal', true) },
    { label: 'Add DXF Viewport', icon: Frame, onClick: addDxfField },
  ]

  const sortedFields = [...fields].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--lc-panel-border)] bg-[var(--lc-panel)]">
      {/* Header with Type Pill matching Screenshot 2 */}
      <div className="flex items-center justify-between border-b border-[var(--lc-panel-border)] px-4 py-3">
        <span className="text-sm font-bold text-[var(--lc-text)]">Components</span>
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wider text-white ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>

      {/* Component Buttons list */}
      <div className="flex flex-col gap-2 p-3 overflow-y-auto">
        <span className="text-[11px] font-semibold text-[var(--lc-text-muted)]">
          Add Component
        </span>

        {componentButtons.map((btn) => {
          const Icon = btn.icon
          return (
            <button
              key={btn.label}
              type="button"
              onClick={btn.onClick}
              className="flex items-center gap-2.5 rounded-md border border-blue-200 bg-white/70 px-3 py-2 text-left text-xs font-medium text-blue-600 shadow-sm transition-all hover:bg-blue-50/80 hover:border-blue-300 dark:border-blue-900/60 dark:bg-slate-900/40 dark:text-blue-400 dark:hover:bg-blue-950/40"
            >
              <Icon size={15} className="shrink-0" />
              <span>{btn.label}</span>
            </button>
          )
        })}
      </div>

      {/* Layers Tree at bottom */}
      <div className="mt-auto flex flex-col border-t border-[var(--lc-panel-border)] p-3">
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-[var(--lc-text-muted)]">
          <span className="flex items-center gap-1.5">
            <Layers size={13} />
            Layers ({fields.length})
          </span>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
          {sortedFields.length === 0 ? (
            <p className="py-2 text-center text-xs text-[var(--lc-text-muted)]">
              No elements added yet.
            </p>
          ) : (
            sortedFields.map((f) => {
              const isSelected = selectedKeys.includes(f.fieldKey)
              return (
                <div
                  key={f.fieldKey}
                  onClick={() => select([f.fieldKey])}
                  className={`flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-950/50 dark:text-blue-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--lc-text)]'
                  }`}
                >
                  <span className="truncate max-w-[130px]">
                    {f.label || f.fieldKey}
                  </span>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      title="Move up"
                      onClick={(e) => {
                        e.stopPropagation()
                        reorderField(f.fieldKey, 'up')
                      }}
                      className="p-0.5 text-[var(--lc-text-muted)] hover:text-[var(--lc-text)]"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      title="Move down"
                      onClick={(e) => {
                        e.stopPropagation()
                        reorderField(f.fieldKey, 'down')
                      }}
                      className="p-0.5 text-[var(--lc-text-muted)] hover:text-[var(--lc-text)]"
                    >
                      <ChevronDown size={12} />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteField(f.fieldKey)
                      }}
                      className="p-0.5 text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </aside>
  )
}
