import { useRef } from 'react'
import { useLabelStore } from '../store/labelStore'
import { mmToPx, pxToMm } from '../utils/units'

const RULER_SIZE = 22

export default function Rulers({ children }) {
  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)
  const zoom = useLabelStore((s) => s.zoom)
  const panX = useLabelStore((s) => s.panX)
  const panY = useLabelStore((s) => s.panY)
  const showRulers = useLabelStore((s) => s.showRulers)
  const rulerGuides = useLabelStore((s) => s.rulerGuides)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const wrapRef = useRef(null)

  if (!showRulers) return children

  const labelW = mmToPx(width)
  const labelH = mmToPx(height)
  const scale = zoom

  const addGuide = (axis, clientPos) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const cx = clientPos - rect.left - RULER_SIZE
    const cy = clientPos - rect.top - RULER_SIZE
    if (axis === 'v') {
      const lx = (cx - panX) / scale
      if (lx >= 0 && lx <= labelW) {
        setPrintConfig({ rulerGuides: { ...rulerGuides, v: [...rulerGuides.v, Math.round(pxToMm(lx) * 10) / 10] } })
      }
    } else {
      const ly = -(cy - panY) / scale
      if (ly >= 0 && ly <= labelH) {
        setPrintConfig({ rulerGuides: { ...rulerGuides, h: [...rulerGuides.h, Math.round(pxToMm(ly) * 10) / 10] } })
      }
    }
  }

  const hTicks = []
  for (let mm = 0; mm <= width; mm += 5) {
    const px = RULER_SIZE + panX + mmToPx(mm) * scale
    hTicks.push({ mm, px })
  }
  const vTicks = []
  for (let mm = 0; mm <= height; mm += 5) {
    const px = RULER_SIZE + panY - mmToPx(mm) * scale
    vTicks.push({ mm, px })
  }

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      {/* Top ruler */}
      <div
        className="absolute left-[22px] right-0 top-0 z-20 h-[22px] cursor-crosshair border-b border-[var(--lc-panel-border)] bg-[var(--lc-panel)]"
        onMouseDown={(e) => { if (e.button === 0) addGuide('h', e.clientY) }}
      >
        {hTicks.map(({ mm, px }) => (
          <div key={mm} className="absolute top-0 text-[8px] text-[var(--lc-text-muted)]" style={{ left: px }}>
            <div className="h-2 w-px bg-[var(--lc-panel-border)]" />
            {mm % 10 === 0 && <span className="ml-0.5">{mm}</span>}
          </div>
        ))}
      </div>
      {/* Left ruler */}
      <div
        className="absolute bottom-0 left-0 top-[22px] z-20 w-[22px] cursor-crosshair border-r border-[var(--lc-panel-border)] bg-[var(--lc-panel)]"
        onMouseDown={(e) => { if (e.button === 0) addGuide('v', e.clientX) }}
      >
        {vTicks.map(({ mm, px }) => (
          <div key={mm} className="absolute left-0 text-[8px] text-[var(--lc-text-muted)]" style={{ top: px }}>
            <div className="h-px w-2 bg-[var(--lc-panel-border)]" />
            {mm % 10 === 0 && <span className="ml-1">{mm}</span>}
          </div>
        ))}
      </div>
      {/* Corner */}
      <div className="absolute left-0 top-0 z-30 h-[22px] w-[22px] border-b border-r border-[var(--lc-panel-border)] bg-[var(--lc-panel)]" />

      {/* Guide lines */}
      {rulerGuides.v.map((mm, i) => {
        const x = RULER_SIZE + panX + mmToPx(mm) * scale
        return (
          <div
            key={`v${i}`}
            className="pointer-events-none absolute top-[22px] bottom-0 z-10 w-px bg-cyan-500/70"
            style={{ left: x }}
          />
        )
      })}
      {rulerGuides.h.map((mm, i) => {
        const y = RULER_SIZE + panY - mmToPx(mm) * scale
        return (
          <div
            key={`h${i}`}
            className="pointer-events-none absolute left-[22px] right-0 z-10 h-px bg-cyan-500/70"
            style={{ top: y }}
          />
        )
      })}

      <div className="absolute inset-0" style={{ paddingLeft: RULER_SIZE, paddingTop: RULER_SIZE }}>
        {children}
      </div>
    </div>
  )
}
