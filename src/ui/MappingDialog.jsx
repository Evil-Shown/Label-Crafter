import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const NOTE_CHOICES = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: 'Custom', value: 'custom' },
]

const SUB_CHOICES = [
  ...Array.from({ length: 50 }, (_, i) => ({ label: String(i + 1), value: i + 1 })),
  { label: 'Custom', value: 'custom' },
]

function modeFor(value, maxPreset) {
  const n = Number(value)
  if (Number.isInteger(n) && n >= 1 && n <= maxPreset) return n
  if (n > maxPreset) return 'custom'
  return ''
}

export default function MappingDialog({ field, onSave, onClose }) {
  const initialNote = Number(field?.noteField) || 0
  const initialSub = Number(field?.subField) || 0
  const [noteMode, setNoteMode] = useState(() => modeFor(initialNote, 3))
  const [subMode, setSubMode] = useState(() => modeFor(initialSub, 50))
  const [noteField, setNoteField] = useState(initialNote || '')
  const [subField, setSubField] = useState(initialSub || '')
  const [isBlackBox, setIsBlackBox] = useState(!!(field?.blackBox || field?.isBlackBox))

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const nf = Number(noteField) || 0
  const sf = Number(subField) || 0
  const preview = nf > 0 ? `N${nf}F${sf || 1}` : isBlackBox ? 'Black box only' : 'No mapping'

  const save = () => {
    onSave?.({
      noteField: nf,
      subField: sf,
      blackBox: isBlackBox,
      isBlackBox,
      color: isBlackBox ? '#ffffff' : (field?.color && field.color !== '#ffffff' ? field.color : '#000000'),
    })
    onClose?.()
  }

  const clear = () => {
    onSave?.({
      noteField: 0,
      subField: 0,
      blackBox: false,
      isBlackBox: false,
      color: field?.color === '#ffffff' ? '#000000' : (field?.color || '#000000'),
    })
    onClose?.()
  }

  return createPortal(
    <div className="lc-modal-overlay !z-[90]" role="presentation" onClick={onClose}>
      <div
        className="lc-modal !max-w-[430px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mapping-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 id="mapping-title" className="text-base font-bold text-[var(--lc-text)]">
              Configure Data Mapping
            </h2>
            <p className="mt-0.5 text-[11px] text-[var(--lc-text-muted)]">
              {field?.label || field?.type || 'Field'} · same as Opti Labels designer
            </p>
          </div>
          <button type="button" onClick={onClose} className="lc-icon-btn" aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <p className="mb-4 text-[11px] leading-relaxed text-[var(--lc-text-muted)]">
          Map this element to a piece note. Printing reads <span className="font-mono">noteN.fieldM</span>.
          Leave heading text empty to show the mapped value. Tokens like <span className="font-mono">{'{{orderNumber}}'}</span> still win when set.
        </p>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[var(--lc-text-muted)]">Note field</label>
            <select
              className="lc-input w-full"
              value={noteMode}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'custom') {
                  setNoteMode('custom')
                  if (Number(noteField) >= 1 && Number(noteField) <= 3) setNoteField('')
                  return
                }
                if (v === '') {
                  setNoteMode('')
                  setNoteField('')
                  return
                }
                const n = Number(v)
                setNoteMode(n)
                setNoteField(n)
              }}
            >
              <option value="">None</option>
              {NOTE_CHOICES.map((o) => (
                <option key={String(o.value)} value={o.value}>{o.label}</option>
              ))}
            </select>
            {noteMode === 'custom' && (
              <input
                type="number"
                min="1"
                max="20"
                className="lc-input mt-2 w-full"
                placeholder="Note number"
                value={noteField}
                onChange={(e) => setNoteField(e.target.value)}
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[var(--lc-text-muted)]">Sub field</label>
            <select
              className="lc-input w-full"
              value={subMode}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'custom') {
                  setSubMode('custom')
                  if (Number(subField) >= 1 && Number(subField) <= 50) setSubField('')
                  return
                }
                if (v === '') {
                  setSubMode('')
                  setSubField('')
                  return
                }
                const n = Number(v)
                setSubMode(n)
                setSubField(n)
              }}
            >
              <option value="">None</option>
              {SUB_CHOICES.map((o) => (
                <option key={String(o.value)} value={o.value}>{o.label}</option>
              ))}
            </select>
            {subMode === 'custom' && (
              <input
                type="number"
                min="1"
                max="99"
                className="lc-input mt-2 w-full"
                placeholder="Sub field number"
                value={subField}
                onChange={(e) => setSubField(e.target.value)}
              />
            )}
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-[var(--lc-text)]">
            <input
              type="checkbox"
              className="rounded"
              checked={isBlackBox}
              onChange={(e) => setIsBlackBox(e.target.checked)}
            />
            Black box (white text on black)
          </label>

          <div className="rounded-md border border-[var(--lc-panel-border)] bg-[var(--lc-accent-soft)] px-3 py-2 font-mono text-[11px] text-[var(--lc-accent)]">
            {nf > 0
              ? `Reads note${nf}.field${sf || '?'} · canvas shows ${preview}`
              : preview}
          </div>
        </div>

        <div className="mt-6 flex justify-between gap-2">
          <button type="button" onClick={clear} className="lc-btn lc-btn-ghost !text-xs">
            Clear mapping
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="lc-btn lc-btn-outline !text-xs">Cancel</button>
            <button type="button" onClick={save} className="lc-btn lc-btn-primary !text-xs">Save mapping</button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
