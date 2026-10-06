import {
  Grid3x3,
  Magnet,
  Scan,
  Braces,
  Code,
  FileSpreadsheet,
  Printer,
  Ruler,
  Flame,
  Undo2,
  Redo2,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function CanvasSubBar() {
  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)
  const setLabelSize = useLabelStore((s) => s.setLabelSize)
  const printerDpi = useLabelStore((s) => s.printerDpi)
  const printerBrand = useLabelStore((s) => s.printerBrand)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const showGrid = useLabelStore((s) => s.showGrid)
  const snapToGrid = useLabelStore((s) => s.snapToGrid)
  const snapToEdges = useLabelStore((s) => s.snapToEdges)
  const showKeysOnCanvas = useLabelStore((s) => s.showKeysOnCanvas)
  const showZplPanel = useLabelStore((s) => s.showZplPanel)
  const thermalPreview = useLabelStore((s) => s.thermalPreview)
  const undo = useLabelStore((s) => s.undo)
  const redo = useLabelStore((s) => s.redo)
  const canUndo = useLabelStore((s) => s._history?.length > 0)
  const canRedo = useLabelStore((s) => s._future?.length > 0)

  const sizes = [
    { w: 100, h: 150, label: '100 × 150 mm' },
    { w: 100, h: 111, label: '100 × 111 mm' },
    { w: 99, h: 149, label: '99 × 149 mm' },
    { w: 100, h: 60, label: '100 × 60 mm' },
    { w: 90, h: 43, label: '90 × 43 mm' },
    { w: 100, h: 50, label: '100 × 50 mm' },
    { w: 75, h: 50, label: '75 × 50 mm' },
    { w: 102, h: 152, label: '4 × 6 in (102 × 152 mm)' },
  ]
  const sizeKey = `${Math.round(width)}x${Math.round(height)}`
  const currentSize = sizes.find((s) => `${s.w}x${s.h}` === sizeKey)

  return (
    <div className="lc-canvas-toolbar flex min-h-[50px] shrink-0 items-center justify-between gap-2 overflow-x-auto px-3 select-none no-scrollbar">
      {/* 9. Size, DPI, printer language, grid, snap, edges, show keys */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 md:gap-2">
        {/* Label Size */}
        <label className="relative flex flex-none items-center">
          <Ruler size={14} className="pointer-events-none absolute left-2 text-[var(--mut)]" />
          <select
            aria-label="Label size"
            value={sizeKey}
            onChange={(e) => {
              const [w, h] = e.target.value.split('x').map(Number)
              if (w && h) setLabelSize(w, h)
            }}
            className="lc-select !h-[32px] !w-[110px] sm:!w-[135px] lg:!w-[160px] !pl-7 !pr-6 !text-[12px] sm:!text-[12.5px] !font-semibold"
          >
            {!currentSize && (
              <option value={sizeKey}>
                {Math.round(width)} × {Math.round(height)} mm
              </option>
            )}
            {sizes.map((s) => (
              <option key={s.label} value={`${s.w}x${s.h}`}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {/* DPI */}
        <select
          aria-label="Printer resolution"
          value={printerDpi || 300}
          onChange={(e) => setPrintConfig({ printerDpi: Number(e.target.value) })}
          className="lc-select !h-[32px] !w-[80px] sm:!w-[96px] !px-2 !pr-6 !text-[12px] sm:!text-[12.5px] !font-semibold flex-none"
        >
          <option value={203}>203 DPI</option>
          <option value={300}>300 DPI</option>
          <option value={600}>600 DPI</option>
        </select>

        {/* Printer Brand / Language */}
        <label className="relative hidden sm:flex flex-none items-center">
          <Printer size={14} className="pointer-events-none absolute left-2 text-[var(--mut)]" />
          <select
            aria-label="Printer language"
            value={printerBrand || 'zebra'}
            onChange={(e) => setPrintConfig({ printerBrand: e.target.value })}
            className="lc-select !h-[32px] !w-[115px] lg:!w-[145px] !pl-7 !pr-6 !text-[12px] sm:!text-[12.5px] !font-semibold"
          >
            <option value="zebra">Zebra (ZPL)</option>
            <option value="tsc">TSC (TSPL)</option>
            <option value="epl">Zebra (EPL)</option>
            <option value="datamax">Datamax</option>
          </select>
        </label>

        <div className="mx-0.5 hidden h-5 w-px bg-[var(--line)] sm:block flex-none" />

        {/* Toggle Buttons with responsive text (icon on compact, text on wider) */}
        <div className="flex items-center gap-1 flex-none">
          <button
            type="button"
            onClick={() => setPrintConfig({ showGrid: !showGrid })}
            title="Show 1 mm grid"
            aria-pressed={showGrid}
            className={`lc-chip-btn !h-[32px] !px-2.5 !text-[12px] ${showGrid ? 'is-on' : ''}`}
          >
            <Grid3x3 size={14} className="shrink-0" />
            <span className="hidden xl:inline">Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintConfig({ snapToGrid: !snapToGrid })}
            title="Snap to grid"
            aria-pressed={snapToGrid}
            className={`lc-chip-btn !h-[32px] !px-2.5 !text-[12px] ${snapToGrid ? 'is-on' : ''}`}
          >
            <Magnet size={14} className="shrink-0" />
            <span className="hidden xl:inline">Snap</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintConfig({ snapToEdges: !snapToEdges })}
            title="Snap to edges"
            aria-pressed={snapToEdges}
            className={`lc-chip-btn !h-[32px] !px-2.5 !text-[12px] ${snapToEdges ? 'is-on' : ''}`}
          >
            <Scan size={14} className="shrink-0" />
            <span className="hidden xl:inline">Edges</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintConfig({ showKeysOnCanvas: !showKeysOnCanvas })}
            title="Show field keys on canvas"
            aria-pressed={showKeysOnCanvas}
            className={`lc-chip-btn !h-[32px] !px-2.5 !text-[12px] ${showKeysOnCanvas ? 'is-on' : ''}`}
          >
            <Braces size={14} className="shrink-0" />
            <span className="hidden 2xl:inline">Keys</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintConfig({ thermalPreview: !thermalPreview })}
            title="Preview thermal printer dot burn"
            aria-pressed={thermalPreview}
            className={`lc-chip-btn !h-[32px] !px-2.5 !text-[12px] ${thermalPreview ? 'is-on' : ''}`}
          >
            <Flame size={14} className="shrink-0" />
            <span className="hidden 2xl:inline">Thermal</span>
          </button>
        </div>
      </div>

      {/* Right side: Undo/Redo, Real data, Code */}
      <div className="flex flex-none items-center gap-1.5 sm:gap-2">
        {/* Undo/Redo */}
        <div className="flex items-center rounded-[6px] border border-[var(--line)] bg-[var(--panel)] p-0.5 shadow-2xs">
          <button
            type="button"
            disabled={!canUndo}
            onClick={undo}
            className="lc-icon-btn !h-7 !w-7"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <div className="h-3.5 w-px bg-[var(--line)]" />
          <button
            type="button"
            disabled={!canRedo}
            onClick={redo}
            className="lc-icon-btn !h-7 !w-7"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Real data */}
        <button
          type="button"
          onClick={() => useLabelStore.setState({ showLoadDataModal: true })}
          className="lc-chip-btn !h-[32px] !px-2 sm:!px-3 !text-[12px]"
          title="Load a real Opti project file or ERP order"
        >
          <FileSpreadsheet size={14} className="shrink-0" />
          <span className="hidden md:inline">Real data</span>
        </button>

        {/* Code toggle */}
        <button
          type="button"
          onClick={() => setPrintConfig({ showZplPanel: !showZplPanel })}
          aria-pressed={showZplPanel}
          className={`lc-chip-btn !h-[32px] !px-2 sm:!px-3 !text-[12px] ${showZplPanel ? 'is-on' : ''}`}
          title="Toggle printer code panel"
        >
          <Code size={14} className="shrink-0" />
          <span className="hidden sm:inline">Code</span>
        </button>
      </div>
    </div>
  )
}
