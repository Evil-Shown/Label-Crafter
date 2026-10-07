import { useEffect, useRef, useState } from 'react'
import {
  Trash2,
  Copy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Link2,
  FileText,
  Database,
  TypeIcon,
  Ruler,
  Printer,
  Tag,
  MousePointerClick,
  ChevronDown,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import MappingDialog from './MappingDialog'
import FormatEditor from './FormatEditor'
import { mmToPx, pxToMm } from '../utils/units'
import { elementDisplayName, elementIcon } from '../elements/typeMeta'

const BARCODE_FORMATS = ['CODE128', 'CODE39', 'EAN13', 'ITF14', 'UPC']
const ROTATIONS = [0, 90, 180, 270]

function Group({ n, title, children }) {
  return (
    <section className="lc-card lc-card-pad mb-3.5 !rounded-2xl">
      <div className="lc-prop-head mb-2.5">
        <span className="lc-prop-num !h-5 !w-5 !rounded-full !bg-[var(--pri)] !text-[11px] !font-black !shadow-xs">
          {n}
        </span>
        <h3 className="lc-section-title !text-[13px] !font-bold tracking-tight">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="lc-label-plain mb-1 block">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-[var(--mut)]">{hint}</p>}
    </div>
  )
}

/** Geometry is stored in design pixels; the UI always speaks mm (spec §1.6). */
function MmInput({ value, onCommit, unit, step = 0.1, className = '' }) {
  const mm = pxToMm(value)
  return (
    <div className={`lc-input-unit ${unit ? 'has-unit' : ''} ${className}`}>
      <input
        type="number"
        step={step}
        className="lc-input"
        value={Number.isFinite(mm) ? Number(mm.toFixed(2)) : 0}
        onChange={(e) => onCommit(mmToPx(Number(e.target.value)))}
      />
      {unit && <span>{unit}</span>}
    </div>
  )
}

/** A value the printer understands in its own unit, shown with that unit. */
function RawInput({ value, onCommit, unit, step = 1 }) {
  return (
    <div className={`lc-input-unit ${unit ? 'has-unit' : ''}`}>
      <input
        type="number"
        step={step}
        className="lc-input"
        value={value ?? 0}
        onChange={(e) => onCommit(Number(e.target.value))}
      />
      {unit && <span>{unit}</span>}
    </div>
  )
}

export default function PropertiesPanel() {
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const fields = useLabelStore((s) => s.fields)
  const updateField = useLabelStore((s) => s.updateField)
  const deleteField = useLabelStore((s) => s.deleteField)
  const duplicateField = useLabelStore((s) => s.duplicateField)
  const toggleFieldLock = useLabelStore((s) => s.toggleFieldLock)
  const toggleFieldVisible = useLabelStore((s) => s.toggleFieldVisible)

  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)
  const setLabelSize = useLabelStore((s) => s.setLabelSize)
  const margins = useLabelStore((s) => s.margins)
  const setMargins = useLabelStore((s) => s.setMargins)
  const printerBrand = useLabelStore((s) => s.printerBrand)
  const printerDpi = useLabelStore((s) => s.printerDpi)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const templateName = useLabelStore((s) => s.name)
  const labelType = useLabelStore((s) => s.labelType)
  const client = useLabelStore((s) => s.client)

  const [mappingOpen, setMappingOpen] = useState(false)
  const [alignOpen, setAlignOpen] = useState(false)
  const alignRef = useRef(null)

  useEffect(() => {
    if (!alignOpen) return undefined
    const onDown = (e) => {
      if (alignRef.current && !alignRef.current.contains(e.target)) setAlignOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [alignOpen])

  const field = selectedKeys.length === 1 ? fields.find((f) => f.fieldKey === selectedKeys[0]) : null

  const panelClass =
    'lc-sidebar-right flex h-full w-[300px] shrink-0 flex-col overflow-y-auto border-l border-[var(--line)] text-[var(--tx)] select-none'

  /* ── Nothing selected → Label settings (spec §4.3 / main_erp.png) ── */
  if (!field) {
    return (
      <aside className={panelClass}>
        <header className="flex items-center gap-2.5 border-b border-[var(--line)] px-4 py-3">
          <span className="lc-type-tile">
            <Tag size={16} />
          </span>
          <div className="min-w-0">
            <h2 className="lc-dialog-title truncate">Label</h2>
            <p className="truncate text-[12.5px] text-[var(--mut)]">Nothing selected · page settings</p>
          </div>
        </header>

        <div className="flex-1 px-4 py-4">
          <section className="lc-card lc-card-pad mb-4 !rounded-2xl">
            <div className="mb-3 flex items-center gap-2">
              <Ruler size={15} className="text-[var(--mut)]" />
              <h3 className="lc-section-title">Size</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Width">
                <MmInput value={mmToPx(width)} onCommit={(px) => setLabelSize(pxToMm(px), height)} unit="mm" />
              </Field>
              <Field label="Height">
                <MmInput value={mmToPx(height)} onCommit={(px) => setLabelSize(width, pxToMm(px))} unit="mm" />
              </Field>
            </div>
            <div className="mt-3">
              <label className="lc-label-plain mb-1 block">Margins (L · R · T · B)</label>
              <div className="grid grid-cols-4 gap-2">
                {['left', 'right', 'top', 'bottom'].map((side) => (
                  <input
                    key={side}
                    type="number"
                    step={0.5}
                    aria-label={`${side} margin`}
                    value={margins?.[side] ?? 0}
                    onChange={(e) => setMargins({ [side]: Number(e.target.value) })}
                    className="lc-input !h-[32px] !px-2 text-center !rounded-xl"
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="lc-card lc-card-pad mb-4 !rounded-2xl">
            <div className="mb-3 flex items-center gap-2">
              <Printer size={15} className="text-[var(--mut)]" />
              <h3 className="lc-section-title">Printer</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Brand">
                <select
                  value={printerBrand}
                  onChange={(e) => setPrintConfig({ printerBrand: e.target.value })}
                  className="lc-select !rounded-xl"
                >
                  <option value="zebra">Zebra</option>
                  <option value="tsc">TSC</option>
                  <option value="epl">Eltron / EPL2</option>
                  <option value="datamax">Datamax</option>
                  <option value="honeywell">Honeywell</option>
                  <option value="citizen">Citizen</option>
                  <option value="sato">SATO (SZPL)</option>
                  <option value="sato-sbpl">SATO (SBPL)</option>
                  <option value="godex">Godex</option>
                </select>
              </Field>
              <Field label="Resolution">
                <select
                  value={printerDpi}
                  onChange={(e) => setPrintConfig({ printerDpi: Number(e.target.value) })}
                  className="lc-select !rounded-xl"
                >
                  <option value={203}>203 DPI</option>
                  <option value={300}>300 DPI</option>
                  <option value={600}>600 DPI</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="lc-card lc-card-pad !rounded-2xl">
            <div className="mb-3 flex items-center gap-2">
              <FileText size={15} className="text-[var(--mut)]" />
              <h3 className="lc-section-title">Template</h3>
            </div>
            <Field label="Name">
              <input
                type="text"
                value={templateName}
                onChange={(e) => useLabelStore.getState().setTemplateMeta({ name: e.target.value })}
                placeholder="Template name"
                className="lc-input"
              />
            </Field>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Type">
                <select
                  value={labelType}
                  onChange={(e) => useLabelStore.getState().setTemplateMeta({ labelType: e.target.value })}
                  className="lc-select capitalize"
                >
                  <option value="production">Production</option>
                  <option value="offcut">Offcut</option>
                </select>
              </Field>
              <Field label="Saved for">
                <select
                  value={client}
                  onChange={(e) => useLabelStore.getState().setClient(e.target.value)}
                  className="lc-select font-bold"
                >
                  <option value="opti">OPTI</option>
                  <option value="erp">ERP</option>
                </select>
              </Field>
            </div>
          </section>
        </div>

        <p className="flex items-center justify-center gap-1.5 px-4 pb-4 pt-2 text-center text-[12.5px] text-[var(--mut)]">
          <MousePointerClick size={14} />
          Click an element to edit it
        </p>
      </aside>
    )
  }

  /* ── Element selected → three numbered questions (spec §4.1) ── */
  const isBarcode = field.type === 'barcode'
  const isQr = field.type === 'qrcode'
  const isText = field.type === 'text' || field.type === 'header'
  const isShapeLike = field.type === 'shape' || field.type === 'dxf' || field.type === 'line'
  const TypeIconEl = elementIcon(field)
  const noteField = Number(field.noteField) || 0
  const subField = Number(field.subField) || 0
  const boundField = field.source?.[0] || ''
  const activeSource = noteField > 0 ? 'slot' : boundField ? 'field' : 'fixed'
  const labelW = mmToPx(width)
  const labelH = mmToPx(height)

  const align = (mode) => {
    const map = {
      left: { x: 0 },
      center: { x: (labelW - field.width) / 2 },
      right: { x: labelW - field.width },
      top: { y: 0 },
      middle: { y: (labelH - field.height) / 2 },
      bottom: { y: labelH - field.height },
    }
    updateField(field.fieldKey, map[mode])
    setAlignOpen(false)
  }

  const ALIGN_ITEMS = [
    { id: 'left', label: 'Left edge', Icon: AlignLeft },
    { id: 'center', label: 'Centre', Icon: AlignCenter },
    { id: 'right', label: 'Right edge', Icon: AlignRight },
    { id: 'top', label: 'Top edge', Icon: AlignStartVertical },
    { id: 'middle', label: 'Middle', Icon: AlignCenterVertical },
    { id: 'bottom', label: 'Bottom edge', Icon: AlignEndVertical },
  ]

  return (
    <aside className={panelClass}>
      <header className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="lc-type-tile">
            <TypeIconEl size={16} />
          </span>
          <div className="min-w-0">
            <h2 className="lc-dialog-title truncate">{elementDisplayName(field)}</h2>
            <p className="truncate text-[12.5px] text-[var(--mut)]">
              Layer {(field.zIndex ?? 0) + 1} of {fields.length}
            </p>
          </div>
        </div>
        <div className="flex flex-none items-center gap-1">
          <button
            type="button"
            onClick={() => duplicateField(field.fieldKey)}
            className="lc-icon-btn"
            title="Duplicate this element"
          >
            <Copy size={15} />
          </button>
          <button
            type="button"
            onClick={() => deleteField(field.fieldKey)}
            className="lc-icon-btn is-danger"
            title="Delete this element"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 py-4">
        {/* 1. What does it show? */}
        <Group n={1} title="What does it show?">
          <div className="lc-segment">
            <button
              type="button"
              className={activeSource === 'slot' ? 'is-on' : ''}
              onClick={() => setMappingOpen(true)}
            >
              <FileText size={14} />
              Note slot
            </button>
            <button
              type="button"
              className={activeSource === 'field' ? 'is-on' : ''}
              onClick={() =>
                useLabelStore.setState({
                  showFieldPicker: true,
                  fieldPickerCallback: (k) =>
                    updateField(field.fieldKey, { source: [k], value: `{{${k}}}` }),
                })
              }
            >
              <Database size={14} />
              Field
            </button>
            <button
              type="button"
              className={activeSource === 'fixed' ? 'is-on' : ''}
              onClick={() =>
                updateField(field.fieldKey, { noteField: 0, subField: 0, source: [], ifEmpty: 'blank' })
              }
            >
              <TypeIcon size={14} />
              Fixed
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Note">
              <select
                value={noteField || 1}
                onChange={(e) => updateField(field.fieldKey, { noteField: Number(e.target.value) })}
                className="lc-select"
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    Note {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Field">
              <select
                value={subField || 1}
                onChange={(e) => updateField(field.fieldKey, { subField: Number(e.target.value) })}
                className="lc-select"
              >
                {Array.from({ length: 20 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Field {i + 1}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-3">
            <Field label="If empty">
              <select
                value={field.ifEmpty || 'blank'}
                onChange={(e) => updateField(field.fieldKey, { ifEmpty: e.target.value })}
                className="lc-select"
              >
                <option value="blank">Print nothing</option>
                <option value="hide">Hide element</option>
              </select>
            </Field>
          </div>

          <button
            type="button"
            onClick={() => setMappingOpen(true)}
            className="lc-msg lc-msg-info mt-3 w-full !justify-start !py-2 text-left"
            title="Open the full mapping dialog"
          >
            <Link2 size={14} className="flex-none" />
            <span className="text-[12.5px] font-semibold">
              Reads <span className="lc-mono">note{noteField || 1}.field{subField || 1}</span>
              <span className="mx-1 text-[var(--mut)]">·</span>
              shows <span className="lc-mono font-bold">N{noteField || 1}F{subField || 1}</span>
            </span>
          </button>
        </Group>

        {/* 2. How does it look? */}
        <Group n={2} title="How does it look?">
          {isBarcode && (
            <>
              <Field label="Symbology">
                <select
                  value={field.barcodeFormat || 'CODE128'}
                  onChange={(e) => updateField(field.fieldKey, { barcodeFormat: e.target.value })}
                  className="lc-select"
                >
                  {BARCODE_FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Bar width">
                  {/* Bar width is a printer dot count, not a millimetre value. */}
                  <RawInput
                    value={field.barWidth || 2}
                    onCommit={(v) => updateField(field.fieldKey, { barWidth: v })}
                    unit="dots"
                  />
                </Field>
                <Field label="Rotation">
                  <select
                    value={field.rotation || 0}
                    onChange={(e) => updateField(field.fieldKey, { rotation: Number(e.target.value) })}
                    className="lc-select"
                  >
                    {ROTATIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}°
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[var(--tx)]">
                <input
                  type="checkbox"
                  checked={field.displayValue !== false}
                  onChange={(e) => updateField(field.fieldKey, { displayValue: e.target.checked })}
                />
                <span>Show text under bars</span>
              </label>
            </>
          )}

          {isQr && (
            <>
              <Field label="Error correction">
                <select
                  value={field.qrEcc || 'M'}
                  onChange={(e) => updateField(field.fieldKey, { qrEcc: e.target.value })}
                  className="lc-select"
                >
                  {['L', 'M', 'Q', 'H'].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Rotation">
                  <select
                    value={field.rotation || 0}
                    onChange={(e) => updateField(field.fieldKey, { rotation: Number(e.target.value) })}
                    className="lc-select"
                  >
                    {ROTATIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}°
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </>
          )}

          {isText && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Font size">
                  <MmInput
                    value={field.fontSize || 12}
                    onCommit={(v) => updateField(field.fieldKey, { fontSize: v })}
                    unit="mm"
                  />
                </Field>
                <Field label="Alignment">
                  <div className="lc-segment lc-segment-row">
                    {[
                      { id: 'left', Icon: AlignLeft },
                      { id: 'center', Icon: AlignCenter },
                      { id: 'right', Icon: AlignRight },
                    ].map(({ id, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        title={`Align ${id}`}
                        className={(field.textAlign || 'left') === id ? 'is-on' : ''}
                        onClick={() => updateField(field.fieldKey, { textAlign: id })}
                      >
                        <Icon size={14} />
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Rotation">
                  <select
                    value={field.rotation || 0}
                    onChange={(e) => updateField(field.fieldKey, { rotation: Number(e.target.value) })}
                    className="lc-select"
                  >
                    {ROTATIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}°
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </>
          )}

          {isShapeLike && (
            <>
              {field.type !== 'line' && (
                <Field label="Shape">
                  <select
                    value={field.shapeType || 'rect'}
                    onChange={(e) => updateField(field.fieldKey, { shapeType: e.target.value })}
                    className="lc-select"
                  >
                    <option value="rect">Rectangle</option>
                    <option value="roundrect">Rounded rectangle</option>
                    <option value="ellipse">Ellipse</option>
                    <option value="dxf">DXF outline</option>
                  </select>
                </Field>
              )}
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[var(--tx)]">
                <input
                  type="checkbox"
                  checked={!!field.fillEnabled}
                  onChange={(e) => updateField(field.fieldKey, { fillEnabled: e.target.checked })}
                />
                <span>Fill shape</span>
              </label>
              {field.type === 'line' && (
                <div className="mt-3">
                  <Field label="Line style">
                    <select
                      value={field.dashStyle || 'solid'}
                      onChange={(e) => updateField(field.fieldKey, { dashStyle: e.target.value })}
                      className="lc-select"
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </Field>
                </div>
              )}
            </>
          )}
        </Group>

        {isText && (
          <Group n={3} title="Format">
            <FormatEditor
              field={field}
              onChange={(partial) => updateField(field.fieldKey, partial)}
            />
          </Group>
        )}

        {/* 3. Position & size — millimetres everywhere */}
        <Group n={4} title="Position & size">
          <div className="grid grid-cols-4 gap-2">
            <Field label="X">
              <MmInput
                value={field.x}
                onCommit={(v) => updateField(field.fieldKey, { x: v })}
                className="[&>input]:!px-1.5 [&>input]:text-center"
              />
            </Field>
            <Field label="Y">
              <MmInput
                value={field.y}
                onCommit={(v) => updateField(field.fieldKey, { y: v })}
                className="[&>input]:!px-1.5 [&>input]:text-center"
              />
            </Field>
            <Field label="W">
              <MmInput
                value={field.width}
                onCommit={(v) => updateField(field.fieldKey, { width: v })}
                className="[&>input]:!px-1.5 [&>input]:text-center"
              />
            </Field>
            <Field label="H">
              <MmInput
                value={field.height}
                onCommit={(v) => updateField(field.fieldKey, { height: v })}
                className="[&>input]:!px-1.5 [&>input]:text-center"
              />
            </Field>
          </div>
          <p className="mt-2 text-[11px] text-[var(--mut)]">All values in mm</p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleFieldVisible(field.fieldKey)}
              className="lc-btn lc-btn-secondary flex-1 !px-2"
            >
              {field.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{field.hidden ? 'Show' : 'Hide'}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleFieldLock(field.fieldKey)}
              className="lc-btn lc-btn-secondary flex-1 !px-2"
            >
              {field.locked ? <Lock size={14} /> : <Unlock size={14} />}
              <span>{field.locked ? 'Unlock' : 'Lock'}</span>
            </button>
            <div className="relative flex-1" ref={alignRef}>
              <button
                type="button"
                onClick={() => setAlignOpen((v) => !v)}
                aria-expanded={alignOpen}
                className="lc-btn lc-btn-secondary w-full !px-2"
              >
                <AlignCenter size={14} />
                <span>Align</span>
                <ChevronDown size={13} className="ml-auto" />
              </button>
              {alignOpen && (
                <div className="lc-pop left-0 top-11 w-[176px] p-1">
                  {ALIGN_ITEMS.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => align(id)}
                      className="flex w-full items-center gap-2 rounded-[7px] px-2 py-1.5 text-left text-[13px] font-medium text-[var(--tx-2)] hover:bg-[var(--bg)] hover:text-[var(--pri)]"
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Group>
      </div>

      {mappingOpen && (
        <MappingDialog
          field={field}
          onClose={() => setMappingOpen(false)}
          onSave={(patch) => updateField(field.fieldKey, patch)}
        />
      )}
    </aside>
  )
}
