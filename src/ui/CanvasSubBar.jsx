import { useState } from 'react'
import {
  Printer, Minus, Plus, Grid3x3, Magnet, Code, Thermometer, Database,
  Layers, Ruler, HelpCircle, Eye,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { sendToPrinter } from '../services/printService'
import { toast } from './Toast'

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
  const snapToElements = useLabelStore((s) => s.snapToElements)
  const snapToEdges = useLabelStore((s) => s.snapToEdges)
  const gridMm = useLabelStore((s) => s.gridMm)
  const thermalPreview = useLabelStore((s) => s.thermalPreview)
  const showLiveTokens = useLabelStore((s) => s.showLiveTokens)
  const showZplPanel = useLabelStore((s) => s.showZplPanel)
  const showRulers = useLabelStore((s) => s.showRulers)
  const printerDpi = useLabelStore((s) => s.printerDpi)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const printServiceUrl = useLabelStore((s) => s.printServiceUrl)
  const client = useLabelStore((s) => s.client)
  const printerBrand = useLabelStore((s) => s.printerBrand)
  const exportTemplate = useLabelStore((s) => s.exportTemplate)
  const labelData = useLabelStore((s) => s.labelData)

  const zoomPercent = Math.round(zoom * 100)

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
      toast(`Sent to ${printerIp}:9100`, 'success')
      setShowPrinterIpDialog(false)
    } catch (err) {
      toast(`Print failed: ${err.message}`, 'error')
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <>
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 overflow-x-auto border-b border-[var(--lc-panel-border)] bg-[var(--lc-panel)] px-3">
        <div className="flex items-center gap-2">
          <div className="lc-segment">
            <button type="button" onClick={() => setView({ zoom: Math.max(0.2, zoom / 1.15) })} title="Zoom out">
              <Minus size={12} />
            </button>
            <span className="lc-segment-value">{zoomPercent}%</span>
            <button type="button" onClick={() => setView({ zoom: Math.min(8, zoom * 1.15) })} title="Zoom in">
              <Plus size={12} />
            </button>
          </div>
          <button type="button" onClick={fitToScreen} className="lc-btn lc-btn-outline !py-1 !px-2.5 !text-xs">Fit</button>
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setPrintConfig({ showGrid: !showGrid })} className={`lc-pill-toggle ${showGrid ? 'active' : ''}`} title="Toggle grid">
            <Grid3x3 size={12} /> Grid
          </button>
          <select value={gridMm} onChange={(e) => setPrintConfig({ gridMm: Number(e.target.value) })} className="lc-input lc-input-sm !w-14 !py-0.5 !text-[10px]" title="Grid size">
            {[1, 2, 5, 10].map((g) => <option key={g} value={g}>{g}mm</option>)}
          </select>
          <button type="button" onClick={() => setPrintConfig({ snapToGrid: !snapToGrid })} className={`lc-pill-toggle ${snapToGrid ? 'active' : ''}`} title="Snap to grid">
            <Magnet size={12} /> Grid
          </button>
          <button type="button" onClick={() => setPrintConfig({ snapToElements: !snapToElements })} className={`lc-pill-toggle ${snapToElements ? 'active' : ''}`} title="Snap to elements">
            <Layers size={12} /> Elem
          </button>
          <button type="button" onClick={() => setPrintConfig({ snapToEdges: !snapToEdges })} className={`lc-pill-toggle ${snapToEdges ? 'active' : ''}`} title="Snap to page edges">
            Edges
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setPrintConfig({ showLiveTokens: !showLiveTokens })} className={`lc-pill-toggle ${showLiveTokens ? 'active' : ''}`} title="Live token preview">
            <Eye size={12} /> Tokens
          </button>
          <button type="button" onClick={() => setPrintConfig({ thermalPreview: !thermalPreview })} className={`lc-pill-toggle ${thermalPreview ? 'active' : ''}`} title="Thermal 1-bit simulation">
            <Thermometer size={12} /> Thermal
          </button>
          <button type="button" onClick={() => setPrintConfig({ showZplPanel: !showZplPanel })} className={`lc-pill-toggle ${showZplPanel ? 'active' : ''}`} title="ZPL preview panel">
            <Code size={12} /> ZPL
          </button>
          <button type="button" onClick={() => setPrintConfig({ showRulers: !showRulers })} className={`lc-pill-toggle ${showRulers ? 'active' : ''}`} title="Rulers">
            <Ruler size={12} />
          </button>
          <button type="button" onClick={() => setPrintConfig({ showSampleDataEditor: true })} className="lc-pill-toggle" title="Edit sample data">
            <Database size={12} /> Data
          </button>
          <button type="button" onClick={() => setPrintConfig({ showShortcuts: true })} className="lc-icon-btn" title="Keyboard shortcuts (?)">
            <HelpCircle size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[var(--lc-text-muted)]">
          <div className="lc-margin-group !gap-2">
            <label>W<input type="number" value={width} onChange={(e) => setLabelSize(Number(e.target.value), height)} /></label>
            <label>H<input type="number" value={height} onChange={(e) => setLabelSize(width, Number(e.target.value))} /></label>
            <span className="text-[10px]">mm</span>
          </div>
          <select value={printerDpi} onChange={(e) => setPrintConfig({ printerDpi: Number(e.target.value) })} className="lc-input lc-input-sm !py-1">
            <option value={203}>203 DPI</option>
            <option value={300}>300 DPI</option>
            <option value={600}>600 DPI</option>
          </select>
          <button type="button" onClick={() => setShowPrinterIpDialog(true)} className="lc-btn lc-btn-primary !py-1.5 !px-3 !text-xs">
            <Printer size={13} /> Test Print
          </button>
        </div>
      </div>

      {showPrinterIpDialog && (
        <div className="lc-modal-overlay">
          <div className="lc-modal">
            <h3 className="mb-1 text-base font-bold text-[var(--lc-text)]">Test Print</h3>
            <p className="mb-4 text-xs text-[var(--lc-text-muted)]">Sends compiled label code to printer on TCP port 9100.</p>
            <label className="mb-1 block text-xs font-semibold text-[var(--lc-text)]">Printer IP</label>
            <input type="text" value={printerIp} onChange={(e) => setPrinterIp(e.target.value)} className="lc-input mb-5 w-full" placeholder="192.168.1.100" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowPrinterIpDialog(false)} className="lc-btn lc-btn-outline !text-xs">Cancel</button>
              <button type="button" disabled={isPrinting} onClick={handleTestPrint} className="lc-btn lc-btn-primary !text-xs">
                {isPrinting ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
