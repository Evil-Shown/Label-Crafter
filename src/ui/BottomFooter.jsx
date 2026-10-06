import { useEffect, useState } from 'react'
import { ZoomIn, ZoomOut, Maximize, Check } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { pxToMm } from '../utils/units'

function lastSavedLabel(ts) {
  if (!ts) return 'Not saved yet'
  const secs = Math.round((Date.now() - ts) / 1000)
  if (secs < 45) return 'Last saved just now'
  const mins = Math.round(secs / 60)
  if (mins === 1) return 'Last saved 1 min ago'
  if (mins < 60) return `Last saved ${mins} min ago`
  const hours = Math.round(mins / 60)
  return hours === 1 ? 'Last saved 1 hour ago' : `Last saved ${hours} hours ago`
}

export default function BottomFooter() {
  const zoom = useLabelStore((s) => s.zoom)
  const setView = useLabelStore((s) => s.setView)
  const fitToScreen = useLabelStore((s) => s.fitToScreen)
  const cursorPos = useLabelStore((s) => s.cursorPos)
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const margins = useLabelStore((s) => s.margins)
  const lastSavedAt = useLabelStore((s) => s.lastSavedAt)
  const [, force] = useState(0)

  // Keep the "last saved" copy honest without re-rendering constantly.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 20000)
    return () => clearInterval(id)
  }, [])

  const handleFit = () => {
    const canvasWrap = document.querySelector('.lc-canvas-wrap')
    if (canvasWrap) {
      const rect = canvasWrap.getBoundingClientRect()
      fitToScreen(rect.width, rect.height)
    }
  }

  const mm = (px) => {
    const v = pxToMm(px)
    return Number.isFinite(v) ? v.toFixed(1) : '0.0'
  }

  return (
    <footer className="lc-footer flex h-11 shrink-0 items-center justify-between gap-4 px-4 text-[13px] text-[var(--mut)] select-none">
      {/* 12. Zoom %, Fit, cursor in mm, selection count */}
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView({ zoom: Math.max(0.15, zoom / 1.15) })}
            className="lc-icon-btn !h-7 !w-7"
            title="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="w-12 text-center text-[13px] font-semibold text-[var(--tx-2)]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setView({ zoom: Math.min(8, zoom * 1.15) })}
            className="lc-icon-btn !h-7 !w-7"
            title="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleFit}
          className="lc-chip-btn !h-[30px]"
          title="Fit the label to the window (Ctrl+0)"
        >
          <Maximize size={14} />
          <span>Fit</span>
        </button>

        <div className="h-4 w-px bg-[var(--line)]" />

        <span className="truncate">
          X {mm(cursorPos?.x ?? 0)} mm · Y {mm(cursorPos?.y ?? 0)} mm
        </span>
        {selectedKeys.length > 0 && (
          <span className="flex-none text-[13px] text-[var(--mut)]">
            {selectedKeys.length} selected
          </span>
        )}
      </div>

      <div className="flex flex-none items-center gap-4">
        <span className="truncate">
          Margins {margins?.left ?? 0} · {margins?.right ?? 0} · {margins?.top ?? 0} ·{' '}
          {margins?.bottom ?? 0} mm
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-[var(--ok)]">
          <Check size={14} />
          <span>{lastSavedLabel(lastSavedAt)}</span>
        </span>
      </div>
    </footer>
  )
}
