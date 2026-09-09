import { useRef, useState } from 'react'
import {
  FilePlus,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Printer,
  Code2,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { compileLabel, checkServiceHealth, sendToPrinter } from '../services/printService'

export default function TopBar() {
  const fileRef = useRef(null)
  const [status, setStatus] = useState('')
  const [printerHost, setPrinterHost] = useState('192.168.1.100')

  const name = useLabelStore((s) => s.name)
  const zoom = useLabelStore((s) => s.zoom)
  const printServiceUrl = useLabelStore((s) => s.printServiceUrl)
  const client = useLabelStore((s) => s.client)
  const printerBrand = useLabelStore((s) => s.printerBrand)
  const printerDpi = useLabelStore((s) => s.printerDpi)
  const labelData = useLabelStore((s) => s.labelData)

  const exportTemplate = useLabelStore((s) => s.exportTemplate)
  const importTemplate = useLabelStore((s) => s.importTemplate)
  const newTemplate = useLabelStore((s) => s.newTemplate)
  const undo = useLabelStore((s) => s.undo)
  const redo = useLabelStore((s) => s.redo)
  const setView = useLabelStore((s) => s.setView)
  const setTemplateMeta = useLabelStore((s) => s.setTemplateMeta)

  const handleSave = () => {
    const json = exportTemplate()
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${json.id || 'label'}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setStatus('Template saved')
  }

  const handleOpen = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importTemplate(reader.result)
        setStatus(`Opened ${file.name}`)
      } catch (err) {
        setStatus(`Import failed: ${err.message}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleCompile = async () => {
    setStatus('Compiling…')
    try {
      const ok = await checkServiceHealth(printServiceUrl)
      if (!ok) throw new Error('Label Print Service not reachable')
      const template = exportTemplate()
      const res = await compileLabel({
        baseUrl: printServiceUrl,
        client,
        brand: printerBrand,
        template,
        labelData,
        printerDpi,
      })
      const payload = res.payload || res.zpl || ''
      await navigator.clipboard.writeText(payload)
      setStatus(`Compiled ${res.language || 'ZPL'} — copied to clipboard (${payload.length} chars)`)
    } catch (err) {
      setStatus(err.message)
    }
  }

  const handleTestPrint = async () => {
    setStatus('Sending to printer…')
    try {
      const template = exportTemplate()
      await sendToPrinter({
        baseUrl: printServiceUrl,
        host: printerHost,
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
      setStatus(`Sent to ${printerHost}:9100`)
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <header className="relative flex h-12 shrink-0 items-center gap-2 border-b border-[var(--lc-panel-border)] bg-[var(--lc-panel)] px-3">
      <span className="mr-2 text-sm font-semibold tracking-tight text-white">
        Lable Crafter
      </span>

      <button
        type="button"
        className="icon-btn"
        title="New"
        onClick={() => newTemplate()}
      >
        <FilePlus size={16} />
      </button>
      <button
        type="button"
        className="icon-btn"
        title="Open JSON"
        onClick={() => fileRef.current?.click()}
      >
        <FolderOpen size={16} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleOpen}
      />
      <button type="button" className="icon-btn" title="Save JSON" onClick={handleSave}>
        <Save size={16} />
      </button>

      <div className="mx-1 h-5 w-px bg-[var(--lc-panel-border)]" />

      <button type="button" className="icon-btn" title="Undo" onClick={undo}>
        <Undo2 size={16} />
      </button>
      <button type="button" className="icon-btn" title="Redo" onClick={redo}>
        <Redo2 size={16} />
      </button>

      <div className="mx-1 h-5 w-px bg-[var(--lc-panel-border)]" />

      <button
        type="button"
        className="icon-btn"
        onClick={() => setView({ zoom: Math.min(8, zoom * 1.15) })}
      >
        <ZoomIn size={16} />
      </button>
      <span className="min-w-12 text-center text-xs text-[var(--lc-muted)]">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setView({ zoom: Math.max(0.15, zoom / 1.15) })}
      >
        <ZoomOut size={16} />
      </button>

      <input
        className="ml-4 max-w-48 flex-1 rounded border border-[var(--lc-panel-border)] bg-[var(--lc-bg)] px-2 py-1 text-sm"
        value={name}
        onChange={(e) => setTemplateMeta({ name: e.target.value })}
        placeholder="Template name"
      />

      <div className="ml-auto flex items-center gap-2">
        <input
          className="w-36 rounded border border-[var(--lc-panel-border)] bg-[var(--lc-bg)] px-2 py-1 text-xs"
          value={printerHost}
          onChange={(e) => setPrinterHost(e.target.value)}
          placeholder="Printer IP"
          title="Printer IP for test print"
        />
        <button
          type="button"
          className="flex items-center gap-1 rounded bg-[var(--lc-accent)] px-2 py-1 text-xs font-medium hover:bg-[var(--lc-accent-hover)]"
          onClick={handleCompile}
        >
          <Code2 size={14} />
          Compile
        </button>
        <button
          type="button"
          className="flex items-center gap-1 rounded border border-[var(--lc-panel-border)] px-2 py-1 text-xs hover:bg-white/5"
          onClick={handleTestPrint}
        >
          <Printer size={14} />
          Test print
        </button>
      </div>

      {status && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full rounded-b bg-[var(--lc-panel)] px-3 py-0.5 text-xs text-[var(--lc-muted)]">
          {status}
        </span>
      )}
    </header>
  )
}
