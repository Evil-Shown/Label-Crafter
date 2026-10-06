import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check } from 'lucide-react'

export default function MappingDialog({ field, onSave, onClose }) {
  const initialNote = Number(field?.noteField) || 1
  const initialSub = Number(field?.subField) || 1
  const [activeTab, setActiveTab] = useState('slot') // 'slot' | 'field' | 'tokens' | 'fixed'
  const [noteNumber, setNoteNumber] = useState(initialNote)
  const [subNumber, setSubNumber] = useState(initialSub)
  const [ifEmpty, setIfEmpty] = useState('blank')
  const [isBlackBox, setIsBlackBox] = useState(!!(field?.blackBox || field?.isBlackBox))

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const previewKey = `N${noteNumber}F${subNumber}`

  const handleApply = () => {
    onSave?.({
      noteField: noteNumber,
      subField: subNumber,
      ifEmpty,
      blackBox: isBlackBox,
      isBlackBox,
      color: isBlackBox ? '#ffffff' : (field?.color || '#000000'),
    })
    onClose?.()
  }

  const handleRemove = () => {
    onSave?.({
      noteField: 0,
      subField: 0,
      blackBox: false,
      isBlackBox: false,
    })
    onClose?.()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-2xl text-[var(--tx)]">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[var(--pri)] dark:bg-blue-950">
              🔗
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--tx)]">
                Data mapping · <span className="capitalize">{field?.type || 'Element'}</span>
              </h2>
              <p className="text-[11px] text-[var(--mut)]">
                Choose where this element gets its value when the label prints.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--mut)] hover:text-[var(--tx)]">
            <X size={16} />
          </button>
        </div>

        {/* 4 Tabs */}
        <div className="mt-4 grid grid-cols-4 rounded-lg bg-[var(--bg)] p-1 border border-[var(--line)] text-xs font-semibold text-center">
          <button
            type="button"
            onClick={() => setActiveTab('slot')}
            className={`rounded py-1.5 transition-all ${
              activeTab === 'slot' ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs' : 'text-[var(--mut)]'
            }`}
          >
            Note slot
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('field')}
            className={`rounded py-1.5 transition-all ${
              activeTab === 'field' ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs' : 'text-[var(--mut)]'
            }`}
          >
            Piece / order field
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tokens')}
            className={`rounded py-1.5 transition-all ${
              activeTab === 'tokens' ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs' : 'text-[var(--mut)]'
            }`}
          >
            Text with tokens
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fixed')}
            className={`rounded py-1.5 transition-all ${
              activeTab === 'fixed' ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs' : 'text-[var(--mut)]'
            }`}
          >
            Fixed text
          </button>
        </div>

        {/* Note Grid */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          {/* Note column */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--mut)] block">Note</label>
            <div className="space-y-1.5">
              {[
                { id: 1, label: 'Note 1', count: '6 used' },
                { id: 2, label: 'Note 2', count: '4 used' },
                { id: 3, label: 'Note 3', count: '1 used' },
              ].map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setNoteNumber(n.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                    noteNumber === n.id
                      ? 'border-blue-500 bg-blue-50 text-[var(--pri)] dark:bg-blue-950/60'
                      : 'border-[var(--line)] text-[var(--tx)] hover:bg-[var(--line-subtle)]'
                  }`}
                >
                  <span>{n.label}</span>
                  <span className="text-[10px] text-[var(--mut)]">{n.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subfield grid (1-20 / 21-50) */}
          <div className="col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--mut)]">Field (1–50)</label>
              <span className="text-[10px] text-[var(--mut)]">grey = already used on this label</span>
            </div>

            <div className="grid grid-cols-10 gap-1.5">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
                const isSelected = subNumber === num
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSubNumber(num)}
                    className={`flex h-8 items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-[var(--pri)] bg-[var(--pri)] text-white shadow-xs'
                        : 'border-[var(--line)] text-[var(--tx)] hover:bg-[var(--line-subtle)]'
                    }`}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
            <div className="text-[11px] text-[var(--mut)] pt-1">
              Showing 1–20 · <span className="text-blue-500 font-semibold cursor-pointer">21–50</span>
            </div>
          </div>
        </div>

        {/* Options: If empty & Style */}
        <div className="mt-4 grid grid-cols-2 gap-4 pt-3 border-t border-[var(--line)]">
          <div>
            <label className="text-xs font-semibold text-[var(--mut)] block mb-1">If the slot is empty</label>
            <select
              value={ifEmpty}
              onChange={(e) => setIfEmpty(e.target.value)}
              className="h-8 w-full rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-2.5 text-xs text-[var(--tx)] focus:outline-none"
            >
              <option value="blank">Print nothing (blank)</option>
              <option value="hide">Hide field</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--mut)] block mb-1">Style</label>
            <label className="flex items-center gap-2 text-xs pt-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isBlackBox}
                onChange={(e) => setIsBlackBox(e.target.checked)}
                className="rounded text-[var(--pri)] focus:ring-0"
              />
              <span>White text on black box</span>
            </label>
          </div>
        </div>

        {/* Live Result Pill */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50/70 p-3 text-xs text-[var(--pri)] dark:bg-blue-950/40">
          <span>👁️</span>
          <span>
            Reads <strong>note{noteNumber}.field{subNumber}</strong> · canvas shows <strong>{previewKey}</strong>
            <br />
            With real data (piece 7): <strong>SO-24581-07</strong>
          </span>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between pt-3 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
          >
            <span>Remove mapping</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--tx)] hover:bg-[var(--line-subtle)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-[var(--pri)] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
