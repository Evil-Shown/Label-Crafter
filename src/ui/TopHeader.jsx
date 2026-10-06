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
  FileCode,
  Maximize,
  Minimize,
  Eye,
  Cloud,
} from 'lucide-react'
import { useLabelStore, getTemplateFingerprint } from '../store/labelStore'
import { formatSize } from '../utils/units'
import BrandMark from './BrandMark'
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Box,
  Typography,
} from '@mui/material'

function StatusPill({ label, ok, onClick, title, btnRef }) {
  return (
    <Chip
      ref={btnRef}
      component="button"
      onClick={onClick}
      title={title}
      size="small"
      icon={
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: ok ? '#4caf50' : '#f44336',
            boxShadow: ok ? '0 0 6px #4caf50' : '0 0 6px #f44336',
          }}
        />
      }
      label={label}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        color: '#E2E8F0',
        fontWeight: 600,
        fontSize: '0.78rem',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.16)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
        },
        '& .MuiChip-icon': {
          marginLeft: '8px',
        },
      }}
    />
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

  const [popoverType, setPopoverType] = useState(null) // null | 'db' | 'print'
  const [popoverStyle, setPopoverStyle] = useState({ top: -9999, left: -9999 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const dbBtnRef = useRef(null)
  const printBtnRef = useRef(null)
  const popoverRef = useRef(null)

  // Position popover under whichever button was clicked
  useLayoutEffect(() => {
    if (!popoverType) return undefined
    const trigger = popoverType === 'db' ? dbBtnRef.current : printBtnRef.current
    if (!trigger) return undefined
    const place = () => {
      const r = trigger.getBoundingClientRect()
      if (!r) return
      const width = 360
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
  }, [popoverType])

  const hasUnsavedChanges = useLabelStore((s) => getTemplateFingerprint(s) !== s._savedSnapshot)
  const isDbOffline = dbStatus !== 'connected'

  useEffect(() => {
    if (!popoverType) return undefined
    const onDown = (e) => {
      // The popover lives in a portal, so trigger nodes must be checked.
      if (dbBtnRef.current?.contains(e.target)) return
      if (printBtnRef.current?.contains(e.target)) return
      if (popoverRef.current?.contains(e.target)) return
      setPopoverType(null)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setPopoverType(null)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [popoverType])

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
    <AppBar
      position="static"
      elevation={2}
      className="lc-top-header"
      sx={{
        height: 56,
        justifyContent: 'center',
        background: 'linear-gradient(90deg, var(--nav) 0%, var(--nav-end) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        px: { xs: 1.5, sm: 2 },
      }}
    >
      <Toolbar
        variant="dense"
        disableGutters
        sx={{
          minHeight: 56,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {/* 1. App title + subtitle + new template */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <Box
            sx={{
              display: 'flex',
              height: 36,
              width: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              bgcolor: '#FFFFFF',
              p: 0.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
            title="SPIL Label Designer"
          >
            <BrandMark size={26} className="h-full w-full" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, letterSpacing: '-0.01em' }}
            >
              Label Designer
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                display: 'block',
                color: 'var(--nav-ink)',
                fontWeight: 500,
                fontSize: '0.72rem',
                maxWidth: { xs: 120, sm: 180 },
              }}
              title={`${name} · ${formatSize(width, height)}`}
            >
              {name} · {formatSize(width, height)}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Plus size={14} />}
            onClick={() => setModal('showNewModal', true)}
            sx={{
              color: '#FFFFFF',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              fontSize: '0.78rem',
              fontWeight: 700,
              py: 0.4,
              px: 1.2,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                borderColor: 'rgba(255, 255, 255, 0.4)',
              },
            }}
          >
            New
          </Button>
        </Box>

        {/* 2. Material Tabs */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.25)',
            p: 0.5,
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Tabs
            value={tabs.findIndex((t) => t.id === activeTab)}
            onChange={(_, idx) => setActiveTab(tabs[idx].id)}
            sx={{
              minHeight: 32,
              '& .MuiTabs-indicator': {
                backgroundColor: '#90CAF9',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            {tabs.map(({ id, label, Icon }) => (
              <Tab
                key={id}
                icon={<Icon size={15} />}
                iconPosition="start"
                label={<span className="hidden sm:inline">{label}</span>}
                sx={{
                  minHeight: 32,
                  minWidth: { xs: 40, sm: 84 },
                  py: 0.5,
                  px: 1.5,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--nav-ink)',
                  textTransform: 'none',
                  borderRadius: 1.5,
                  transition: 'all 0.15s ease',
                  '&.Mui-selected': {
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  },
                  '&:hover': {
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2.5">
        {hasUnsavedChanges && (
          <div className="hidden xl:flex flex-none items-center gap-1.5 text-[12px] font-semibold text-[#FBBF24]">
            <CircleAlert size={14} />
            <span>Unsaved</span>
          </div>
        )}

        {/* 3. Opti / ERP switch */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.25)',
            p: 0.4,
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            flexShrink: 0,
          }}
        >
          {['opti', 'erp'].map((c) => {
            const on = client === c
            return (
              <Button
                key={c}
                size="small"
                onClick={() => setClient(c)}
                sx={{
                  minWidth: 46,
                  py: 0.3,
                  px: 1.2,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: 1.5,
                  color: on ? '#FFFFFF' : 'var(--nav-ink)',
                  bgcolor: on ? (c === 'opti' ? 'var(--pri)' : 'var(--erp)') : 'transparent',
                  boxShadow: on ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                  '&:hover': {
                    bgcolor: on ? (c === 'opti' ? 'var(--pri-hover)' : 'var(--erp-hover)') : 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                  },
                }}
              >
                {c === 'opti' ? 'Opti' : 'ERP'}
              </Button>
            )
          })}
        </Box>

        {/* 4. Status dots with dedicated details dropdown */}
        <div className="relative flex flex-none items-center gap-1.5">
          <StatusPill
            btnRef={dbBtnRef}
            label="Database"
            ok={!isDbOffline}
            onClick={() => setPopoverType((curr) => (curr === 'db' ? null : 'db'))}
            title="Database connection details"
          />
          <StatusPill
            btnRef={printBtnRef}
            label="Print service"
            ok={printServiceStatus === 'connected'}
            onClick={() => setPopoverType((curr) => (curr === 'print' ? null : 'print'))}
            title="Print service connection details"
          />

          {/* Rendered in a portal: the header is a scroll container, so an
              absolutely-positioned popover would be clipped by it. */}
          {popoverType &&
            createPortal(
              <div
                ref={popoverRef}
                className="lc-pop fixed z-[70] w-[360px] p-3.5 shadow-2xl"
                style={popoverStyle}
              >
                {popoverType === 'db' ? (
                  <>
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <Database size={15} className="text-[var(--mut)]" />
                        <span className="lc-dialog-title !text-[13px]">Database connection</span>
                      </div>
                      <button
                        type="button"
                        className="lc-icon-btn !h-6 !w-6"
                        onClick={() => setPopoverType(null)}
                        title="Close"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="mt-1 flex items-start justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <div className="lc-mono text-[12.5px] font-semibold text-[var(--tx)]">
                          {dbServer ? `${dbServer}${dbDatabase ? ` · ${dbDatabase}` : ''}` : 'Not configured'}
                        </div>
                        {dbServer ? (
                          <div className="mt-0.5 text-[11.5px] text-[var(--mut)]">
                            Last checked: {sinceLabel(dbLastOkAt)}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setPopoverType(null)
                              setActiveTab('settings')
                            }}
                            className="mt-1 inline-block text-[11.5px] font-medium text-[var(--brand)] hover:underline"
                          >
                            Configure in Settings →
                          </button>
                        )}
                      </div>
                      <span className={`lc-connection-status ${!dbServer ? 'is-offline' : isDbOffline ? 'is-offline' : 'is-online'}`}>
                        {!dbServer ? 'Unconfigured' : isDbOffline ? 'Offline' : 'Connected'}
                      </span>
                    </div>

                    <div className="lc-divider my-2" />

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPopoverType(null)
                          setActiveTab('settings')
                        }}
                        className="text-[11.5px] font-medium text-[var(--mut)] hover:text-[var(--tx)]"
                      >
                        Open settings
                      </button>
                      <button
                        type="button"
                        className="lc-btn lc-btn-secondary lc-btn-sm flex-none"
                        onClick={() => {
                          checkServiceHealth?.()
                          addToast({ message: 'Testing database connection…', type: 'info' })
                        }}
                      >
                        Test / Retry
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <Printer size={15} className="text-[var(--mut)]" />
                        <span className="lc-dialog-title !text-[13px]">Print service connection</span>
                      </div>
                      <button
                        type="button"
                        className="lc-icon-btn !h-6 !w-6"
                        onClick={() => setPopoverType(null)}
                        title="Close"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="mt-1 flex items-start justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <div className="lc-mono text-[12.5px] font-semibold text-[var(--tx)]">
                          {serviceHost}
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-[var(--mut)]">
                          Last checked: {printServiceStatus === 'connected' ? 'just now' : sinceLabel(printServiceLastOkAt)}
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

                    <p className="mt-1 text-[11.5px] leading-snug text-[var(--mut)]">
                      Check that the service “SPIL Label Print” is running on this PC.
                    </p>

                    <div className="lc-divider my-2" />

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPopoverType(null)
                          setActiveTab('settings')
                        }}
                        className="text-[11.5px] font-medium text-[var(--mut)] hover:text-[var(--tx)]"
                      >
                        Configure service
                      </button>
                      <button
                        type="button"
                        className="lc-btn lc-btn-secondary lc-btn-sm flex-none"
                        onClick={() => {
                          checkServiceHealth?.()
                          addToast({ message: 'Checking print service…', type: 'info' })
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  </>
                )}
              </div>,
              document.body,
            )}
        </div>

        {/* Utility IconButtons with Tooltips */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <input
            type="file"
            id="header-import-json"
            accept=".json"
            className="hidden"
            onChange={handleImportJson}
          />
          <Tooltip title="Import template JSON" arrow>
            <IconButton
              size="small"
              onClick={() => document.getElementById('header-import-json')?.click()}
              sx={{ color: '#C7D6E8', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' } }}
            >
              <FolderOpen size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import OIF project & create template" arrow>
            <IconButton
              size="small"
              onClick={() => setModal('showOifImportModal', true)}
              sx={{ color: '#C7D6E8', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' } }}
            >
              <FileCode size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download template JSON" arrow>
            <IconButton
              size="small"
              onClick={handleExportJson}
              sx={{ color: '#C7D6E8', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' } }}
            >
              <FileDown size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Live host preview" arrow>
            <IconButton
              size="small"
              onClick={() => setPrintConfig({ showBatchPreview: true })}
              sx={{ color: '#C7D6E8', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' } }}
            >
              <Eye size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Template library sync" arrow>
            <IconButton
              size="small"
              onClick={() => setModal('showServerLibrary', true)}
              sx={{ color: '#C7D6E8', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' } }}
            >
              <Cloud size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? 'Exit full screen' : 'Full screen (F11)'} arrow>
            <IconButton
              size="small"
              onClick={toggleFullscreen}
              sx={{ color: '#C7D6E8', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' } }}
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </IconButton>
          </Tooltip>
          <Tooltip title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} arrow>
            <IconButton
              size="small"
              onClick={toggleTheme}
              sx={{ color: '#C7D6E8', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' } }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Keyboard shortcuts (?)" arrow>
            <IconButton
              size="small"
              onClick={() => setPrintConfig({ showShortcuts: true })}
              sx={{ color: '#C7D6E8', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' } }}
            >
              <Keyboard size={16} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Export Button */}
        <Button
          variant="outlined"
          size="small"
          onClick={() => useLabelStore.setState({ showExportDialog: true })}
          sx={{
            color: '#FFFFFF',
            borderColor: 'rgba(255, 255, 255, 0.25)',
            bgcolor: 'rgba(255, 255, 255, 0.08)',
            fontWeight: 600,
            fontSize: '0.8rem',
            py: 0.5,
            px: 1.5,
            borderRadius: 2,
            flexShrink: 0,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.16)',
              borderColor: 'rgba(255, 255, 255, 0.4)',
            },
          }}
        >
          Export
        </Button>

        {/* 5. Save Button (Material Contained with Elevation) */}
        <Button
          variant="contained"
          size="small"
          startIcon={<SaveIcon size={15} />}
          disabled={isDbOffline}
          onClick={handleSave}
          color="success"
          sx={{
            fontWeight: 700,
            fontSize: '0.82rem',
            py: 0.5,
            px: 2,
            borderRadius: 2,
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(46, 125, 50, 0.35)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.5)',
            },
          }}
        >
          Save
        </Button>
      </div>
    </Toolbar>
  </AppBar>
  )
}
