import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Code,
  Copy,
  Download,
  RefreshCw,
  X,
  TriangleAlert,
  FolderOpen,
  CircleCheck,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import {
  compileLabel,
  brandForLanguage,
  brandLanguage,
  LANGUAGE_LABELS,
  PRINTER_LANGUAGES,
} from '../services/printService'
import { buildExportTemplate } from '../utils/template'
import { renderLabelToCanvas } from '../utils/export'
import { formatSize } from '../utils/units'

/** Languages the Print Service can emit: ZPL, TSPL, EZPL, SBPL, DPL, EPL. */
const EXT = { zpl: 'zpl', tspl: 'tspl', ezpl: 'ezpl', sbpl: 'sbpl', dpl: 'dpl', epl: 'epl' }

/** Colour one line of printer code: commands blue, field data amber. */
function highlightLine(line) {
  const parts = []
  if (/^\^XA|^XZ/.test(line)) {
    return <span className="lc-code-cmd">{line}</span>
  }
  const re = /\^([A-Z]{1,2})([^A-Z^]*)(?=\^|$)/g
  let last = 0
  let m
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push(<span key={`t${last}`} className="lc-code-val">{line.slice(last, m.index)}</span>)
    parts.push(<span key={`c${m.index}`} className="lc-code-cmd">^{m[1]}</span>)
    last = m.index + m[0].length
  }
  if (last < line.length) parts.push(<span key="tail" className="lc-code-val">{line.slice(last)}</span>)
  return parts.length ? parts : line
}

export default function ZplPreviewPanel() {
  const isOpen = useLabelStore((s) => s.showZplPanel)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const hasHostPreviewData = useLabelStore((s) => s.hasHostPreviewData)
  const labelData = useLabelStore((s) => s.labelData)
  const printServiceUrl = useLabelStore((s) => s.printServiceUrl)
  const printServiceStatus = useLabelStore((s) => s.printServiceStatus)
  const printerDpi = useLabelStore((s) => s.printerDpi)
  const client = useLabelStore((s) => s.client)
  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)
  const addToast = useLabelStore((s) => s.addToast)

  // The service takes a brand, not a language. Start on the language the
  // chosen printer actually speaks.
  const [activeLang, setActiveLang] = useState(() => brandLanguage(printerBrand) || 'zpl')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle') // idle | working | done | error
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const scrollRef = useRef(null)

  const hasData = hasHostPreviewData && labelData && Object.keys(labelData).length > 0

  // Spec §6.1: a small real-data preview sits above the code.
  useEffect(() => {
    if (!isOpen || !hasData) {
      setPreviewUrl('')
      return undefined
    }
    let cancelled = false
    ;(async () => {
      try {
        const state = useLabelStore.getState()
        const canvas = await renderLabelToCanvas({ ...state, labelData })
        if (!cancelled) setPreviewUrl(canvas.toDataURL('image/png'))
      } catch {
        if (!cancelled) setPreviewUrl('')
      }
    })()
    return () => { cancelled = true }
  }, [isOpen, hasData, labelData])

  // Compile through the Print Service only; never an empty data bag.
  const compile = useMemo(
    () => async () => {
      if (!hasData) return
      setStatus('working')
      setError('')
      try {
        const state = useLabelStore.getState()
        const res = await compileLabel({
          baseUrl: printServiceUrl,
          client,
          brand: brandForLanguage(activeLang, state.printerBrand),
          printerDpi,
          template: buildExportTemplate(state),
          labelData,
        })
        setCode(res?.payload || res?.zpl || res?.code || res?.printerCode || '')
        setStatus('done')
      } catch (e) {
        setError(e.message || 'The Print Service could not compile this label.')
        setStatus('error')
      }
    },
    [hasData, printServiceUrl, client, activeLang, printerDpi, labelData],
  )

  useEffect(() => {
    if (!isOpen) return
    setStatus('idle')
    setCode('')
    setError('')
  }, [isOpen, activeLang])

  if (!isOpen) return null

  const byteLabel = code ? `${(new Blob([code]).size / 1024).toFixed(1)} KB` : '—'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    addToast({ message: 'Printer code copied to clipboard', type: 'success' })
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `label.${EXT[activeLang]}`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ message: `Downloaded label.${EXT[activeLang]}`, type: 'success' })
  }

  return (
    <div className="lc-code-panel flex max-h-[46vh] min-h-[220px] flex-col shrink-0 text-[var(--tx)] select-none">
      <div className="flex flex-none items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex items-center gap-1.5 text-[13px] font-bold">
            <Code size={15} className="text-[var(--pri)]" />
            Printer code
          </span>

          <div className="flex items-center rounded-[7px] border border-[var(--line)] bg-[var(--bg)] p-0.5">
            {PRINTER_LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLang(lang)}
                title={`Compile ${LANGUAGE_LABELS[lang] || lang.toUpperCase()} for ${brandForLanguage(lang, printerBrand)}`}
                className={`rounded-[5px] px-2.5 py-1 text-[12.5px] font-semibold transition-colors ${
                  activeLang === lang
                    ? 'bg-[var(--panel)] text-[var(--pri)] shadow-[var(--sh-sm)]'
                    : 'text-[var(--mut)] hover:text-[var(--tx)]'
                }`}
              >
                {LANGUAGE_LABELS[lang] || lang.toUpperCase()}
              </button>
            ))}
          </div>

          {hasData && status === 'done' && (
            <span className="lc-badge lc-badge-ok">
              <CircleCheck size={13} />
              {formatSize(width, height)} · {printerDpi} DPI · {byteLabel}
            </span>
          )}
        </div>

        <div className="flex flex-none items-center gap-2">
          {hasData && (
            <>
              <button
                type="button"
                onClick={() => compile()}
                disabled={status === 'working' || printServiceStatus !== 'connected'}
                className="lc-btn lc-btn-secondary !h-9"
                title={printServiceStatus !== 'connected' ? 'Print service is unreachable' : 'Ask the Print Service to compile again'}
              >
                <RefreshCw size={14} className={status === 'working' ? 'animate-spin' : ''} />
                <span>Recompile</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!code}
                className="lc-btn lc-btn-secondary !h-9"
              >
                <Copy size={14} />
                <span>Copy</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!code}
                className="lc-btn lc-btn-secondary !h-9"
              >
                <Download size={14} />
                <span>Download .{EXT[activeLang]}</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setPrintConfig({ showZplPanel: false })}
            className="lc-icon-btn"
            title="Close the printer code panel"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {!hasData ? (
        /* Screen 6.2 — blocked, one action only (zpl_blocked.png) */
        <div className="flex flex-1 items-center justify-center bg-[var(--bg)] p-5">
          <div className="flex w-full max-w-[950px] items-center justify-between gap-6 rounded-[10px] border border-[var(--warn-line)] bg-[var(--warn-s)] p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] border border-[var(--warn-line)] bg-[var(--panel)] text-[var(--warn)]">
                <TriangleAlert size={18} />
              </span>
              <div className="min-w-0">
                <h4 className="text-[15px] font-bold text-[var(--warn)]">
                  Printer code needs real piece data
                </h4>
                <p className="mt-0.5 text-[13px] text-[var(--tx-2)]">
                  Without a real piece the label would print blank, so nothing is compiled. Load an
                  Opti project file or pick an ERP order to continue.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => useLabelStore.setState({ showLoadDataModal: true })}
              className="lc-btn lc-btn-primary flex-none !h-10"
            >
              <FolderOpen size={14} />
              <span>Load real data</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {previewUrl && (
            <div className="flex flex-none items-center gap-3 border-b border-[var(--line)] bg-[var(--panel-2)] px-4 py-2">
              <span className="lc-label-plain">Preview</span>
              <div className="lc-preview-frame h-[74px] w-[52px] flex-none overflow-hidden">
                <img src={previewUrl} alt="Label preview with real data" className="h-full w-full object-contain" />
              </div>
              <p className="text-[12.5px] text-[var(--mut)]">
                Rendered from the loaded piece — the code below prints exactly this.
              </p>
            </div>
          )}

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto bg-[var(--bg)] p-3">
            {status === 'idle' && (
              <button
                type="button"
                onClick={() => compile()}
                disabled={printServiceStatus !== 'connected'}
                className="lc-btn lc-btn-primary !h-10"
              >
                <Code size={14} />
                <span>Compile {LANGUAGE_LABELS[activeLang] || activeLang.toUpperCase()} with the Print Service</span>
              </button>
            )}

            {status === 'working' && (
              <p className="py-6 text-center text-[13px] text-[var(--mut)]">
                Asking the Print Service to compile…
              </p>
            )}

            {status === 'error' && (
              <div className="lc-msg lc-msg-err">
                <TriangleAlert size={15} className="flex-none" />
                <span className="flex-1">{error}</span>
                <button type="button" onClick={() => compile()} className="lc-btn lc-btn-sm lc-btn-secondary flex-none">
                  <RefreshCw size={13} />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {status === 'done' && code && (
              <pre className="lc-mono w-max min-w-full text-[12px] leading-[1.7]">
                {code.split('\n').map((line, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="w-8 flex-none select-none text-right text-[var(--mut)]">
                      {i + 1}
                    </span>
                    <span>{highlightLine(line)}</span>
                  </div>
                ))}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
