import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, Database, Clock } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { catalogForClient } from '../data/fieldCatalog'

const RECENT_KEY = 'lc-recent-field-keys'
const GROUPS = [
  { id: 'piece', label: 'Piece' },
  { id: 'size', label: 'Size' },
  { id: 'production', label: 'Production' },
]

const SIZE_HINTS = ['dimension', 'width', 'height', 'area', 'thickness', 'size']
const PRODUCTION_HINTS = ['service', 'marks', 'weight', 'batch', 'glass', 'temper', 'edge', 'qty']

function groupFor(key) {
  const k = key.toLowerCase()
  if (SIZE_HINTS.some((h) => k.includes(h))) return 'size'
  if (PRODUCTION_HINTS.some((h) => k.includes(h))) return 'production'
  return 'piece'
}

function readRecent() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    return Array.isArray(raw) ? raw.filter((k) => typeof k === 'string') : []
  } catch {
    return []
  }
}

export default function FieldPickerModal() {
  const open = useLabelStore((s) => s.showFieldPicker)
  const callback = useLabelStore((s) => s.fieldPickerCallback)
  const client = useLabelStore((s) => s.client)
  const fieldCatalog = useLabelStore((s) => s.fieldCatalog)
  const catalog = useMemo(
    () => (client === 'erp' ? fieldCatalog || [] : catalogForClient('opti')),
    [client, fieldCatalog],
  )

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [recent, setRecent] = useState(readRecent)
  const inputRef = useRef(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter(
      (f) =>
        (f.label || '').toLowerCase().includes(q) || f.key.toLowerCase().includes(q),
    )
  }, [catalog, query])

  // Recently used keys are listed first and are always included when searching.
  const rows = useMemo(() => {
    const rest = filtered.filter((f) => !recent.includes(f.key))
    const recentFields = recent
      .map((k) => catalog.find((f) => f.key === k))
      .filter(Boolean)
      .filter((f) => !query || `${f.label} ${f.key}`.toLowerCase().includes(query.trim().toLowerCase()))
    return [...recentFields, ...rest]
  }, [filtered, recent, catalog, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    setRecent(readRecent())
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  const close = () => useLabelStore.setState({ showFieldPicker: false, fieldPickerCallback: null })

  const choose = (key) => {
    const next = [key, ...recent.filter((k) => k !== key)].slice(0, 3)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    callback?.(key)
    close()
  }

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min(i + 1, rows.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const row = rows[active]
        if (row) choose(row.key)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  if (!open) return null

  let lastGroup = null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.42)] p-4"
      onClick={close}
    >
      <div
        className="lc-modal !max-w-[520px] !max-h-[560px]"
        onClick={(e) => e.stopPropagation()}
        role="listbox"
        aria-label="Choose a field"
      >
        <div className="border-b border-[var(--line)] p-4">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mut)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fields…"
              className="lc-input !h-11 !pl-9"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2" role="presentation">
          {rows.length === 0 && (
            <p className="px-3 py-8 text-center text-[13px] text-[var(--mut)]">
              No field matches “{query}”.
            </p>
          )}

          {rows.map((f, i) => {
            const group = recent.slice(0, 3).includes(f.key) && i < 3 ? 'recent' : groupFor(f.key)
            const showHeading = group !== lastGroup
            lastGroup = group
            const isActive = i === active
            return (
              <div key={f.fieldKey || f.key}>
                {showHeading && (
                  <div className="flex items-center gap-1.5 px-3 pb-1 pt-3">
                    {group === 'recent' ? (
                      <Clock size={12} className="text-[var(--mut)]" />
                    ) : (
                      <Database size={12} className="text-[var(--mut)]" />
                    )}
                    <span className="lc-panel-title">
                      {group === 'recent' ? 'Recently used' : GROUPS.find((g) => g.id === group)?.label}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(f.key)}
                  className={`flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2 text-left transition-colors ${
                    isActive ? 'bg-[var(--pri-s)]' : 'hover:bg-[var(--bg)]'
                  }`}
                >
                  <Database size={14} className="flex-none text-[var(--mut)] opacity-70" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[var(--tx)]">
                      {f.label || f.key}
                    </span>
                    <span className="lc-mono block truncate text-[11.5px] text-[var(--mut)]">{f.key}</span>
                  </span>
                  {f.source === 'notes' && <span className="lc-badge lc-badge-warn flex-none">Note</span>}
                </button>
              </div>
            )
          })}
        </div>

        <div className="border-t border-[var(--line)] px-4 py-2.5">
          <p className="text-[11.5px] text-[var(--mut)]">
            ↑↓ to move · Enter to choose · 3 recently used shown first
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}