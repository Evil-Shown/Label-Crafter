import { useMemo } from 'react'
import { useLabelStore } from '../store/labelStore'
import { formulaPreview } from '../utils/formatFormula'

const FONTS = ['Arial', 'Segoe UI', 'Consolas', 'Tahoma', 'Times New Roman']
const SIDES = [
  ['borderLeft', 'Left'],
  ['borderRight', 'Right'],
  ['borderTop', 'Top'],
  ['borderBottom', 'Bottom'],
]

function Row({ label, children }) {
  return (
    <label className="block">
      <span className="lc-label-plain mb-1 block">{label}</span>
      {children}
    </label>
  )
}

function Check({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[12.5px] font-medium text-[var(--tx)]">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  )
}

export default function FormatEditor({ field, onChange }) {
  const labelData = useLabelStore((s) => s.labelData)
  const patch = (partial) => onChange(partial)
  const style = field.fontStyle === 'italic'
    ? (field.fontWeight === 'bold' ? 'bold-italic' : 'italic')
    : (field.fontWeight === 'bold' ? 'bold' : 'regular')

  const preview = useMemo(
    () => formulaPreview(field.formatRules, labelData || {}),
    [field.formatRules, labelData],
  )
  const previewBits = Object.entries(preview)
    .filter(([, v]) => v != null && v !== '' && !preview.error)
    .map(([k, v]) => `${k}=${v}`)

  return (
    <div className="space-y-3">
      <Row label="Object name">
        <input
          className="lc-input"
          value={field.objectName || field.label || ''}
          onChange={(e) => patch({ objectName: e.target.value, label: e.target.value })}
        />
      </Row>

      <div className="grid grid-cols-2 gap-2">
        <Check checked={field.suppress} onChange={(v) => patch({ suppress: v, hidden: v })}>Suppress</Check>
        <Check checked={field.suppressIfDuplicated} onChange={(v) => patch({ suppressIfDuplicated: v })}>
          Suppress if duplicated
        </Check>
        <Check checked={field.canGrow} onChange={(v) => patch({ canGrow: v })}>Can grow</Check>
        <Check checked={field.locked} onChange={(v) => patch({ locked: v })}>Lock position and size</Check>
      </div>

      <Row label="Maximum lines (0 = no limit)">
        <input
          type="number"
          min={0}
          className="lc-input"
          value={field.maxLines ?? 0}
          onChange={(e) => patch({ maxLines: Number(e.target.value) || 0 })}
        />
      </Row>

      <div className="grid grid-cols-2 gap-2">
        <Row label="Font">
          <select
            className="lc-select"
            value={field.fontFamily || 'Arial'}
            onChange={(e) => patch({ fontFamily: e.target.value })}
          >
            {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Row>
        <Row label="Style">
          <select
            className="lc-select"
            value={style}
            onChange={(e) => {
              const v = e.target.value
              patch({
                fontWeight: v.startsWith('bold') ? 'bold' : 'normal',
                fontStyle: v.includes('italic') ? 'italic' : 'normal',
              })
            }}
          >
            <option value="regular">Regular</option>
            <option value="bold">Bold</option>
            <option value="italic">Italic</option>
            <option value="bold-italic">Bold italic</option>
          </select>
        </Row>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Row label="Color">
          <input
            type="color"
            className="h-9 w-full cursor-pointer rounded-md border border-[var(--line)] bg-[var(--panel)]"
            value={field.color || '#000000'}
            onChange={(e) => patch({ color: e.target.value })}
          />
        </Row>
        <Row label="Character spacing (px)">
          <input
            type="number"
            step="0.5"
            className="lc-input"
            value={field.letterSpacing ?? 0}
            onChange={(e) => patch({ letterSpacing: Number(e.target.value) || 0 })}
          />
        </Row>
      </div>

      <div className="flex gap-4">
        <Check checked={field.underline} onChange={(v) => patch({ underline: v })}>Underline</Check>
        <Check checked={field.strikeout} onChange={(v) => patch({ strikeout: v })}>Strikeout</Check>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {SIDES.map(([key, label]) => (
          <Row key={key} label={label}>
            <select
              className="lc-select"
              value={field[key] || 'none'}
              onChange={(e) => patch({ [key]: e.target.value })}
            >
              <option value="none">None</option>
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
            </select>
          </Row>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Check checked={field.background} onChange={(v) => patch({ background: v })}>Background</Check>
        <input
          type="color"
          disabled={!field.background}
          className="h-8 w-14 cursor-pointer rounded-md border border-[var(--line)]"
          value={field.backgroundColor || '#ffffff'}
          onChange={(e) => patch({ backgroundColor: e.target.value })}
        />
        <span className="text-[12px] text-[var(--mut)]">Border</span>
        <input
          type="color"
          className="h-8 w-14 cursor-pointer rounded-md border border-[var(--line)]"
          value={field.borderColor || '#000000'}
          onChange={(e) => patch({ borderColor: e.target.value })}
        />
      </div>

      <Row label="When this is true (if / else)">
        <textarea
          className="lc-input min-h-[120px] py-2 font-mono text-[12px] leading-relaxed"
          spellCheck={false}
          placeholder={'if {Rush} then bold\nif {Status} = "HOLD" then suppress\nif {WeightKg} > 20 then color #B91C1C\nif {OrderNo} <> "" then text "Job " & {OrderNo}'}
          value={field.formatRules || ''}
          onChange={(e) => patch({ formatRules: e.target.value })}
        />
      </Row>
      <p className="text-[11px] leading-relaxed text-[var(--mut)]">
        Use {'{FieldName}'} from the loaded data. Actions: bold, italic, underline, strike, suppress, show,
        color #hex, size 14, align left, text &quot;...&quot;.
        {preview.error
          ? ` ${preview.error}`
          : previewBits.length
            ? ` Now: ${previewBits.join(', ')}`
            : ' No rule is matching the loaded data.'}
      </p>
    </div>
  )
}
