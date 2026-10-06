import { useState } from 'react'
import {
  Type,
  Heading,
  Square,
  Barcode,
  QrCode,
  SquareCheck,
  Minus,
  Shapes,
  Image as ImageIcon,
  Frame,
  Search,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Database,
  ChevronsDownUp,
  CircleSlash,
  FileCode,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { catalogForClient } from '../data/fieldCatalog'
import { mappingLabel } from '../utils/template'
import { elementIcon } from '../elements/typeMeta'

export default function ComponentsSidebar() {
  const [fieldSearch, setFieldSearch] = useState('')
  const [layersOpen, setLayersOpen] = useState(true)
  const client = useLabelStore((s) => s.client)
  const fields = useLabelStore((s) => s.fields)
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const realDataInfo = useLabelStore((s) => s.realDataInfo)
  const labelData = useLabelStore((s) => s.labelData)
  const select = useLabelStore((s) => s.select)
  const toggleFieldVisible = useLabelStore((s) => s.toggleFieldVisible)
  const toggleFieldLock = useLabelStore((s) => s.toggleFieldLock)
  const addTextField = useLabelStore((s) => s.addTextField)
  const addHeaderField = useLabelStore((s) => s.addHeaderField)
  const addBlackBoxField = useLabelStore((s) => s.addBlackBoxField)
  const addBarcodeField = useLabelStore((s) => s.addBarcodeField)
  const addQrField = useLabelStore((s) => s.addQrField)
  const addCheckboxField = useLabelStore((s) => s.addCheckboxField)
  const addLineField = useLabelStore((s) => s.addLineField)
  const addRoundedRectField = useLabelStore((s) => s.addRoundedRectField)
  const addImageField = useLabelStore((s) => s.addImageField)
  const addDxfField = useLabelStore((s) => s.addDxfField)
  const addBoundField = useLabelStore((s) => s.addBoundField)

  // 6. Ten tools in a grid (Table removed — spec §12)
  const tools = [
    { label: 'Text', Icon: Type, onClick: addTextField },
    { label: 'Header', Icon: Heading, onClick: addHeaderField },
    { label: 'Black box', Icon: Square, onClick: addBlackBoxField },
    { label: 'Barcode', Icon: Barcode, onClick: addBarcodeField },
    { label: 'QR', Icon: QrCode, onClick: addQrField },
    { label: 'Checkbox', Icon: SquareCheck, onClick: addCheckboxField },
    { label: 'Line', Icon: Minus, onClick: addLineField },
    { label: 'Shape', Icon: Shapes, onClick: addRoundedRectField },
    { label: 'Image', Icon: ImageIcon, onClick: addImageField },
    { label: 'DXF', Icon: Frame, onClick: addDxfField },
  ]

  const baseCatalog = catalogForClient(client)

  // Opti fields only come when real OIF data is imported. Unless OIF is imported, Opti field section stays empty.
  const catalog = (() => {
    if (client === 'opti') {
      if (!realDataInfo || !labelData || Object.keys(labelData).length === 0) {
        return []
      }
      const existingKeys = new Set()
      const dynamicFields = []

      // Check for note slots in loaded labelData
      for (let n = 1; n <= 10; n++) {
        const noteObj = labelData[`note${n}`] || labelData[`Note${n}`]
        if (noteObj && typeof noteObj === 'object') {
          for (const [fk, fv] of Object.entries(noteObj)) {
            if (fv != null && String(fv).trim() !== '') {
              const num = fk.replace(/\D/g, '')
              const slotKey = `note${n}.field${num}`
              if (!existingKeys.has(slotKey.toLowerCase())) {
                existingKeys.add(slotKey.toLowerCase())
                dynamicFields.push({
                  key: slotKey,
                  label: `Note ${n} Field ${num}`,
                  type: 'text',
                  source: 'notes',
                  sample: String(fv),
                })
              }
            }
          }
        }
      }

      // Check piece scalar fields
      for (const [k, v] of Object.entries(labelData)) {
        if (k.startsWith('note') || typeof v === 'object' || v == null) continue
        if (!existingKeys.has(k.toLowerCase()) && String(v).trim() !== '') {
          existingKeys.add(k.toLowerCase())
          dynamicFields.push({
            key: k,
            label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim(),
            type: 'text',
            source: 'piece',
            sample: String(v),
          })
        }
      }

      return dynamicFields
    }

    // For ERP:
    if (!realDataInfo || !labelData || Object.keys(labelData).length === 0) {
      return baseCatalog
    }
    const existingKeys = new Set(baseCatalog.map((c) => c.key.toLowerCase()))
    const dynamicFields = []
    for (const [k, v] of Object.entries(labelData)) {
      if (typeof v === 'object' || v == null) continue
      if (!existingKeys.has(k.toLowerCase()) && String(v).trim() !== '') {
        existingKeys.add(k.toLowerCase())
        dynamicFields.push({
          key: k,
          label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim(),
          type: 'text',
          source: 'piece',
          sample: String(v),
        })
      }
    }
    return dynamicFields.length ? [...baseCatalog, ...dynamicFields] : baseCatalog
  })()

  const q = fieldSearch.trim().toLowerCase()
  const filteredCatalog = catalog.filter(
    (f) =>
      !q ||
      (f.label || f.key).toLowerCase().includes(q) ||
      f.key.toLowerCase().includes(q) ||
      (f.sample && f.sample.toLowerCase().includes(q)),
  )

  const sortedFields = [...fields].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))

  return (
    <aside className="lc-sidebar-left flex h-full w-[280px] shrink-0 flex-col border-r border-[var(--line)] text-[var(--tx)] select-none">
      {/* 6. ADD ELEMENT — ten tools */}
      <section className="border-b border-[var(--line)] p-3">
        <h2 className="lc-panel-title mb-2.5">Add element</h2>
        <div className="grid grid-cols-4 gap-2">
          {tools.map(({ label, Icon, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="lc-tool-btn"
              title={`Add ${label}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 7. Fields panel — searchable, drag onto the label */}
      <section className="flex max-h-[54%] min-h-[180px] flex-col border-b border-[var(--line)]">
        <div className="px-3 pb-2 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="lc-panel-title">{client === 'erp' ? 'ERP fields' : 'Opti fields'}</h2>
            {catalog.length > 0 && (
              <span className="text-[11px] font-semibold text-[var(--pri)]">drag to canvas</span>
            )}
          </div>
          {catalog.length > 0 && (
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--mut)]" />
              <input
                type="search"
                placeholder={`Search ${catalog.length} fields…`}
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                className="lc-input !h-[34px] !pl-8"
              />
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {catalog.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-3 py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--panel-2)] text-[var(--mut)] mb-2.5">
                <FileCode size={20} />
              </div>
              <p className="text-[12.5px] font-medium text-[var(--tx)] mb-1">
                No Opti fields loaded
              </p>
              <p className="text-[11.5px] leading-relaxed text-[var(--mut)] mb-3">
                Import an .OIF file to automatically extract and populate piece and note fields.
              </p>
              <button
                type="button"
                onClick={() => useLabelStore.getState().setModal('showOifImportModal', true)}
                className="lc-btn lc-btn-primary lc-btn-sm"
              >
                <FolderOpen size={13} />
                <span>Import OIF file</span>
              </button>
            </div>
          ) : filteredCatalog.length === 0 ? (
            <p className="px-2 py-6 text-center text-[13px] text-[var(--mut)]">
              No field matches “{fieldSearch}”.
            </p>
          ) : null}

          {filteredCatalog.map((field) => {
            const isNote = field.source === 'notes' || field.key.toLowerCase().includes('note')
            return (
              <button
                key={field.key}
                type="button"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify(field))}
                onClick={() => addBoundField(field)}
                className="lc-field-row"
                title={`Drag onto the label, or click to add ${field.label || field.key}`}
              >
                <Database size={15} className="flex-none text-[var(--mut)]" />
                <span className="min-w-0 flex-1">
                  <span className="lc-field-name block truncate">{field.label || field.key}</span>
                  <span className="lc-field-key block truncate">{field.key}</span>
                </span>
                <span className={`lc-badge flex-none ${isNote ? 'lc-badge-warn' : 'lc-badge-opti'}`}>
                  {isNote ? 'Note' : 'Piece'}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 8. Layers — every element with visibility, lock and mapping chip */}
      <section className="flex min-h-[160px] flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2.5">
          <h2 className="lc-panel-title">Layers · {fields.length}</h2>
          <button
            type="button"
            className="lc-icon-btn !h-6 !w-6"
            onClick={() => setLayersOpen((v) => !v)}
            title={layersOpen ? 'Collapse layers' : 'Expand layers'}
          >
            {layersOpen ? <ChevronsDownUp size={14} /> : <ChevronsDownUp size={14} className="rotate-180" />}
          </button>
        </div>

        {layersOpen && (
          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {sortedFields.length === 0 && (
              <p className="px-2 py-6 text-center text-[13px] text-[var(--mut)]">
                Nothing on the label yet.
              </p>
            )}
            {sortedFields.map((f) => {
              const isSelected = selectedKeys.includes(f.fieldKey)
              const Icon = elementIcon(f)
              const chip = mappingLabel(f)
              return (
                <div
                  key={f.fieldKey}
                  role="button"
                  tabIndex={0}
                  onClick={() => select([f.fieldKey])}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      select([f.fieldKey])
                    }
                  }}
                  className={`lc-layer-row ${isSelected ? 'selected' : ''}`}
                >
                  <Icon size={15} className="lc-layer-type" />
                  <span className="lc-layer-name">{f.label || f.fieldKey}</span>
                  {chip && <span className="lc-key-chip flex-none">{chip}</span>}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFieldVisible(f.fieldKey)
                    }}
                    className="lc-icon-btn !h-6 !w-6"
                    title={f.hidden ? 'Show on label' : 'Hide from label'}
                  >
                    {f.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFieldLock(f.fieldKey)
                    }}
                    className="lc-icon-btn !h-6 !w-6"
                    title={f.locked ? 'Unlock' : 'Lock position'}
                  >
                    {f.locked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {!layersOpen && (
          <p className="px-3 py-2 text-[12px] text-[var(--mut)]">
            <CircleSlash size={12} className="mr-1 inline" />
            Layers collapsed
          </p>
        )}
      </section>
    </aside>
  )
}
