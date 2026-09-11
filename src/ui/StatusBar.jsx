import { useLabelStore } from '../store/labelStore'
import { Minus, Plus, Scan } from 'lucide-react'

export default function StatusBar() {
  const cursorPos = useLabelStore((s) => s.cursorPos)
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const zoom = useLabelStore((s) => s.zoom)
  const setView = useLabelStore((s) => s.setView)
  const fitToScreen = useLabelStore((s) => s.fitToScreen)

  const fitCanvas = () => {
    const canvas = document.querySelector('.lc-canvas-wrap canvas')
    const rect = canvas?.parentElement?.getBoundingClientRect()
    fitToScreen(rect?.width, rect?.height)
  }

  return (
    <div className="lc-canvas-view-control absolute bottom-3 left-3 z-20 flex items-center gap-2">
      <div className="lc-segment">
        <button type="button" onClick={() => setView({ zoom: Math.max(0.2, zoom / 1.15) })} title="Zoom out">
          <Minus size={12} />
        </button>
        <span className="lc-segment-value">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setView({ zoom: Math.min(8, zoom * 1.15) })} title="Zoom in">
          <Plus size={12} />
        </button>
      </div>
      <button type="button" onClick={fitCanvas} className="lc-btn lc-btn-outline !px-2.5 !py-1.5 !text-[10px]" title="Fit label to canvas">
        <Scan size={12} /> Fit
      </button>
      <div className="pointer-events-none hidden items-center gap-2 text-[10px] font-medium text-[var(--lc-text-muted)] xl:flex">
        <span>X: {Math.round(cursorPos.x)} Y: {Math.round(cursorPos.y)}</span>
        {selectedKeys.length > 0 && <span>{selectedKeys.length} selected</span>}
      </div>
    </div>
  )
}
