import { useEffect, useState } from 'react'
import { renderLabelToCanvas } from '../utils/export'
import { parseImportTemplate } from '../utils/template'
import { OPTI_SAMPLE } from '../data/sampleData'

export default function TemplatePreviewThumb({ template, className = '', large = false }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const parsed = parseImportTemplate(template)
        const canvas = await renderLabelToCanvas({
          ...parsed,
          labelData: OPTI_SAMPLE,
          showLiveTokens: true,
          globalStyles: parsed.globalStyles,
        })
        if (!cancelled) setSrc(canvas.toDataURL('image/png'))
      } catch {
        if (!cancelled) setSrc(null)
      }
    })()
    return () => { cancelled = true }
  }, [template])

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
