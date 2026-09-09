import { useLabelStore } from '../store/labelStore'

export default function StatusBar() {
  const cursorPos = useLabelStore((s) => s.cursorPos)
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const zoom = useLabelStore((s) => s.zoom)

  return (
    <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-3 rounded-md border border-[var(--lc-panel-border)] bg-[var(--lc-panel)]/90 px-2.5 py-1 text-[10px] font-medium text-[var(--lc-text-muted)] shadow-sm backdrop-blur-sm">
      <span>X: {Math.round(cursorPos.x)} Y: {Math.round(cursorPos.y)}</span>
      <span>Zoom: {Math.round(zoom * 100)}%</span>
      {selectedKeys.length > 0 && <span>{selectedKeys.length} selected</span>}
    </div>
  )
}
