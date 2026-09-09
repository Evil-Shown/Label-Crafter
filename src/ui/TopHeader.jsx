import { useRef } from 'react'
import {
  Maximize2,
  X,
  ListOrdered,
  Sun,
  Moon,
  FolderOpen,
  Save,
  PlusCircle,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function TopHeader() {
  const fileRef = useRef(null)

  const margins = useLabelStore((s) => s.margins)
  const setMargins = useLabelStore((s) => s.setMargins)
  const theme = useLabelStore((s) => s.theme)
  const toggleTheme = useLabelStore((s) => s.toggleTheme)
  const setModal = useLabelStore((s) => s.setModal)
  const importTemplate = useLabelStore((s) => s.importTemplate)
  const exportTemplate = useLabelStore((s) => s.exportTemplate)

  const handleOpen = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importTemplate(reader.result)
      } catch (err) {
        alert(`Import failed: ${err.message}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSave = () => {
    const json = exportTemplate()
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${json.id || 'label'}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--lc-panel-border)] bg-[var(--lc-panel)] px-5">
      {/* Left Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold tracking-tight text-[var(--lc-text)]">
          Edit Label Layout
        </h1>
        <button
          type="button"
          onClick={() => setModal('showNewModal', true)}
          className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400"
          title="Create New Blank Label Template"
        >
          <PlusCircle size={14} />
          New
        </button>
      </div>

      {/* Middle Margins Readout */}
      <div className="flex items-center gap-2 text-xs font-medium text-[var(--lc-text-muted)]">
        <span>Margin (mm):</span>
        <div className="flex items-center gap-1">
          <span className="text-[var(--lc-text)]">L:</span>
          <input
            type="number"
            step="0.5"
            value={margins?.left ?? 0}
            onChange={(e) => setMargins({ left: Number(e.target.value) })}
            className="lc-input h-7 w-12 px-1 text-center"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[var(--lc-text)]">R:</span>
          <input
            type="number"
            step="0.5"
            value={margins?.right ?? 0}
            onChange={(e) => setMargins({ right: Number(e.target.value) })}
            className="lc-input h-7 w-12 px-1 text-center"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[var(--lc-text)]">T:</span>
          <input
            type="number"
            step="0.5"
            value={margins?.top ?? 0}
            onChange={(e) => setMargins({ top: Number(e.target.value) })}
            className="lc-input h-7 w-12 px-1 text-center"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[var(--lc-text)]">B:</span>
          <input
            type="number"
            step="0.5"
            value={margins?.bottom ?? 0}
            onChange={(e) => setMargins({ bottom: Number(e.target.value) })}
            className="lc-input h-7 w-12 px-1 text-center"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--lc-panel-border)] text-[var(--lc-text-muted)] hover:bg-slate-100 hover:text-[var(--lc-text)] dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Import JSON */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Import JSON template"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--lc-panel-border)] text-[var(--lc-text-muted)] hover:bg-slate-100 hover:text-[var(--lc-text)] dark:hover:bg-slate-800"
        >
          <FolderOpen size={15} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleOpen}
        />

        {/* Save JSON */}
        <button
          type="button"
          onClick={handleSave}
          title="Export JSON template"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--lc-panel-border)] text-[var(--lc-text-muted)] hover:bg-slate-100 hover:text-[var(--lc-text)] dark:hover:bg-slate-800"
        >
          <Save size={15} />
        </button>

        {/* Manage Templates link matching screenshot */}
        <button
          type="button"
          onClick={() => setModal('showNewModal', true)}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-[var(--lc-text-muted)] hover:text-blue-600 dark:hover:text-blue-400"
        >
          <ListOrdered size={15} />
          Manage Templates
        </button>

        {/* Fullscreen icon button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--lc-text-muted)] hover:bg-slate-100 hover:text-[var(--lc-text)] dark:hover:bg-slate-800"
        >
          <Maximize2 size={15} />
        </button>

        {/* Close button */}
        <button
          type="button"
          onClick={() => {
            if (confirm('Exit label designer? Unsaved changes will be discarded.')) {
              window.close()
            }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--lc-panel-border)] text-[var(--lc-text-muted)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
          title="Close Designer"
        >
          <X size={16} />
        </button>
      </div>
    </header>
  )
}
