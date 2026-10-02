import { useEffect, useState } from 'react'
import { renderLabelToCanvas } from '../utils/export'
import { parseImportTemplate } from '../utils/template'
import { useLabelStore } from '../store/labelStore'

/** Gallery thumb — uses live host preview when present; otherwise tokens only (no fake samples). */
export default function TemplatePreviewThumb({ template, className = '', large = false }) {
  const [src, setSrc] = useState(null)
  const labelData = useLabelStore((s) => s.labelData)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const parsed = parseImportTemplate(template)
        const canvas = await renderLabelToCanvas({
          ...parsed,
          labelData: labelData && typeof labelData === 'object' ? labelData : {},
          showLiveTokens: true,
          globalStyles: parsed.globalStyles,
        })
        if (!cancelled) setSrc(canvas.toDataURL('image/png'))
      } catch {
        if (!cancelled) setSrc(null)
      }
    })()
    return () => { cancelled = true }
  }, [template, labelData])

  const h = large ? 'h-48' : 'h-24'

  return (
    <div className={`flex items-center justify-center overflow-hidden rounded-md border border-[var(--lc-panel-border)] bg-white ${h} ${className}`}>
      {src ? (
        <img src={src} alt="" className="max-h-full max-w-full object-contain p-1" />
      ) : (
        <div className="text-[10px] text-[var(--lc-text-muted)]">Preview…</div>
      )}
    </div>
  )
}
