import { Trash2, MousePointer2, AlignLeft, Barcode, Shapes, Image, Table } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { PanelHeader, EmptyState, PropGroup, SectionLabel } from './primitives'
import TokenInput from './TokenInput'

const FONT_OPTIONS = ['Arial, sans-serif', 'Helvetica, sans-serif', 'Times New Roman, serif', 'Courier New, monospace', 'Verdana, sans-serif']
const BARCODE_FORMATS = ['CODE128', 'CODE39', 'EAN13', 'ITF14', 'UPC']
const QR_ECC = ['L', 'M', 'Q', 'H']

const TYPE_META = {
  text: { icon: AlignLeft, label: 'Text Field' },
  barcode: { icon: Barcode, label: 'Barcode' },
  qrcode: { icon: Barcode, label: 'QR Code' },
  line: { icon: Shapes, label: 'Line' },
  shape: { icon: Shapes, label: 'Shape' },
  image: { icon: Image, label: 'Image' },
  table: { icon: Table, label: 'Table' },
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1 block text-[11px] font-semibold text-[var(--lc-text-muted)]">
      {children}
    </label>
  )
}

export default function PropertiesPanel() {
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const fields = useLabelStore((s) => s.fields)
  const updateField = useLabelStore((s) => s.updateField)
  const deleteField = useLabelStore((s) => s.deleteField)
  const toggleFieldLock = useLabelStore((s) => s.toggleFieldLock)
  const toggleFieldVisible = useLabelStore((s) => s.toggleFieldVisible)

  const field = selectedKeys.length === 1
    ? fields.find((f) => f.fieldKey === selectedKeys[0])
    : null

  if (!field) {
    return (
      <aside className="flex w-[260px] shrink-0 flex-col border-l border-[var(--lc-panel-border)] bg-[var(--lc-panel)]">
        <PanelHeader title="Properties" />
        <EmptyState
          icon={MousePointer2}
          title="Nothing selected"
          subtitle="Click any element on the canvas to edit its position, size, and style."
        />
      </aside>
    )
  }

  const meta = TYPE_META[field.type] || TYPE_META.text
  const MetaIcon = meta.icon
  const isShape = field.type === 'shape'
  const isDxf = field.shapeType === 'dxf'
  const isText = field.type === 'text'
  const isTable = field.type === 'table'

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-l border-[var(--lc-panel-border)] bg-[var(--lc-panel)]">
      <PanelHeader
        title="Properties"
        badge={
          <span className="flex items-center gap-1 rounded-md bg-[var(--lc-accent-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--lc-accent)]">
            <MetaIcon size={10} />
            {isDxf ? 'DXF' : meta.label}
          </span>
        }
      />

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {/* Element name */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--lc-text)]">{field.label || field.fieldKey}</p>
            <p className="text-[10px] text-[var(--lc-text-muted)]">
              {field.type}{field.shapeType ? ` · ${field.shapeType}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => deleteField(field.fieldKey)}
            className="lc-icon-btn hover:!bg-red-50 hover:!text-red-500 dark:hover:!bg-red-950/30"
            title="Delete element"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Text */}
        {isText && (
          <PropGroup title="Content">
            <div>
              <FieldLabel>Text / token</FieldLabel>
              <TokenInput
                value={field.value || ''}
                onChange={(v) => updateField(field.fieldKey, { value: v })}
                multiline
                placeholder="{{orderNumber}}"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldLabel>Font size</FieldLabel>
                <input type="number" value={field.fontSize ?? 12} onChange={(e) => updateField(field.fieldKey, { fontSize: Number(e.target.value) })} className="lc-input w-full" />
              </div>
              <div>
                <FieldLabel>Weight</FieldLabel>
                <select value={field.fontWeight || 'normal'} onChange={(e) => updateField(field.fieldKey, { fontWeight: e.target.value })} className="lc-input w-full">
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
            </div>
            <div>
              <FieldLabel>Font family</FieldLabel>
              <select value={field.fontFamily || 'Arial, sans-serif'} onChange={(e) => updateField(field.fieldKey, { fontFamily: e.target.value })} className="lc-input w-full">
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f.split(',')[0]}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Text color</FieldLabel>
              <div className="flex items-center gap-2">
                <input type="color" value={field.color || '#000000'} onChange={(e) => updateField(field.fieldKey, { color: e.target.value })} className="h-8 w-10 rounded border border-[var(--lc-panel-border)]" />
                <input type="text" value={field.color || '#000000'} onChange={(e) => updateField(field.fieldKey, { color: e.target.value })} className="lc-input flex-1 font-mono text-xs" />
              </div>
            </div>
            <div>
              <FieldLabel>Align</FieldLabel>
              <select value={field.textAlign || 'left'} onChange={(e) => updateField(field.fieldKey, { textAlign: e.target.value })} className="lc-input w-full">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium">
              <input type="checkbox" checked={field.blackBox ?? false} onChange={(e) => updateField(field.fieldKey, { blackBox: e.target.checked, color: e.target.checked ? '#ffffff' : (field.color || '#000') })} className="rounded" />
              Black box (inverted text)
            </label>
          </PropGroup>
        )}

        {/* Barcode */}
        {field.type === 'barcode' && (
          <PropGroup title="Barcode">
            <div>
              <FieldLabel>Symbology</FieldLabel>
              <select value={field.barcodeFormat || 'CODE128'} onChange={(e) => updateField(field.fieldKey, { barcodeFormat: e.target.value })} className="lc-input w-full">
                {BARCODE_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Fallback value</FieldLabel>
              <input type="text" value={field.fallbackValue || ''} onChange={(e) => updateField(field.fieldKey, { fallbackValue: e.target.value })} className="lc-input w-full font-mono text-xs" />
            </div>
            <label className="flex items-center gap-2 text-xs font-medium">
              <input type="checkbox" checked={field.displayValue !== false} onChange={(e) => updateField(field.fieldKey, { displayValue: e.target.checked })} className="rounded" />
              Show human-readable text
            </label>
          </PropGroup>
        )}

        {field.type === 'qrcode' && (
          <PropGroup title="QR Code">
            <div>
              <FieldLabel>Error correction</FieldLabel>
              <select value={field.qrEcc || 'M'} onChange={(e) => updateField(field.fieldKey, { qrEcc: e.target.value })} className="lc-input w-full">
                {QR_ECC.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Fallback value</FieldLabel>
              <input type="text" value={field.fallbackValue || ''} onChange={(e) => updateField(field.fieldKey, { fallbackValue: e.target.value })} className="lc-input w-full font-mono text-xs" />
            </div>
          </PropGroup>
        )}

        {field.type === 'line' && (
          <PropGroup title="Line style">
            <div>
              <FieldLabel>Dash style</FieldLabel>
              <select value={field.dashStyle || 'solid'} onChange={(e) => updateField(field.fieldKey, { dashStyle: e.target.value })} className="lc-input w-full">
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium">
              <input type="checkbox" checked={field.arrowEnd ?? false} onChange={(e) => updateField(field.fieldKey, { arrowEnd: e.target.checked })} className="rounded" />
              Arrow end
            </label>
          </PropGroup>
        )}

        {/* Shape / line */}
        {(isShape || field.type === 'line') && (
          <PropGroup title="Appearance">
            <div>
              <FieldLabel>Border color</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={field.strokeColor || '#000000'}
                  onChange={(e) => updateField(field.fieldKey, { strokeColor: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded-md border border-[var(--lc-panel-border)]"
                />
                <input
                  type="text"
                  value={field.strokeColor || '#000000'}
                  onChange={(e) => updateField(field.fieldKey, { strokeColor: e.target.value })}
                  className="lc-input flex-1 font-mono text-xs uppercase"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Thickness (px)</FieldLabel>
              <input
                type="number"
                value={field.strokeWidth ?? 2}
                onChange={(e) => updateField(field.fieldKey, { strokeWidth: Number(e.target.value) })}
                className="lc-input w-full"
              />
            </div>
            {isShape && (
              <>
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={field.fillEnabled ?? false}
                    onChange={(e) => updateField(field.fieldKey, { fillEnabled: e.target.checked })}
                    className="rounded"
                  />
                  Fill shape
                </label>
                {isDxf && (
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={field.hideEdgeLabels ?? false}
                      onChange={(e) => updateField(field.fieldKey, { hideEdgeLabels: e.target.checked })}
                      className="rounded"
                    />
                    Hide edge labels
                  </label>
                )}
              </>
            )}
          </PropGroup>
        )}

        {/* Image */}
        {field.type === 'image' && (
          <PropGroup title="Image">
            <div>
              <FieldLabel>Source URL / path</FieldLabel>
              <input
                type="text"
                value={field.src || ''}
                onChange={(e) => updateField(field.fieldKey, { src: e.target.value })}
                className="lc-input w-full text-xs"
                placeholder="https://…"
              />
            </div>
          </PropGroup>
        )}

        {isTable && (
          <PropGroup title="Table">
            <div>
              <FieldLabel>Columns (comma-separated)</FieldLabel>
              <input
                type="text"
                value={(field.columns || []).join(', ')}
                onChange={(e) => updateField(field.fieldKey, { columns: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                className="lc-input w-full text-xs"
              />
            </div>
            <div>
              <FieldLabel>Rows (one per line, cells comma-separated)</FieldLabel>
              <textarea
                value={(field.rows || []).map((r) => r.join(', ')).join('\n')}
                onChange={(e) => updateField(field.fieldKey, {
                  rows: e.target.value.split('\n').filter(Boolean).map((line) => line.split(',').map((s) => s.trim())),
                })}
                className="lc-input min-h-[72px] w-full resize-y text-xs"
              />
            </div>
          </PropGroup>
        )}

        {isDxf && (
          <PropGroup title="DXF viewport">
            <label className="flex items-center gap-2 text-xs font-medium">
              <input type="checkbox" checked={field.showOrientation ?? true} onChange={(e) => updateField(field.fieldKey, { showOrientation: e.target.checked })} className="rounded" />
              Show orientation mark
            </label>
            <label className="flex items-center gap-2 text-xs font-medium">
              <input type="checkbox" checked={field.showBevel ?? false} onChange={(e) => updateField(field.fieldKey, { showBevel: e.target.checked })} className="rounded" />
              Show bevel/polish indicator
            </label>
          </PropGroup>
        )}

        {field.shapeType === 'roundRect' && (
          <PropGroup title="Shape">
            <div>
              <FieldLabel>Corner radius (px)</FieldLabel>
              <input type="number" value={field.cornerRadius ?? 8} onChange={(e) => updateField(field.fieldKey, { cornerRadius: Number(e.target.value) })} className="lc-input w-full" />
            </div>
          </PropGroup>
        )}

        <PropGroup title="Element">
          <div className="flex gap-2">
            <button type="button" onClick={() => toggleFieldVisible(field.fieldKey)} className="lc-btn lc-btn-outline flex-1 !text-xs">
              {field.hidden ? 'Show' : 'Hide'}
            </button>
            <button type="button" onClick={() => toggleFieldLock(field.fieldKey)} className="lc-btn lc-btn-outline flex-1 !text-xs">
              {field.locked ? 'Unlock' : 'Lock'}
            </button>
          </div>
        </PropGroup>

        {/* Layout — always shown */}
        <PropGroup title="Layout">
          <SectionLabel>Position (px)</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>X</FieldLabel>
              <input
                type="number"
                value={Math.round(field.x ?? 0)}
                onChange={(e) => updateField(field.fieldKey, { x: Number(e.target.value) })}
                className="lc-input w-full"
              />
            </div>
            <div>
              <FieldLabel>Y</FieldLabel>
              <input
                type="number"
                value={Math.round(field.y ?? 0)}
                onChange={(e) => updateField(field.fieldKey, { y: Number(e.target.value) })}
                className="lc-input w-full"
              />
            </div>
          </div>
          <SectionLabel>Size (px)</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Width</FieldLabel>
              <input
                type="number"
                value={Math.round(field.width ?? 0)}
                onChange={(e) => updateField(field.fieldKey, { width: Number(e.target.value) })}
                className="lc-input w-full"
              />
            </div>
            <div>
              <FieldLabel>Height</FieldLabel>
              <input
                type="number"
                value={Math.round(field.height ?? 0)}
                onChange={(e) => updateField(field.fieldKey, { height: Number(e.target.value) })}
                className="lc-input w-full"
              />
            </div>
          </div>
          <div>
            <FieldLabel>Rotation (°)</FieldLabel>
            <input
              type="number"
              value={field.rotation ?? 0}
              onChange={(e) => updateField(field.fieldKey, { rotation: Number(e.target.value) })}
              className="lc-input w-full"
            />
          </div>
        </PropGroup>
      </div>
    </aside>
  )
}
