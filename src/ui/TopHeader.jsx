import {
  Maximize2,
  X,
  LayoutTemplate,
  Sun,
  Moon,
  FolderOpen,
  Save,
  Plus,
  Grid2x2,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { IconButton } from './primitives'

export default function TopHeader() {
  const name = useLabelStore((s) => s.name)
  const margins = useLabelStore((s) => s.margins)
  const setMargins = useLabelStore((s) => s.setMargins)
  const theme = useLabelStore((s) => s.theme)
  const toggleTheme = useLabelStore((s) => s.toggleTheme)
  const setModal = useLabelStore((s) => s.setModal)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const pickAndImportJsonFile = useLabelStore((s) => s.pickAndImportJsonFile)
  const exportCurrentTemplateJson = useLabelStore((s) => s.exportCurrentTemplateJson)

  const marginKeys = [
    { key: 'left', label: 'L' },
    { key: 'right', label: 'R' },
    { key: 'top', label: 'T' },
    { key: 'bottom', label: 'B' },
  ]

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <header
      className="lc-top-header flex h-[64px] shrink-0 items-center justify-between border-b border-[var(--lc-panel-border)] bg-[var(--lc-toolbar-bg)] px-5 backdrop-blur-md"
      style={{ boxShadow: 'var(--lc-shadow-sm)' }}
    >
      <div className="flex items-center gap-3">
        <div className="lc-brand-mark flex h-10 w-10 items-center justify-center rounded-xl shadow-md">
          <img src="/crafter-mark.png" alt="" className="lc-brand-image" />
        </div>
        <div>
          <h1 className="text-[15px] font-extrabold leading-none tracking-tight text-[var(--lc-text)]">Label Crafter</h1>
          <p className="mt-0.5 max-w-[180px] truncate text-[10px] font-medium text-[var(--lc-text-muted)]">
            {name || 'Precision label studio'}
          </p>
        </div>
        <button type="button" onClick={() => setModal('showNewModal', true)} className="lc-btn lc-btn-outline ml-1 !py-1 !px-2.5 !text-xs">
          <Plus size={13} /> New
        </button>
      </div>

      <div className="hidden items-center gap-2 lg:flex">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--lc-text-muted)]">Margins</span>
        <div className="lc-margin-group">
          {marginKeys.map(({ key, label }) => (
            <label key={key}>
              {label}
              <input type="number" step="0.5" value={margins?.[key] ?? 0} onChange={(e) => setMargins({ [key]: Number(e.target.value) })} />
            </label>
          ))}
          <span className="text-[10px] text-[var(--lc-text-muted)]">mm</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <IconButton icon={theme === 'dark' ? Sun : Moon} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={toggleTheme} />
        <div className="mx-1 h-5 w-px bg-[var(--lc-panel-border)]" />
        <IconButton icon={FolderOpen} title="Import JSON" onClick={pickAndImportJsonFile} />
        <IconButton icon={Save} title="Export JSON" onClick={exportCurrentTemplateJson} />
        <div className="mx-1 h-5 w-px bg-[var(--lc-panel-border)]" />
        <button type="button" onClick={() => setPrintConfig({ showTemplateGallery: true })} className="lc-btn lc-btn-ghost !py-1.5 !px-2.5 !text-xs">
          <LayoutTemplate size={14} /> Gallery
        </button>
        <button type="button" onClick={() => setPrintConfig({ showBatchPreview: true })} className="lc-btn lc-btn-ghost !py-1.5 !px-2.5 !text-xs">
          <Grid2x2 size={14} /> Batch
        </button>
        <IconButton icon={Maximize2} title="Fullscreen" onClick={toggleFullscreen} />
        <button
          type="button"
          onClick={() => { if (confirm('Exit label designer?')) window.close() }}
          className="lc-icon-btn hover:!bg-red-50 hover:!text-red-500 dark:hover:!bg-red-950/30"
          title="Close"
        >
          <X size={15} />
        </button>
      </div>
    </header>
  )
}
