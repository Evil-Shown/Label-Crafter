import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { renderLabelToCanvas } from '../utils/export'
import { OPTI_SAMPLE } from '../data/sampleData'

const BATCH_SAMPLES = [
  { ...OPTI_SAMPLE, orderNumber: 'L-69515', Barcode: 'L-69515-1', id: '1' },
  { ...OPTI_SAMPLE, orderNumber: 'L-69516', Barcode: 'L-69516-2', id: '2', pieceDescription: '8mm Grey' },
  { ...OPTI_SAMPLE, orderNumber: 'L-69517', Barcode: 'L-69517-3', id: '3', marks: 'BACK' },
  { ...OPTI_SAMPLE, orderNumber: 'L-69518', Barcode: 'L-69518-4', id: '4', weight: '18 kg' },
]

export default function BatchPreview() {
  const open = useLabelStore((s) => s.showBatchPreview)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      const state = useLabelStore.getState()
      const imgs = []
      for (const data of BATCH_SAMPLES) {
        const canvas = await renderLabelToCanvas({ ...state, labelData: data })
        imgs.push({ data, url: canvas.toDataURL('image/png') })
      }
      if (!cancelled) setPreviews(imgs)
    })()
    return () => { cancelled = true }
  }, [open])

  if (!open) return null

  return (
    <div className="lc-modal-overlay">
      <div className="lc-modal lc-batch-modal !max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">Batch Preview</h2>
          <button type="button" onClick={() => setPrintConfig({ showBatchPreview: false })} className="lc-icon-btn">
            <X size={16} />
          </button>
        </div>
        <p className="mb-3 text-xs text-[var(--lc-text-muted)]">
          Preview how this template renders across multiple sample records.
        </p>
        <div className="grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto">
          {previews.length === 0 ? (
            <p className="col-span-2 text-center text-xs text-[var(--lc-text-muted)]">Rendering…</p>
          ) : (
            previews.map((p, i) => (
              <div key={i} className="lc-preview-card rounded-xl p-2.5">
                <div className="mb-1 text-[10px] font-semibold text-[var(--lc-text-muted)]">
                  {p.data.orderNumber} · #{p.data.id}
                </div>
                <img src={p.url} alt="" className="w-full rounded bg-white" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
