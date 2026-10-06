import { useState } from 'react'
import { Search, X, Keyboard } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function ShortcutsOverlay() {
  const open = useLabelStore((s) => s.showShortcuts)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const [search, setSearch] = useState('')

  if (!open) return null

  const toolsShortcuts = [
    { key: 'V', desc: 'Select' },
    { key: 'H', desc: 'Hand / pan' },
    { key: 'T', desc: 'Add text' },
    { key: 'B', desc: 'Add barcode' },
    { key: 'Q', desc: 'Add QR code' },
    { key: 'R', desc: 'Add rectangle' },
    { key: 'L', desc: 'Add line' },
  ]

  const editShortcuts = [
    { key: 'Ctrl C / V / X', desc: 'Copy · paste · cut' },
    { key: 'Ctrl D', desc: 'Duplicate' },
    { key: 'Delete', desc: 'Delete selection' },
    { key: 'Ctrl Z / Y', desc: 'Undo · redo' },
    { key: 'Ctrl G', desc: 'Group' },
    { key: 'Ctrl ⇧ G', desc: 'Ungroup' },
  ]

  const moveViewShortcuts = [
    { key: 'Arrows', desc: 'Nudge 0.1 mm' },
    { key: '⇧ Arrows', desc: 'Nudge 1 mm' },
    { key: 'Space + drag', desc: 'Pan canvas' },
    { key: 'Ctrl + wheel', desc: 'Zoom' },
    { key: 'Ctrl 0', desc: 'Fit to screen' },
    { key: 'Ctrl S', desc: 'Save' },
    { key: '?', desc: 'This help' },
  ]

  const filter = (list) =>
    list.filter(
      (s) =>
        s.key.toLowerCase().includes(search.toLowerCase()) ||
        s.desc.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none"
      onClick={() => setPrintConfig({ showShortcuts: false })}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0F172A] p-6 shadow-2xl text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Keyboard size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Keyboard shortcuts</h2>
              <p className="text-xs text-slate-400">Press ? any time to open this.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPrintConfig({ showShortcuts: false })}
            className="text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-2">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-700 bg-slate-900/80 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* 3 Groups Layout (screen 9.1 / shortcuts.png) */}
        <div className="mt-5 grid grid-cols-3 gap-6 text-xs">
          {/* Group 1: Tools */}
          <div>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tools
            </h3>
            <div className="space-y-2">
              {filter(toolsShortcuts).map((s) => (
                <div key={s.desc} className="flex items-center justify-between">
                  <span className="text-slate-300">{s.desc}</span>
                  <kbd className="rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Edit */}
          <div>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Edit
            </h3>
            <div className="space-y-2">
              {filter(editShortcuts).map((s) => (
                <div key={s.desc} className="flex items-center justify-between">
                  <span className="text-slate-300">{s.desc}</span>
                  <kbd className="rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Group 3: Move & View */}
          <div>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Move & view
            </h3>
            <div className="space-y-2">
              {filter(moveViewShortcuts).map((s) => (
                <div key={s.desc} className="flex items-center justify-between">
                  <span className="text-slate-300">{s.desc}</span>
                  <kbd className="rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
