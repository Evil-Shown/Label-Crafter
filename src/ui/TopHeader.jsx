import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Tag,
  PenTool,
  LayoutGrid,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Keyboard,
  Save as SaveIcon,
  CircleAlert,
  Database,
  Printer,
  X,
  Plus,
  FolderOpen,
  FileDown,
  Maximize,
  Minimize,
  Eye,
  Cloud,
} from 'lucide-react'
import { useLabelStore, getTemplateFingerprint } from '../store/labelStore'
import appIcon from '../assets/app_icon.png'
import { formatSize } from '../utils/units'

function StatusPill({ label, ok, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[12.5px] font-semibold text-[#D6E2F0] transition-colors hover:bg-white/14"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-[#22C55E]' : 'bg-[#F87171]'}`} />
      {label}
    </button>
  )
}

export default function TopHeader() {
  const name = useLabelStore((s) => s.name)
  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)
  const activeTab = useLabelStore((s) => s.activeTab)
  const setActiveTab = useLabelStore((s) => s.setActiveTab)
  const client = useLabelStore((s) => s.client)
  const setClient = useLabelStore((s) => s.setClient)
  const dbStatus = useLabelStore((s) => s.dbStatus)
  const dbServer = useLabelStore((s) => s.dbServer)
  const dbDatabase = useLabelStore((s) => s.dbDatabase)
  const printServiceStatus = useLabelStore((s) => s.printServiceStatus)
  const printServiceUrl = useLabelStore((s) => s.printServiceUrl)
  const theme = useLabelStore((s) => s.theme)
  const toggleTheme = useLabelStore((s) => s.toggleTheme)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const setModal = useLabelStore((s) => s.setModal)
  const saveToLibrary = useLabelStore((s) => s.saveToLibrary)
  const saveToDesignService = useLabelStore((s) => s.saveToDesignService)
  const saveToHost = useLabelStore((s) => s.saveToHost)
  const exportTemplate = useLabelStore((s) => s.exportTemplate)
  const designSession = useLabelStore((s) => s.designSession)
  const hostedInApp = useLabelStore((s) => s.hostedInApp)
  const addToast = useLabelStore((s) => s.addToast)
  const setTemplateMeta = useLabelStore((s) => s.setTemplateMeta)
  const dbLastOkAt = useLabelStore((s) => s.dbLastOkAt)
  const printServiceLastOkAt = useLabelStore((s) => s.printServiceLastOkAt)
  const checkServiceHealth = useLabelStore((s) => s.checkServiceHealth)

  const [showStatusPopover, setShowStatusPopover] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState({ top: -9999, left: -9999 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const statusRef = useRef(null)
  const popoverRef = useRef(null)

  // The header is a horizontal scroll container, so the popover is portalled to
  // <body> and positioned in viewport coordinates to stay fully visible.
  useLayoutEffect(() => {
    if (!showStatusPopover || !statusRef.current) return undefined
    const place = () => {
      const r = statusRef.current?.getBoundingClientRect()
      if (!r) return
      const width = 408
      const gap = 8
      const left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8))
      setPopoverStyle({ top: r.bottom + gap, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [showStatusPopover])

  const hasUnsavedChanges = useLabelStore((s) => getTemplateFingerprint(s) !== s._savedSnapshot)
  const isDbOffline = dbStatus !== 'connected'

  useEffect(() => {
    if (!showStatusPopover) return undefined
    const onDown = (e) => {
      // The popover lives in a portal, so both nodes must be checked.
      if (statusRef.current?.contains(e.target)) return
      if (popoverRef.current?.contains(e.target)) return
      setShowStatusPopover(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setShowStatusPopover(false)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [showStatusPopover])

  const sinceLabel = (ts) => {
    if (!ts) return 'not checked yet'
    const mins = Math.round((Date.now() - ts) / 60000)
    if (mins < 1) return 'just now'
    if (mins === 1) return '1 min ago'
    return `${mins} min ago`
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  const downloadJson = (data, fileName) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportJson = () => {
    try {
      downloadJson(exportTemplate(), `${name.replace(/\s+/g, '_')}_template.json`)
      addToast({ message: 'Template JSON downloaded', type: 'success' })
    } catch (e) {
      addToast({ message: 'Export failed: ' + e.message, type: 'error' })
    }
  }

  const handleImportJson = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result)
        useLabelStore.getState().importTemplate(json)
        addToast({ message: `Imported template "${json.name || file.name}"`, type: 'success' })
      } catch {
        addToast({ message: 'Invalid template JSON file', type: 'error' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSave = () => {
    if (isDbOffline) {
      addToast({ message: 'Read-only: the database is offline, so saving is paused.', type: 'warning' })
      return
    }
    if (designSession) {
      saveToDesignService().catch((err) =>
        addToast({ message: err.message || 'Save failed', type: 'error' })
      )
    } else if (hostedInApp || (window.parent && window.parent !== window)) {
      saveToHost()
    } else {
      saveToLibrary()
    }
  }

  const tabs = [
    { id: 'design', label: 'Design', Icon: PenTool },
    { id: 'templates', label: 'Templates', Icon: LayoutGrid },
    { id: 'settings', label: 'Settings', Icon: SettingsIcon },
  ]

  const serviceHost = (() => {
    try {
      return new URL(printServiceUrl).host
    } catch {
      return printServiceUrl
    }
  })()

  return (
    <header className="lc-top-header flex h-14 shrink-0 items-center justify-between gap-2 overflow-visible px-3 sm:px-4 text-white select-none">
      {/* 1. App title + subtitle + new template */}
      <div className="flex flex-none items-center gap-2.5">
        <button
          type="button"
          onClick={() => useLabelStore.setState({ showSplashScreen: true })}
          title="Click to replay startup opening splash screen"
          className="flex h-8 w-8 sm:h-9 sm:w-9 flex-none items-center justify-center rounded-[10px] overflow-hidden shadow-sm ring-1 ring-white/20 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <img src={appIcon} alt="App Icon" className="h-full w-full object-cover scale-105" />
        </button>
        <div className="min-w-0">
          <span className="block text-[14px] sm:text-[15px] font-bold leading-tight text-white tracking-tight">
            Label Designer
          </span>
          <p className="truncate text-[10.5px] sm:text-[11px] font-medium text-[var(--nav-ink)] max-w-[130px] sm:max-w-[200px]" title={`${name} · ${formatSize(width, height)}`}>
            {name} · {formatSize(width, height)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModal('showNewModal', true)}
          className="ml-0.5 sm:ml-1 flex flex-none items-center gap-1 sm:gap-1.5 rounded-[7px] border border-white/20 bg-white/10 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[11.5px] sm:text-[12.5px] font-semibold text-white transition-colors hover:bg-white/18"
          title="Create a new template"
        >
          <Plus size={13} />
          <span>New</span>
        </button>
      </div>

      {/* 2. Text tabs */}
      <nav className="flex flex-none items-center gap-0.5 sm:gap-1 rounded-[10px] border border-white/10 bg-black/25 p-0.5 sm:p-1">
        {tabs.map(({ id, label, Icon }) => {
          const on = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1 sm:gap-1.5 rounded-[7px] px-2.5 sm:px-3 py-1 sm:py-1.5 text-[12px] sm:text-[13px] font-semibold transition-colors ${
                on ? 'bg-white/16 text-white' : 'text-[var(--nav-ink)] hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2.5">
        {hasUnsavedChanges && (
          <div className="hidden xl:flex flex-none items-center gap-1.5 text-[12px] font-semibold text-[#FBBF24]">
            <CircleAlert size={14} />
            <span>Unsaved</span>
          </div>
        )}

        {/* 3. Opti / ERP switch */}
        <div className="flex flex-none items-center rounded-[8px] sm:rounded-[10px] border border-white/10 bg-black/25 p-0.5 sm:p-1">
          {['opti', 'erp'].map((c) => {
            const on = client === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setClient(c)}
                className={`rounded-[7px] px-3.5 py-1 text-[13px] font-bold transition-colors ${
                  on
                    ? c === 'opti'
                      ? 'bg-[var(--pri)] text-white'
                      : 'bg-[var(--erp)] text-white'
                    : 'text-[var(--nav-ink)] hover:text-white'
                }`}
              >
                {c === 'opti' ? 'Opti' : 'ERP'}
              </button>
            )
          })}
        </div>

        {/* 4. Status dots with details popover */}
        <div className="relative flex flex-none" ref={statusRef}>
          <div className="flex items-center gap-1.5">
            <StatusPill
              label="Database"
              ok={!isDbOffline}
              onClick={() => setShowStatusPopover((v) => !v)}
              title="Database connection details"
            />
            <StatusPill
              label="Print service"
              ok={printServiceStatus === 'connected'}
              onClick={() => setShowStatusPopover((v) => !v)}
              title="Print service connection details"
            />
          </div>

          {/* Rendered in a portal: the header is a scroll container, so an
              absolutely-positioned popover would be clipped by it. */}
          {showStatusPopover &&
            createPortal(
              <div
                ref={popoverRef}
                className="lc-pop fixed z-[70] w-[408px] p-3"
                style={popoverStyle}
              >
              <div className="flex items-center justify-between pb-2">
                <span className="lc-dialog-title !text-[13px]">Connection status</span>
                <button
                  type="button"
                  className="lc-icon-btn !h-6 !w-6"
                  onClick={() => setShowStatusPopover(false)}
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="mt-1 flex items-start justify-between gap-3 py-2">
                <div className="flex min-w-0 items-start gap-2">
                  <Database size={15} className="mt-0.5 flex-none text-[var(--mut)]" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[var(--tx)]">Database</div>
                    <div className="lc-mono truncate text-[11.5px] text-[var(--mut)]">
                      {dbServer} · {dbDatabase}
                    </div>
                    <div className="text-[11.5px] text-[var(--mut)]">Last OK {sinceLabel(dbLastOkAt)}</div>
                  </div>
                </div>
                <span className={`lc-connection-status ${isDbOffline ? 'is-offline' : 'is-online'}`}>
                  {isDbOffline ? 'Offline' : 'Connected'}
                </span>
              </div>

              <div className="lc-divider" />

              <div className="flex items-start justify-between gap-3 py-2">
                <div className="flex min-w-0 items-start gap-2">
                  <Printer size={15} className="mt-0.5 flex-none text-[var(--mut)]" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[var(--tx)]">Print service</div>
                    <div className="lc-mono truncate text-[11.5px] text-[var(--mut)]">{serviceHost}</div>
                    <div className="text-[11.5px] text-[var(--mut)]">
                      Last OK {printServiceStatus === 'connected' ? 'just now' : sinceLabel(printServiceLastOkAt)}
                    </div>
                  </div>
                </div>
                <span
                  className={`lc-connection-status ${
                    printServiceStatus === 'connected' ? 'is-online' : 'is-offline'
                  }`}
                >
                  {printServiceStatus === 'connected' ? 'Connected' : 'Unreachable'}
                </span>
              </div>

              <div className="lc-divider" />

              <div className="flex items-center justify-between gap-2 pt-2">
                <p className="text-[11.5px] leading-snug text-[var(--mut)]">
                  Check that the service “SPIL Label Print” is running on this PC.
                </p>
                <button
                  type="button"
                  className="lc-btn lc-btn-secondary lc-btn-sm flex-none"
                  onClick={() => {
                    checkServiceHealth?.()
                    addToast({ message: 'Checking connections…', type: 'info' })
                  }}
                >
                  Retry
                </button>
              </div>
              </div>,
              document.body,
            )}
        </div>

        {/* Utility icon-only actions (universal actions, tooltiped per §1.4) */}
        <div className="flex flex-none items-center gap-1">
          <input
            type="file"
            id="header-import-json"
            accept=".json"
            className="hidden"
            onChange={handleImportJson}
          />
          <button
            type="button"
            onClick={() => document.getElementById('header-import-json')?.click()}
            className="lc-icon-btn !text-[#C7D6E8] hover:!bg-white/12 hover:!text-white"
            title="Import template JSON"
          >
            <FolderOpen size={16} />
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="lc-icon-btn !text-[#C7D6E8] hover:!bg-white/12 hover:!text-white"
            title="Download template JSON"
          >
            <FileDown size={16} />
          </button>
          <button
            type="button"
            onClick={() => setPrintConfig({ showBatchPreview: true })}
            className="lc-icon-btn !text-[#C7D6E8] hover:!bg-white/12 hover:!text-white"
            title="Live host preview"
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            onClick={() => setModal('showServerLibrary', true)}
            className="lc-icon-btn !text-[#C7D6E8] hover:!bg-white/12 hover:!text-white"
            title="Template library sync"
          >
            <Cloud size={16} />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="lc-icon-btn !text-[#C7D6E8] hover:!bg-white/12 hover:!text-white"
            title={isFullscreen ? 'Exit full screen' : 'Full screen (F11)'}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="lc-icon-btn !text-[#C7D6E8] hover:!bg-white/12 hover:!text-white"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setPrintConfig({ showShortcuts: true })}
            className="lc-icon-btn !text-[#C7D6E8] hover:!bg-white/12 hover:!text-white"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => useLabelStore.setState({ showExportDialog: true })}
          className="lc-btn flex-none border-white/18 bg-white/10 text-white hover:bg-white/18"
        >
          Export
        </button>

        {/* 5. Save */}
        <button
          type="button"
          disabled={isDbOffline}
          onClick={handleSave}
          className={`lc-btn flex-none ${
            isDbOffline
              ? 'border-white/20 bg-white/8 text-[#9FB3CA]'
              : 'border-[var(--ok)] bg-[var(--ok)] text-white hover:border-[#15803D] hover:bg-[#15803D]'
          }`}
          title={
            isDbOffline
              ? 'Read-only: the database is offline, so saving is paused'
              : 'Save template to the shared database (Ctrl+S)'
          }
        >
          <SaveIcon size={15} />
          <span>Save</span>
        </button>
      </div>
    </header>
  )
}
