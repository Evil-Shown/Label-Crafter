import { X } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function SampleDataEditor() {
  const open = useLabelStore((s) => s.showSampleDataEditor)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const labelData = useLabelStore((s) => s.labelData)
  const setLabelData = useLabelStore((s) => s.setLabelData)

  if (!open) return null

  const update = (key, val) => setLabelData({ ...labelData, [key]: val })

  const keys = Object.keys(labelData).filter((k) => typeof labelData[k] !== 'object')

  return (
    <div className="lc-modal-overlay">
      <div className="lc-modal !max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">Sample Preview Data</h2>
          <button type="button" onClick={() => setPrintConfig({ showSampleDataEditor: false })} className="lc-icon-btn">
            <X size={16} />
          </button>
        </div>
        <p className="mb-3 text-xs text-[var(--lc-text-muted)]">
          Edit values used to preview tokens on the canvas.
        </p>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {keys.map((k) => (
            <div key={k}>
              <label className="mb-0.5 block text-[10px] font-semibold text-[var(--lc-text-muted)]">{k}</label>
              <input
                className="lc-input w-full text-xs"
                value={String(labelData[k] ?? '')}
                onChange={(e) => update(k, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
