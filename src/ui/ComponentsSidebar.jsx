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
  GripVertical,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { PanelHeader, SectionLabel } from './primitives'

const TYPE_ICONS = {
  text: Type,
  barcode: Barcode,
  qrcode: QrCode,
  line: Minus,
  shape: Shapes,
  image: ImageIcon,
}

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

  const tools = [
    { label: 'Text', icon: Type, onClick: addTextField },
    { label: 'Barcode', icon: Barcode, onClick: addBarcodeField },
    { label: 'QR Code', icon: QrCode, onClick: addQrField },
    { label: 'Header', icon: Heading, onClick: addHeaderField },
    { label: 'Image', icon: ImageIcon, onClick: addImageField },
    { label: 'Line', icon: Minus, onClick: addLineField },
    { label: 'Shape', icon: Shapes, onClick: () => setModal('showAddShapeModal', true) },
    { label: 'DXF', icon: Frame, onClick: addDxfField },
  ]

  const sortedFields = [...fields].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-[var(--lc-panel-border)] bg-[var(--lc-panel)]">
      <PanelHeader
        title="Components"
        badge={
          <span className={`lc-badge ${isOffcut ? 'lc-badge-offcut' : 'lc-badge-prod'}`}>
            {isOffcut ? 'Offcut' : 'Production'}
          </span>
        }
      />

      {/* 2-column tool grid */}
      <div className="p-3">
        <SectionLabel>Add element</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.label}
                type="button"
                onClick={tool.onClick}
                className="lc-tool-btn"
                title={`Add ${tool.label}`}
              >
                <Icon size={18} strokeWidth={1.75} />
                <span>{tool.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Layers */}
      <div className="mt-auto flex min-h-0 flex-col border-t border-[var(--lc-panel-border)]">
        <div className="flex items-center gap-1.5 px-3 py-2.5">
          <Layers size={13} className="text-[var(--lc-text-muted)]" />
          <SectionLabel>Layers · {fields.length}</SectionLabel>
        </div>
        <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3" style={{ maxHeight: '220px' }}>
          {sortedFields.length === 0 ? (
            <p className="px-2 py-4 text-center text-[11px] text-[var(--lc-text-muted)]">
              No elements yet
            </p>
          ) : (
            sortedFields.map((f) => {
              const isSelected = selectedKeys.includes(f.fieldKey)
              const LayerIcon = TYPE_ICONS[f.type] || GripVertical
              return (
                <div
                  key={f.fieldKey}
                  onClick={() => select([f.fieldKey])}
                  className={`lc-layer-row group ${isSelected ? 'selected' : ''}`}
                >
                  <LayerIcon size={12} className="shrink-0 opacity-60" />
                  <span className="min-w-0 flex-1 truncate">{f.label || f.fieldKey}</span>
                  <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); reorderField(f.fieldKey, 'up') }}
                      className="lc-icon-btn !h-5 !w-5"
                    >
                      <ChevronUp size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); reorderField(f.fieldKey, 'down') }}
                      className="lc-icon-btn !h-5 !w-5"
                    >
                      <ChevronDown size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteField(f.fieldKey) }}
                      className="lc-icon-btn !h-5 !w-5 hover:!text-red-500"
                    >
                      <Trash2 size={11} />
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
