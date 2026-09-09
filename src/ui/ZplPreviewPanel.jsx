import { useEffect, useState } from 'react'
import { X, Copy, Download, RefreshCw } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { compileLabel } from '../services/printService'

export default function ZplPreviewPanel() {
  const open = useLabelStore((s) => s.showZplPanel)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const zplPreview = useLabelStore((s) => s.zplPreview)
  const setZplPreview = useLabelStore((s) => s.setZplPreview)
  const exportTemplate = useLabelStore((s) => s.exportTemplate)
  const labelData = useLabelStore((s) => s.labelData)
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const s = useLabelStore.getState()
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
  }, [open, fields, width, height, labelData])

  if (!open) return null

  return (
    <div className="flex h-48 shrink-0 flex-col border-t border-[var(--lc-panel-border)] bg-[var(--lc-panel)]">
      <div className="flex items-center justify-between border-b border-[var(--lc-panel-border)] px-3 py-1.5">
        <span className="text-xs font-bold text-[var(--lc-text)]">ZPL / Printer Code Preview</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={refresh} className="lc-icon-btn" title="Refresh">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button type="button" onClick={() => navigator.clipboard.writeText(zplPreview)} className="lc-icon-btn" title="Copy">
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
            className="lc-icon-btn"
            title="Download"
          >
            <Download size={13} />
          </button>
          <button type="button" onClick={() => setPrintConfig({ showZplPanel: false })} className="lc-icon-btn">
            <X size={13} />
          </button>
        </div>
      </div>
      <pre className="flex-1 overflow-auto p-3 font-mono text-[10px] leading-relaxed text-[var(--lc-text-muted)]">
        {zplPreview || '// Compiling…'}
      </pre>
    </div>
  )
}
