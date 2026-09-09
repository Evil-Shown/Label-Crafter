import { useLabelStore } from '../store/labelStore'
import { pxToMm, mmToPx } from '../utils/units'

function FieldEditor({ field, onChange }) {
  const type = (field.type || 'text').toLowerCase()

  return (
    <div className="space-y-3 text-xs">
      <label className="block">
        <span className="mb-1 block text-[var(--lc-muted)]">Label</span>
        <input
          className="field-input"
          value={field.label || ''}
          onChange={(e) => onChange({ label: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[var(--lc-muted)]">Field key</span>
        <input
          className="field-input font-mono"
          value={field.fieldKey || ''}
          onChange={(e) => onChange({ fieldKey: e.target.value })}
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[var(--lc-muted)]">X (px)</span>
          <input
            type="number"
            className="field-input"
            value={Math.round(field.x ?? 0)}
            onChange={(e) => onChange({ x: Number(e.target.value) })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[var(--lc-muted)]">Y (px)</span>
          <input
            type="number"
            className="field-input"
            value={Math.round(field.y ?? 0)}
            onChange={(e) => onChange({ y: Number(e.target.value) })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[var(--lc-muted)]">Width</span>
          <input
            type="number"
            className="field-input"
            value={Math.round(field.width ?? 0)}
            onChange={(e) => onChange({ width: Number(e.target.value) })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[var(--lc-muted)]">Height</span>
          <input
            type="number"
            className="field-input"
            value={Math.round(field.height ?? 0)}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-[var(--lc-muted)]">Rotation (°)</span>
        <input
          type="number"
          className="field-input"
          value={field.rotation ?? 0}
          onChange={(e) => onChange({ rotation: Number(e.target.value) })}
        />
      </label>

      {type === 'text' && (
        <>
          <label className="block">
            <span className="mb-1 block text-[var(--lc-muted)]">
              Text / tokens
            </span>
            <textarea
              className="field-input min-h-16 resize-y"
              value={field.value || ''}
              onChange={(e) => onChange({ value: e.target.value })}
              placeholder="{{orderNumber}}"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[var(--lc-muted)]">Font size</span>
              <input
                type="number"
                className="field-input"
                value={field.fontSize ?? 12}
                onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[var(--lc-muted)]">Weight</span>
              <select
                className="field-input"
                value={field.fontWeight || 'normal'}
                onChange={(e) => onChange({ fontWeight: e.target.value })}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[var(--lc-muted)]">Align</span>
            <select
              className="field-input"
              value={field.textAlign || 'left'}
              onChange={(e) => onChange({ textAlign: e.target.value })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </>
      )}

      {(type === 'barcode' || type === 'qrcode') && (
        <label className="block">
          <span className="mb-1 block text-[var(--lc-muted)]">Fallback value</span>
          <input
            className="field-input"
            value={field.fallbackValue || ''}
            onChange={(e) => onChange({ fallbackValue: e.target.value })}
          />
        </label>
      )}

      {(type === 'shape' || type === 'line') && (
        <>
          <label className="block">
            <span className="mb-1 block text-[var(--lc-muted)]">Stroke</span>
            <input
              type="color"
              className="h-8 w-full cursor-pointer rounded border border-[var(--lc-panel-border)]"
              value={field.strokeColor || '#000000'}
              onChange={(e) => onChange({ strokeColor: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[var(--lc-muted)]">Stroke width</span>
            <input
              type="number"
              className="field-input"
              value={field.strokeWidth ?? 2}
              onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })}
            />
          </label>
        </>
      )}

      {type === 'image' && (
        <label className="block">
          <span className="mb-1 block text-[var(--lc-muted)]">Image URL / path</span>
          <input
            className="field-input"
            value={field.src || ''}
            onChange={(e) => onChange({ src: e.target.value })}
          />
        </label>
      )}
    </div>
  )
}

export default function PropertiesPanel() {
  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)
  const printerDpi = useLabelStore((s) => s.printerDpi)
  const client = useLabelStore((s) => s.client)
  const printerBrand = useLabelStore((s) => s.printerBrand)
  const printServiceUrl = useLabelStore((s) => s.printServiceUrl)
  const showGrid = useLabelStore((s) => s.showGrid)
  const snapToGrid = useLabelStore((s) => s.snapToGrid)
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const fields = useLabelStore((s) => s.fields)

  const setLabelSize = useLabelStore((s) => s.setLabelSize)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const setClient = useLabelStore((s) => s.setClient)
  const updateField = useLabelStore((s) => s.updateField)

  const field =
    selectedKeys.length === 1
      ? fields.find((f) => f.fieldKey === selectedKeys[0])
      : null

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-[var(--lc-panel-border)] bg-[var(--lc-panel)]">
      <h3 className="border-b border-[var(--lc-panel-border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--lc-muted)]">
        Properties
      </h3>

      <div className="flex-1 overflow-y-auto p-3">
        <section className="mb-4 space-y-2 border-b border-[var(--lc-panel-border)] pb-4">
          <h4 className="text-xs font-medium text-white">Label</h4>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs">
              <span className="mb-1 block text-[var(--lc-muted)]">Width (mm)</span>
              <input
                type="number"
                className="field-input"
                value={width}
                onChange={(e) =>
                  setLabelSize(Number(e.target.value), height)
                }
              />
            </label>
            <label className="block text-xs">
              <span className="mb-1 block text-[var(--lc-muted)]">Height (mm)</span>
              <input
                type="number"
                className="field-input"
                value={height}
                onChange={(e) =>
                  setLabelSize(width, Number(e.target.value))
                }
              />
            </label>
          </div>
          <p className="text-[10px] text-[var(--lc-muted)]">
            Canvas: {Math.round(mmToPx(width))} × {Math.round(mmToPx(height))} px
            ({pxToMm(mmToPx(width)).toFixed(1)} mm)
          </p>
          <label className="block text-xs">
            <span className="mb-1 block text-[var(--lc-muted)]">Printer DPI</span>
            <select
              className="field-input"
              value={printerDpi}
              onChange={(e) =>
                setPrintConfig({ printerDpi: Number(e.target.value) })
              }
            >
              <option value={203}>203 DPI</option>
              <option value={300}>300 DPI</option>
              <option value={600}>600 DPI</option>
            </select>
          </label>
        </section>

        <section className="mb-4 space-y-2 border-b border-[var(--lc-panel-border)] pb-4">
          <h4 className="text-xs font-medium text-white">Print service</h4>
          <label className="block text-xs">
            <span className="mb-1 block text-[var(--lc-muted)]">Client</span>
            <select
              className="field-input"
              value={client}
              onChange={(e) => setClient(e.target.value)}
            >
              <option value="opti">Opti</option>
              <option value="erp">ERP</option>
            </select>
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-[var(--lc-muted)]">Printer brand</span>
            <select
              className="field-input"
              value={printerBrand}
              onChange={(e) =>
                setPrintConfig({ printerBrand: e.target.value })
              }
            >
              <option value="zebra">Zebra (ZPL)</option>
              <option value="tsc">TSC (TSPL)</option>
              <option value="honeywell">Honeywell</option>
              <option value="godex">Godex (EZPL)</option>
              <option value="sato">Sato</option>
              <option value="datamax">Datamax (DPL)</option>
            </select>
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-[var(--lc-muted)]">Service URL</span>
            <input
              className="field-input"
              value={printServiceUrl}
              onChange={(e) =>
                setPrintConfig({ printServiceUrl: e.target.value })
              }
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setPrintConfig({ showGrid: e.target.checked })}
            />
            Show grid
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setPrintConfig({ snapToGrid: e.target.checked })}
            />
            Snap to grid
          </label>
        </section>

        {field ? (
          <FieldEditor
            field={field}
            onChange={(patch) => updateField(field.fieldKey, patch)}
          />
        ) : (
          <p className="text-xs text-[var(--lc-muted)]">
            Select an element on the canvas to edit its properties.
          </p>
        )}
      </div>
    </aside>
  )
}
