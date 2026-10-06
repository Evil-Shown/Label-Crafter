import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Keyboard, X, Search } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

const GROUPS = [
  {
    id: 'tools',
    label: 'Tools',
    rows: [
      ['V', 'Select'],
      ['H', 'Pan the canvas'],
      ['T', 'Add text'],
      ['B', 'Add barcode'],
      ['Q', 'Add QR code'],
      ['C', 'Add checkbox'],
      ['L', 'Add line'],
      ['R', 'Add shape'],
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    rows: [
      ['Ctrl + S', 'Save to the database'],
      ['Ctrl + Z', 'Undo'],
      ['Ctrl + Y', 'Redo'],
      ['Ctrl + C', 'Copy'],
      ['Ctrl + X', 'Cut'],
      ['Ctrl + V', 'Paste'],
      ['Ctrl + D', 'Duplicate'],
      ['Delete', 'Delete the selected element'],
    ],
  },
  {
    id: 'move',
    label: 'Move and view',
    rows: [
      ['← → ↑ ↓', 'Nudge 0.1 mm'],
      ['Shift + ← → ↑ ↓', 'Nudge 1 mm'],
      ['Ctrl + wheel', 'Zoom in and out'],
      ['Ctrl + 0', 'Fit the label to the window'],
      ['Space + drag', 'Pan'],
      ['?', 'Show or hide this list'],
    ],
  },
]

export default function ShortcutsOverlay() {
  const open = useLabelStore((s) => s.showShortcuts)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    setQuery('')
    const onKey = (e) => {
      if (e.key === 'Escape') setPrintConfig({ showShortcuts: false })
    }
    window.addEventListener('keydown', onKey)
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(t)
    }
  }, [open, setPrintConfig])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return GROUPS
    return GROUPS.map((g) => ({
      ...g,
      rows: g.rows.filter(
        ([k, l]) => l.toLowerCase().includes(q) || k.toLowerCase().includes(q),
      ),
    })).filter((g) => g.rows.length)
  }, [query])

  if (!open) return null

  return createPortal(
    /* Shown in dark mode on purpose — spec §9.1 */
    <div className="lc-modal-overlay" onClick={() => setPrintConfig({ showShortcuts: false })}>
      <div
        className="lc-modal !max-w-[780px] !max-h-[80vh] !border-[#243049] !bg-[#0F172A] !text-[#E6EDF7]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <div className="flex items-center gap-3 border-b border-[#243049] px-6 py-4">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-[#1B2B45] text-[#93C5FD]">
            <Keyboard size={18} />
          </span>
          <h2 className="lc-dialog-title flex-1 !text-[#E6EDF7]">Keyboard shortcuts</h2>
          <button
            type="button"
            className="lc-icon-btn !text-[#93A3BB] hover:!bg-white/10 hover:!text-white"
            onClick={() => setPrintConfig({ showShortcuts: false })}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shortcuts…"
              className="!h-11 !w-full !rounded-[10px] !border-[#243049] !bg-[#111C2E] !pl-9 !text-[13px] !text-[#E6EDF7] placeholder:!text-[#64748B] focus:!border-[#3B82F6] focus:!shadow-none"
            />
          </div>
        </div>

        <div className="grid gap-12 overflow-y-auto px-6 py-5 sm:grid-cols-3">
          {filtered.map((g) => (
            <section key={g.id}>
              <h3 className="mb-2 text-[13px] font-bold text-[#93C5FD]">{g.label}</h3>
              <ul>
                {g.rows.map(([k, label]) => (
                  <li
                    key={k + label}
                    className="flex items-center justify-between gap-3 border-b border-[#1C2739] py-2 last:border-b-0"
                  >
                    <span className="font-[var(--mono)] text-[12px] text-[#93A3BB]">{k}</span>
                    <span className="text-right text-[13px] text-[#E6EDF7]">{label}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-8 text-center text-[13px] text-[#64748B]">
              Nothing matches “{query}”.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}