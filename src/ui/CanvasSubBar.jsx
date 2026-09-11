import { useState } from 'react'
import {
  Printer, Grid3x3, Magnet, Code, Thermometer, Database,
  Layers, Ruler, HelpCircle, Eye, Server, Wifi, CheckCircle2, CircleAlert,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { checkServiceHealth, sendToPrinter } from '../services/printService'
import { SIZE_PRESET_GROUPS } from '../data/templatePresets'
import { fromMm, roundDisplay } from '../utils/units'
import { toast } from './Toast'

export default function CanvasSubBar() {
  const [isPrinting, setIsPrinting] = useState(false)
  const [isCheckingService, setIsCheckingService] = useState(false)
  const [serviceStatus, setServiceStatus] = useState(null)
  const [showPrinterIpDialog, setShowPrinterIpDialog] = useState(false)

  const widthMm = useLabelStore((s) => s.width)
  const heightMm = useLabelStore((s) => s.height)
  const unit = useLabelStore((s) => s.unit) || 'mm'
  const setLabelSize = useLabelStore((s) => s.setLabelSize)
  const setDisplayUnit = useLabelStore((s) => s.setDisplayUnit)
  const applySizePreset = useLabelStore((s) => s.applySizePreset)
  const displayW = roundDisplay(fromMm(widthMm, unit), unit)
  const displayH = roundDisplay(fromMm(heightMm, unit), unit)
  const inputStep = unit === 'inch' ? 0.01 : unit === 'cm' ? 0.1 : 1
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
  const printerHost = useLabelStore((s) => s.printerHost)
  const printerPort = useLabelStore((s) => s.printerPort)
  const client = useLabelStore((s) => s.client)
  const printerBrand = useLabelStore((s) => s.printerBrand)
  const exportTemplate = useLabelStore((s) => s.exportTemplate)
  const labelData = useLabelStore((s) => s.labelData)

  const handleTestPrint = async () => {
    setIsPrinting(true)
    try {
      const template = exportTemplate()
      await sendToPrinter({
        baseUrl: printServiceUrl,
        host: printerHost,
        port: printerPort,
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
      toast(`Sent to ${printerHost}:${printerPort}`, 'success')
      setShowPrinterIpDialog(false)
    } catch (err) {
      toast(`Print failed: ${err.message}`, 'error')
    } finally {
      setIsPrinting(false)
    }
  }

  const handleCheckService = async () => {
    setIsCheckingService(true)
    setServiceStatus(null)
    try {
      const info = await checkServiceHealth(printServiceUrl)
      setServiceStatus({ ok: true, message: `${info.service || 'Label Print Service'} is ready` })
    } catch (err) {
      setServiceStatus({ ok: false, message: err.message || 'Unable to connect' })
    } finally {
      setIsCheckingService(false)
    }
  }

  return (
    <>
      <div className="lc-canvas-toolbar flex h-[52px] shrink-0 items-center justify-between gap-2 overflow-x-auto border-b border-[var(--lc-panel-border)] bg-[var(--lc-panel)] px-3">
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
          <select
            className="lc-input lc-input-sm !w-[9.5rem] !py-1 !text-[10px]"
            defaultValue=""
            onChange={(e) => {
              const id = e.target.value
              if (!id) return
              for (const group of SIZE_PRESET_GROUPS) {
                const preset = group.presets.find((p) => p.id === id)
                if (preset) applySizePreset(preset)
              }
              e.target.value = ''
            }}
            title="Common label sizes"
          >
            <option value="">Size preset…</option>
            {SIZE_PRESET_GROUPS.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.presets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="lc-margin-group !gap-2">
            <label>W<input type="number" step={inputStep} min={0.01} value={displayW} onChange={(e) => setLabelSize(Number(e.target.value), displayH)} /></label>
            <label>H<input type="number" step={inputStep} min={0.01} value={displayH} onChange={(e) => setLabelSize(displayW, Number(e.target.value))} /></label>
            <select value={unit} onChange={(e) => setDisplayUnit(e.target.value)} className="lc-input lc-input-sm !w-12 !py-0.5 !text-[10px]" title="Display unit">
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="inch">in</option>
            </select>
          </div>
          <select value={printerDpi} onChange={(e) => setPrintConfig({ printerDpi: Number(e.target.value) })} className="lc-input lc-input-sm !py-1">
            <option value={203}>203 DPI</option>
            <option value={300}>300 DPI</option>
            <option value={600}>600 DPI</option>
          </select>
          <button type="button" onClick={() => setShowPrinterIpDialog(true)} className="lc-btn lc-btn-primary !py-1.5 !px-3 !text-xs">
            <Printer size={13} /> Print Setup
          </button>
        </div>
      </div>

      {showPrinterIpDialog && (
        <div className="lc-modal-overlay">
          <div className="lc-modal lc-service-modal !max-w-lg">
            <div className="mb-5 flex items-start gap-3">
              <div className="lc-modal-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"><Server size={18} /></div>
              <div>
                <h3 className="text-base font-bold text-[var(--lc-text)]">Print Service Connection</h3>
                <p className="mt-0.5 text-xs text-[var(--lc-text-muted)]">Connect Label Designer to the service hosted in IIS.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--lc-text)]">IIS service URL</label>
                <div className="flex gap-2">
                  <input type="url" value={printServiceUrl} onChange={(e) => { setPrintConfig({ printServiceUrl: e.target.value }); setServiceStatus(null) }} className="lc-input min-w-0 flex-1" placeholder="http://labels-server:5088" />
                  <button type="button" onClick={handleCheckService} disabled={isCheckingService || !printServiceUrl.trim()} className="lc-btn lc-btn-outline !px-3 !text-xs">
                    <Wifi size={13} /> {isCheckingService ? 'Checking...' : 'Test'}
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-[var(--lc-text-muted)]">Example: http://server-name:5088 or your IIS site URL</p>
              </div>

              {serviceStatus && (
                <div className={`lc-connection-status ${serviceStatus.ok ? 'is-online' : 'is-offline'}`}>
                  {serviceStatus.ok ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}
                  <span>{serviceStatus.message}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--lc-text)]">Printer brand</label>
                  <select value={printerBrand} onChange={(e) => setPrintConfig({ printerBrand: e.target.value })} className="lc-input w-full">
                    <option value="zebra">Zebra</option>
                    <option value="honeywell">Honeywell / Intermec</option>
                    <option value="citizen">Citizen</option>
                    <option value="sato">SATO</option>
                    <option value="sato-sbpl">SATO (native SBPL)</option>
                    <option value="tsc">TSC</option>
                    <option value="godex">GoDEX</option>
                    <option value="datamax">Datamax</option>
                    <option value="epl">Eltron / EPL</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--lc-text)]">Printer port</label>
                  <input type="number" min="1" max="65535" value={printerPort} onChange={(e) => setPrintConfig({ printerPort: Number(e.target.value) || 9100 })} className="lc-input w-full" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--lc-text)]">Printer IP or hostname</label>
                <input type="text" value={printerHost} onChange={(e) => setPrintConfig({ printerHost: e.target.value })} className="lc-input w-full" placeholder="192.168.1.100" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowPrinterIpDialog(false)} className="lc-btn lc-btn-outline !text-xs">Cancel</button>
              <button type="button" disabled={isPrinting || !printerHost.trim() || !printServiceUrl.trim()} onClick={handleTestPrint} className="lc-btn lc-btn-primary !text-xs">
                {isPrinting ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
