import { useState, useEffect, useRef } from 'react'
import {
  Search,
  Database,
  ArrowRight,
  X,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { catalogForClient } from '../data/fieldCatalog'

export default function FieldPickerModal() {
  const isOpen = useLabelStore((s) => s.showFieldPicker)
  const client = useLabelStore((s) => s.client)
  const callback = useLabelStore((s) => s.fieldPickerCallback)
  const [query, setQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState('All')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  const catalog = catalogForClient(client)

  // Categorize
  const categorized = catalog.map((item) => {
    let group = 'Piece'
    const k = item.key.toLowerCase()
    if (k.includes('width') || k.includes('height') || k.includes('dim') || k.includes('area')) {
      group = 'Size'
    } else if (k.includes('opti') || k.includes('date') || k.includes('batch') || k.includes('trans')) {
      group = 'Production'
    }
    return { ...item, group }
  })

  const filtered = categorized.filter((item) => {
    const matchesGroup = activeGroup === 'All' || item.group === activeGroup
    const matchesSearch = item.label.toLowerCase().includes(query.toLowerCase()) ||
                          item.key.toLowerCase().includes(query.toLowerCase())
    return matchesGroup && matchesSearch
  })

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelect = (key) => {
    if (callback) callback(key)
    useLabelStore.setState({ showFieldPicker: false, fieldPickerCallback: null })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].key)
      }
    } else if (e.key === 'Escape') {
      useLabelStore.setState({ showFieldPicker: false, fieldPickerCallback: null })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none"
      onClick={() => useLabelStore.setState({ showFieldPicker: false, fieldPickerCallback: null })}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-3.5 shadow-2xl text-[var(--tx)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-[var(--mut)]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search fields (e.g. ord, dim)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            className="h-9 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] pl-9 pr-3 text-xs font-semibold text-[var(--tx)] placeholder:text-[var(--mut)] focus:border-[var(--pri)] focus:outline-none"
          />
        </div>

        {/* Group chips */}
        <div className="mt-2 flex items-center gap-1.5 border-b border-[var(--line)] pb-2 text-[11px] font-bold">
          {['All', 'Piece', 'Size', 'Production'].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setActiveGroup(g)
                setSelectedIndex(0)
              }}
              className={`rounded-md px-2 py-0.5 transition-all ${
                activeGroup === g
                  ? 'bg-blue-100 text-[var(--pri)] dark:bg-blue-950 dark:text-blue-300'
                  : 'text-[var(--mut)] hover:text-[var(--tx)]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* List of fields */}
        <div className="mt-2 max-h-72 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-[var(--mut)]">No matching fields found</div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = selectedIndex === idx
              return (
                <div
                  key={item.key}
                  onClick={() => handleSelect(item.key)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-[var(--pri)] font-semibold dark:bg-blue-950/60'
                      : 'hover:bg-[var(--line-subtle)] text-[var(--tx)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Database size={13} className="shrink-0 opacity-70" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-[var(--mut)]">
                    {item.key}
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Keyboard hints */}
        <div className="mt-2 pt-2 border-t border-[var(--line)] flex items-center justify-between text-[10px] text-[var(--mut)]">
          <span>↑↓ to move · Enter to choose</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  )
}
