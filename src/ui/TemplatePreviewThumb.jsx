import { useEffect, useState } from 'react'
import { renderLabelToCanvas } from '../utils/export'
import { parseImportTemplate } from '../utils/template'
import { useLabelStore } from '../store/labelStore'

/**
 * Library card thumbnail. Renders through the same engine as the canvas, with
 * whatever real data is loaded — key chips appear when there is none, never
 * made-up values (spec §3 / R10).
 */
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

  return (
    <div className={`flex h-full w-full items-center justify-center ${className}`}>
      {src ? (
        <img
          src={src}
          alt=""
          className={`max-h-full max-w-full object-contain ${large ? '' : 'p-1.5'}`}
          style={large ? undefined : { filter: 'drop-shadow(0 1px 2px rgba(15,23,42,0.16))' }}
        />
      ) : (
        <div className="text-[11px] text-[var(--mut)]">No preview</div>
      )}
    </div>
  )
}