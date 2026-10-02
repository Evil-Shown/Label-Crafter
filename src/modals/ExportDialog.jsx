import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X, FileText, Image as ImageIcon, FileCode, Download, FolderOpen } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { useEscape } from '../hooks/useEscape'
import { renderLabelToCanvas, exportPdf, exportPng, downloadTextFile } from '../utils/export'
import { compileLabel } from '../services/printService'
import { buildExportTemplate } from '../utils/template'
import { formatSize } from '../utils/units'
import { sanitizeFileName } from '../utils/templateStorage'

const FORMATS = [
  { id: 'pdf', label: 'PDF', sub: 'exact size', Icon: FileText },
  { id: 'png', label: 'PNG', sub: '300 DPI', Icon: ImageIcon },
  { id: 'zpl', label: 'ZPL', sub: 'printer code', Icon: FileCode },
]

const SCOPES = [
  { id: 'piece', label: 'This piece' },
  { id: 'all', label: 'All pieces' },
  { id: 'range', label: 'Range' },
]

export default function ExportDialog() {
  const open = useLabelStore((s) => s.showExportDialog)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const hasData = useLabelStore((s) => s.hasHostPreviewData)
  const realDataInfo = useLabelStore((s) => s.realDataInfo)
  const printServiceStatus = useLabelStore((s) => s.printServiceStatus)
  const addToast = useLabelStore((s) => s.addToast)

  const [format, setFormat] = useState('pdf')
  const [scope, setScope] = useState('piece')
  const [exactSize, setExactSize] = useState(true)
  const [showCutOutline, setShowCutOutline] = useState(false)
  const [range, setRange] = useState({ from: 1, to: 1 })
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const objectUrl = useRef('')

  const close = () => setPrintConfig({ showExportDialog: false })
  useEscape(open, close)

  const state = useLabelStore()

  useEffect(() => {
    if (!open) return undefined
    setFormat('pdf')
    setScope('piece')
    setError('')
    const pieces = realDataInfo?.totalPieces || 1
    setRange({ from: 1, to: pieces })
    return undefined
  }, [open, realDataInfo?.totalPieces])

  // Real preview on the left (spec §6.3).
  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const canvas = await renderLabelToCanvas({ ...useLabelStore.getState(), showCutOutline })
        if (cancelled) return
        if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
        const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
        objectUrl.current = URL.createObjectURL(blob)
        setPreview(objectUrl.current)
      } catch {
        if (!cancelled) setPreview('')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, showCutOutline])

  useEffect(() => () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current) }, [])

  const width = state.width
  const height = state.height
  const fileBase = sanitizeFileName(state.name || 'label')

  const pieceLabel = useMemo(() => {
    if (!realDataInfo) return 'no piece loaded'
    return `${realDataInfo.source} · piece ${realDataInfo.pieceIndex}${realDataInfo.totalPieces > 1 ? ` of ${realDataInfo.totalPieces}` : ''}`
  }, [realDataInfo])

  if (!open) return null

  const handleExport = async () => {
    if (!hasData) return
    setBusy(true)
    setError('')
    const s = useLabelStore.getState()
    try {
      if (format === 'pdf') {
        await exportPdf({ ...s, showCutOutline, exactSize }, `${fileBase}.pdf`)
        addToast({ message: `PDF opened for printing at ${formatSize(width, height)}`, type: 'success' })
      } else if (format === 'png') {
        await exportPng({ ...s, showCutOutline, printerDpi: 300 }, `${fileBase}.png`)
        addToast({ message: 'PNG exported at 300 DPI', type: 'success' })
      } else {
        if (printServiceStatus !== 'connected') {
          setError('The Print Service is unreachable, so printer code cannot be produced.')
          return
        }
        const res = await compileLabel({
          baseUrl: s.printServiceUrl,
          client: s.client,
          brand: s.printerBrand,
          printerDpi: s.printerDpi,
          template: buildExportTemplate(s),
          labelData: s.labelData,
        })
        downloadTextFile(res?.code || res?.zpl || res?.printerCode || '', `${fileBase}.zpl`)
        addToast({ message: 'Printer code downloaded', type: 'success' })
      }
      setPrintConfig({ showExportDialog: false })
    } catch (e) {
      setError(e.message || 'The export failed.')
    } finally {
      setBusy(false)
    }
  }

  const totalPieces = realDataInfo?.totalPieces || 1

  // Fit the preview into a 250 × 370 box keeping the label's own aspect ratio.
  const ratio = (Number(width) || 1) / (Number(height) || 1)
  const boxW = 250
  const boxH = 370
  const previewW = ratio >= 1 ? boxW : Math.round(boxH * ratio)
  const previewH = ratio >= 1 ? Math.round(boxW / ratio) : boxH

  return createPortal(
    <div className="lc-modal-overlay" onClick={close}>
      <div
        className="lc-modal !max-w-[1024px]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Export label"
      >
        <div className="lc-modal-head">
          <span className="lc-modal-head-icon">
            <Printer size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="lc-dialog-title">Export label</h2>
            <p className="mt-0.5 text-[13px] text-[var(--mut)]">
              Using real data: {pieceLabel}
            </p>
          </div>
          <button
            type="button"
            className="lc-icon-btn"
            onClick={close}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[450px_1fr]">
          {/* Left: real preview */}
          <div className="flex items-center justify-center border-r border-[var(--line)] bg-[var(--bg)] p-6">
            <div
              className="lc-preview-frame"
              style={{
                // Match the label's real proportions so the preview is not distorted.
                width: `${previewW}px`,
                height: `${previewH}px`,
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Label preview with the loaded piece"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-[12px] text-[var(--mut)]">No preview</span>
              )}
            </div>
          </div>

          {/* Right: choices */}
          <div className="min-w-0 overflow-y-auto p-6">
            <p className="lc-label mb-3 block">Format</p>
            <div className="grid grid-cols-3 gap-2.5">
              {FORMATS.map(({ id, label, sub, Icon }) => {
                const on = format === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFormat(id)}
                    className={`flex min-h-[92px] flex-col items-center justify-center gap-1.5 rounded-[10px] border-2 px-3 py-3 transition-colors ${
                      on
                        ? 'border-[var(--pri)] bg-[var(--panel)]'
                        : 'border-[var(--line)] bg-[var(--panel)] hover:border-[var(--mut)]'
                    }`}
                  >
                    <Icon size={20} className={on ? 'text-[var(--pri)]' : 'text-[var(--mut)]'} />
                    <span className="text-[13px] font-bold text-[var(--tx)]">{label}</span>
                    <span className="text-[11px] text-[var(--mut)]">{sub}</span>
                  </button>
                )
              })}
            </div>

            <p className="lc-label mb-3 mt-6 block">Pages</p>
            <div className="lc-segment">
              {SCOPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={scope === s.id ? 'is-on' : ''}
                  onClick={() => setScope(s.id)}
                >
                  {s.label}
                  {s.id === 'all' && totalPieces > 1 ? ` · ${totalPieces} pieces` : ''}
                </button>
              ))}
            </div>

            {scope === 'range' && (
              <div className="mt-3 flex items-end gap-3">
                <div className="w-28">
                  <label className="lc-label mb-1.5 block" htmlFor="range-from">
                    From
                  </label>
                  <input
                    id="range-from"
                    type="number"
                    min={1}
                    max={totalPieces}
                    value={range.from}
                    onChange={(e) => setRange((r) => ({ ...r, from: Number(e.target.value) }))}
                    className="lc-input !h-10"
                  />
                </div>
                <div className="w-28">
                  <label className="lc-label mb-1.5 block" htmlFor="range-to">
                    To
                  </label>
                  <input
                    id="range-to"
                    type="number"
                    min={1}
                    max={totalPieces}
                    value={range.to}
                    onChange={(e) => setRange((r) => ({ ...r, to: Number(e.target.value) }))}
                    className="lc-input !h-10"
                  />
                </div>
              </div>
            )}

            <div className="lc-divider my-6" />

            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[var(--tx)]">
                <input
                  type="checkbox"
                  checked={exactSize}
                  onChange={(e) => setExactSize(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span>
                  Exact label size ({formatSize(width, height)}), no page margins
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[var(--tx)]">
                <input
                  type="checkbox"
                  checked={showCutOutline}
                  onChange={(e) => setShowCutOutline(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span>Show cut outline</span>
              </label>
            </div>

            {!hasData && (
              <div className="lc-msg lc-msg-warn mt-6">
                <FolderOpen size={15} className="flex-none" />
                <span className="flex-1 text-[13px] font-medium">
                  Export is disabled until real data is loaded, so nothing invented can be printed.
                </span>
              </div>
            )}

            {error && (
              <div className="lc-msg lc-msg-err mt-6">
                <span className="flex-1 text-[13px] font-medium">{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="lc-modal-foot">
          <button type="button" onClick={close} className="lc-btn lc-btn-secondary !h-10">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!hasData || busy}
            className="lc-btn lc-btn-primary !h-10"
          >
            <Download size={15} />
            <span>{busy ? 'Exporting…' : `Export ${format.toUpperCase()}`}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}