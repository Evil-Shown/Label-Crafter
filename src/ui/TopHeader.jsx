import { useRef } from 'react'
import {
  Maximize2,
  X,
  LayoutTemplate,
  Sun,
  Moon,
  FolderOpen,
  Save,
  Plus,
  Tag,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { IconButton } from './primitives'

export default function TopHeader() {
  const fileRef = useRef(null)

  const name = useLabelStore((s) => s.name)
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

  const marginKeys = [
    { key: 'left', label: 'L' },
    { key: 'right', label: 'R' },
    { key: 'top', label: 'T' },
    { key: 'bottom', label: 'B' },
  ]

  return (
    <header
      className="flex h-[52px] shrink-0 items-center justify-between border-b border-[var(--lc-panel-border)] bg-[var(--lc-toolbar-bg)] px-4 backdrop-blur-md"
      style={{ boxShadow: 'var(--lc-shadow-sm)' }}
    >
      {/* Brand + title */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
          <Tag size={15} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-none tracking-tight text-[var(--lc-text)]">
            Lable Crafter
          </h1>
          <p className="mt-0.5 max-w-[180px] truncate text-[10px] font-medium text-[var(--lc-text-muted)]">
            {name || 'Edit Label Layout'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal('showNewModal', true)}
          className="lc-btn lc-btn-outline ml-1 !py-1 !px-2.5 !text-xs"
        >
          <Plus size={13} />
          New
        </button>
      </div>

      {/* Margins chip group */}
      <div className="hidden items-center gap-2 lg:flex">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--lc-text-muted)]">
          Margins
        </span>
        <div className="lc-margin-group">
          {marginKeys.map(({ key, label }) => (
            <label key={key}>
              {label}
              <input
                type="number"
                step="0.5"
                value={margins?.[key] ?? 0}
                onChange={(e) => setMargins({ [key]: Number(e.target.value) })}
              />
            </label>
          ))}
          <span className="text-[10px] text-[var(--lc-text-muted)]">mm</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <IconButton
          icon={theme === 'dark' ? Sun : Moon}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          onClick={toggleTheme}
        />
        <div className="mx-1 h-5 w-px bg-[var(--lc-panel-border)]" />
        <IconButton icon={FolderOpen} title="Import JSON" onClick={() => fileRef.current?.click()} />
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleOpen} />
        <IconButton icon={Save} title="Export JSON" onClick={handleSave} />
        <div className="mx-1 h-5 w-px bg-[var(--lc-panel-border)]" />
        <button
          type="button"
          onClick={() => setModal('showNewModal', true)}
          className="lc-btn lc-btn-ghost !py-1.5 !px-2.5 !text-xs"
        >
          <LayoutTemplate size={14} />
          Templates
        </button>
        <IconButton icon={Maximize2} title="Fullscreen" onClick={toggleFullscreen} />
        <button
          type="button"
          onClick={() => {
            if (confirm('Exit label designer?')) window.close()
          }}
          className="lc-icon-btn hover:!bg-red-50 hover:!text-red-500 dark:hover:!bg-red-950/30"
          title="Close"
        >
          <X size={15} />
        </button>
      </div>
    </header>
  )
}
