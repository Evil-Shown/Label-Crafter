import { useEffect, useState } from 'react'
import { X, Copy, Download, RefreshCw, AlertTriangle } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { compileLabel } from '../services/printService'

const NO_DATA_NOTICE = [
  '// Compile skipped — no live preview data.',
  '// This designer only compiles against real values posted by Opti/ERP.',
  '// Open it from a host with a piece/order selected (or a design session with previewData).',
  '// Compiling an empty bag would produce a valid but blank label, so it is blocked here.',
].join('\n')

export default function ZplPreviewPanel() {
  const open = useLabelStore((s) => s.showZplPanel)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const zplPreview = useLabelStore((s) => s.zplPreview)
  const setZplPreview = useLabelStore((s) => s.setZplPreview)
  const exportTemplate = useLabelStore((s) => s.exportTemplate)
  const labelData = useLabelStore((s) => s.labelData)
  const hasHostPreviewData = useLabelStore((s) => s.hasHostPreviewData)
  const [loading, setLoading] = useState(false)

  const blocked = !hasHostPreviewData

  const refresh = async () => {
    const s = useLabelStore.getState()
    if (!s.hasHostPreviewData) {
      setZplPreview(NO_DATA_NOTICE)
      return
    }
    setLoading(true)
    try {
      const res = await compileLabel({
        baseUrl: s.printServiceUrl,
        client: s.client,
        brand: s.printerBrand,
        template: exportTemplate(),
        labelData,
        printerDpi: s.printerDpi,
      })
      setZplPreview(res.payload || res.zpl || '')
    } catch (err) {
      setZplPreview(`// Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fields = useLabelStore((s) => s.fields)
  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(refresh, 400)
    return () => clearTimeout(t)
  }, [open, fields, width, height, labelData, hasHostPreviewData])

  if (!open) return null

  return (
    <div className="lc-code-panel flex h-48 shrink-0 flex-col border-t border-[var(--lc-panel-border)] bg-[var(--lc-panel)]">
      <div className="flex items-center justify-between border-b border-[var(--lc-panel-border)] px-3 py-1.5">
        <span className="text-xs font-bold text-[var(--lc-text)]">ZPL / Printer Code Preview</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={refresh} className="lc-icon-btn" title="Refresh">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(zplPreview)}
            className="lc-icon-btn disabled:opacity-40"
            disabled={blocked}
            title={blocked ? 'Nothing to copy — no live preview data' : 'Copy'}
          >
            <Copy size={13} />
          </button>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([zplPreview], { type: 'text/plain' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'label.zpl'
              a.click()
            }}
            className="lc-icon-btn disabled:opacity-40"
            disabled={blocked}
            title={blocked ? 'Nothing to download — no live preview data' : 'Download'}
          >
            <Download size={13} />
          </button>
          <button type="button" onClick={() => setPrintConfig({ showZplPanel: false })} className="lc-icon-btn">
            <X size={13} />
          </button>
        </div>
      </div>
      {blocked && (
        <p className="flex items-start gap-1.5 border-b border-[var(--lc-panel-border)] bg-amber-50/70 px-3 py-1.5 text-[10px] leading-snug text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>
            No live preview data from {useLabelStore.getState().client === 'erp' ? 'ERP' : 'Opti'}. Compile is skipped so you
            cannot download a blank label that only looks valid. Open from the host with a piece/order loaded.
          </span>
        </p>
      )}
      <pre className="flex-1 overflow-auto p-3 font-mono text-[10px] leading-relaxed text-[var(--lc-text-muted)]">
        {zplPreview || '// Compiling…'}
      </pre>
    </div>
  )
}
