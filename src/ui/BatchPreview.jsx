import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { renderLabelToCanvas } from '../utils/export'

export default function BatchPreview() {
  const open = useLabelStore((s) => s.showBatchPreview)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const labelData = useLabelStore((s) => s.labelData)
  const hasHostPreviewData = useLabelStore((s) => s.hasHostPreviewData)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [rendering, setRendering] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!hasHostPreviewData || !labelData || !Object.keys(labelData).length) {
      setPreviewUrl(null)
      setRendering(false)
      return
    }
    let cancelled = false
    setRendering(true)
    ;(async () => {
      const state = useLabelStore.getState()
      const canvas = await renderLabelToCanvas({ ...state, labelData })
      if (!cancelled) {
        setPreviewUrl(canvas.toDataURL('image/png'))
        setRendering(false)
      }
    })()
    return () => { cancelled = true }
  }, [open, labelData, hasHostPreviewData])

  if (!open) return null

  const orderLabel = labelData?.orderNumber || labelData?.OrderNo || labelData?.id || 'preview'

  return (
    <div className="lc-modal-overlay">
      <div className="lc-modal lc-batch-modal !max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">Live preview</h2>
          <button type="button" onClick={() => setPrintConfig({ showBatchPreview: false })} className="lc-icon-btn">
            <X size={16} />
          </button>
        </div>
        <p className="mb-3 text-xs text-[var(--lc-text-muted)]">
          Renders with preview data from Opti/ERP only — no fake sample records.
        </p>
        {!hasHostPreviewData || !Object.keys(labelData || {}).length ? (
          <p className="py-8 text-center text-xs text-[var(--lc-text-muted)]">
            No live preview data yet. Open Label Crafter from Opti or ERP so the host can send a real piece/order bag.
          </p>
        ) : rendering || !previewUrl ? (
          <p className="py-8 text-center text-xs text-[var(--lc-text-muted)]">Rendering…</p>
        ) : (
          <div className="lc-preview-card mx-auto max-w-md rounded-xl p-2.5">
            <div className="mb-1 text-[10px] font-semibold text-[var(--lc-text-muted)]">{orderLabel}</div>
            <img src={previewUrl} alt="" className="w-full rounded bg-white" />
          </div>
        )}
      </div>
    </div>
  )
}
