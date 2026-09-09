import { useState } from 'react'
import { Printer, Minus, Plus, Maximize } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { compileLabel, sendToPrinter } from '../services/printService'

export default function CanvasSubBar() {
  const [isPrinting, setIsPrinting] = useState(false)
  const [showPrinterIpDialog, setShowPrinterIpDialog] = useState(false)
  const [printerIp, setPrinterIp] = useState('192.168.1.100')

  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)
  const setLabelSize = useLabelStore((s) => s.setLabelSize)
  const zoom = useLabelStore((s) => s.zoom)
  const setView = useLabelStore((s) => s.setView)
  const fitToScreen = useLabelStore((s) => s.fitToScreen)
  const showGrid = useLabelStore((s) => s.showGrid)
  const snapToGrid = useLabelStore((s) => s.snapToGrid)
  const printerDpi = useLabelStore((s) => s.printerDpi)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)

  const printServiceUrl = useLabelStore((s) => s.printServiceUrl)
  const client = useLabelStore((s) => s.client)
  const printerBrand = useLabelStore((s) => s.printerBrand)
  const exportTemplate = useLabelStore((s) => s.exportTemplate)
  const labelData = useLabelStore((s) => s.labelData)

  const zoomPercent = Math.round(zoom * 100)

  const handleZoomIn = () => setView({ zoom: Math.min(8, zoom * 1.15) })
  const handleZoomOut = () => setView({ zoom: Math.max(0.2, zoom / 1.15) })

  const handleTestPrint = async () => {
    setIsPrinting(true)
    try {
      const template = exportTemplate()
      await sendToPrinter({
        baseUrl: printServiceUrl,
        host: printerIp,
        port: 9100,
        compileRequest: {
          client,
          brand: printerBrand,
          printerBrand,
          layout: 'template',
          printerDpi,
          template,
          labelData,
        },
      })
      alert(`Label successfully sent to ${printerIp}:9100!`)
      setShowPrinterIpDialog(false)
    } catch (err) {
      alert(`Test print failed: ${err.message}`)
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--lc-panel-border)] bg-[var(--lc-panel)] px-4 text-xs">
      {/* Zoom Controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom out"
          className="flex h-7 w-7 items-center justify-center rounded border border-[var(--lc-panel-border)] bg-[var(--lc-bg)] text-[var(--lc-text)] hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Minus size={13} />
        </button>

        <span className="min-w-14 text-center font-medium text-[var(--lc-text)]">
          {zoomPercent}%
        </span>

        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom in"
          className="flex h-7 w-7 items-center justify-center rounded border border-[var(--lc-panel-border)] bg-[var(--lc-bg)] text-[var(--lc-text)] hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Plus size={13} />
        </button>

        <button
          type="button"
          onClick={fitToScreen}
          className="ml-1 rounded border border-[var(--lc-panel-border)] bg-[var(--lc-bg)] px-2.5 py-1 font-medium text-[var(--lc-text)] hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Fit
        </button>
      </div>

      {/* Grid and Snap matching screenshot */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPrintConfig({ showGrid: !showGrid })}
          className={`rounded px-2.5 py-1 font-semibold transition-colors ${
            showGrid
              ? 'bg-blue-600 text-white'
              : 'border border-[var(--lc-panel-border)] bg-[var(--lc-bg)] text-[var(--lc-text)]'
          }`}
        >
          Grid
        </button>

        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[var(--lc-text)]">
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => setPrintConfig({ snapToGrid: e.target.checked })}
            className="h-3.5 w-3.5 rounded text-blue-600"
          />
          Snap
        </label>
      </div>

      {/* Size Readout / Inputs matching screenshot */}
      <div className="flex items-center gap-2 font-medium text-[var(--lc-text-muted)]">
        <span>Size (mm):</span>
        <div className="flex items-center gap-1">
          <span className="text-[var(--lc-text)]">W:</span>
          <input
            type="number"
            value={width}
            onChange={(e) => setLabelSize(Number(e.target.value), height)}
            className="lc-input h-7 w-14 px-1.5 text-center font-medium"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[var(--lc-text)]">H:</span>
          <input
            type="number"
            value={height}
            onChange={(e) => setLabelSize(width, Number(e.target.value))}
            className="lc-input h-7 w-14 px-1.5 text-center font-medium"
          />
        </div>
      </div>

      {/* DPI & Test Print matching screenshot */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="font-medium text-[var(--lc-text-muted)]">DPI:</span>
          <select
            value={printerDpi}
            onChange={(e) => setPrintConfig({ printerDpi: Number(e.target.value) })}
            className="lc-input h-7 px-2"
          >
            <option value={203}>203</option>
            <option value={300}>300</option>
            <option value={600}>600</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowPrinterIpDialog(true)}
          className="flex items-center gap-1.5 rounded border border-[var(--lc-panel-border)] bg-[var(--lc-bg)] px-3 py-1 font-medium text-[var(--lc-text)] hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Printer size={13} />
          Test Print
        </button>
      </div>

      {/* Printer IP popup modal for Test Print */}
      {showPrinterIpDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="w-80 rounded-xl border border-[var(--lc-panel-border)] bg-[var(--lc-panel)] p-4 shadow-xl">
            <h3 className="mb-2 text-sm font-bold text-[var(--lc-text)]">Test Print (TCP 9100)</h3>
            <p className="mb-3 text-xs text-[var(--lc-text-muted)]">
              Send raw compiled printer code directly to printer LAN IP address.
            </p>
            <label className="mb-1 block text-xs font-medium text-[var(--lc-text)]">Printer IP</label>
            <input
              type="text"
              value={printerIp}
              onChange={(e) => setPrinterIp(e.target.value)}
              className="lc-input mb-4 w-full"
              placeholder="e.g. 192.168.1.100"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPrinterIpDialog(false)}
                className="lc-btn lc-btn-outline text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPrinting}
                onClick={handleTestPrint}
                className="lc-btn lc-btn-primary text-xs"
              >
                {isPrinting ? 'Sending…' : 'Send Print Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
