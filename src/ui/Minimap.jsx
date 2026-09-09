import { useLabelStore } from '../store/labelStore'
import { mmToPx } from '../utils/units'

export default function Minimap() {
  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)
  const fields = useLabelStore((s) => s.fields)
  const showMinimap = useLabelStore((s) => s.showMinimap)

  if (!showMinimap) return null

  const labelW = mmToPx(width)
  const labelH = mmToPx(height)
  const scale = Math.min(120 / labelW, 80 / labelH)

  return (
    <div className="pointer-events-none absolute bottom-10 right-3 z-30 rounded-md border border-[var(--lc-panel-border)] bg-[var(--lc-panel)]/90 p-1.5 shadow-md backdrop-blur-sm">
      <div className="text-[8px] font-bold text-[var(--lc-text-muted)]">Overview</div>
      <div
        className="relative mt-1 bg-white"
        style={{ width: labelW * scale, height: labelH * scale }}
      >
        {fields.filter((f) => !f.hidden).map((f) => (
          <div
            key={f.fieldKey}
            className="absolute border border-indigo-400/60 bg-indigo-400/20"
            style={{
              left: f.x * scale,
              top: f.y * scale,
              width: Math.max(2, f.width * scale),
              height: Math.max(2, f.height * scale),
            }}
          />
        ))}
      </div>
    </div>
  )
}
