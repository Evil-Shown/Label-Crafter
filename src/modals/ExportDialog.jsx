import { useState } from 'react'
import {
  FileText,
  Image,
  Code,
  X,
  Download,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { exportPng, exportPdf } from '../utils/export'

export default function ExportDialog() {
  const isOpen = useLabelStore((s) => s.showExportDialog)
  const realDataInfo = useLabelStore((s) => s.realDataInfo)
  const addToast = useLabelStore((s) => s.addToast)

  const [format, setFormat] = useState('pdf') // 'pdf' | 'png' | 'zpl'
  const [scope, setScope] = useState('piece') // 'piece' | 'all' | 'range'
  const [exactSize, setExactSize] = useState(true)
  const [showCutOutline, setShowCutOutline] = useState(false)

  if (!isOpen) return null

  const handleExport = async () => {
    const state = useLabelStore.getState()
    if (format === 'png') {
      await exportPng(state)
      addToast({ message: 'PNG exported successfully', type: 'success' })
    } else if (format === 'pdf') {
      await exportPdf(state)
      addToast({ message: 'PDF exported successfully', type: 'success' })
    } else {
      addToast({ message: 'ZPL code downloaded', type: 'success' })
    }
    useLabelStore.setState({ showExportDialog: false })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none">
      <div className="flex w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-2xl text-[var(--tx)]">
        {/* Left: Preview */}
        <div className="w-5/12 bg-[var(--bg)] p-6 flex flex-col items-center justify-center border-r border-[var(--line)]">
          <div className="w-48 rounded bg-white p-3 shadow-md text-black border border-slate-200 text-left">
            <div className="flex justify-between font-bold text-xs border-b pb-1">
              <span>Route 12</span>
              <span>TGH</span>
            </div>
            <div className="my-1 bg-black py-0.5 text-center text-[8px] font-bold text-white">
              TOUGHENED 10MM
            </div>
            <div className="text-[9px] font-bold text-purple-700">💎 MS GLASS</div>
            <div className="my-2 h-7 w-full bg-[repeating-linear-gradient(90deg,#000,#000_1px,transparent_1px,transparent_3px)]" />
            <div className="text-[7.5px] space-y-0.5 text-slate-700">
              <div>Marks: LEFT EDGE</div>
              <div>Cust PO: PO-88213</div>
              <div>Finished size 1200 × 800</div>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-[var(--mut)]">Preview with current piece values</p>
        </div>

        {/* Right: Options */}
        <div className="w-7/12 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="font-bold text-sm text-[var(--tx)]">Export label</h3>
                <p className="text-[11px] text-[var(--mut)]">
                  Using real data: {realDataInfo ? `${realDataInfo.source} · piece ${realDataInfo.pieceIndex}` : '1265.oif · piece 7'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => useLabelStore.setState({ showExportDialog: false })}
                className="text-[var(--mut)] hover:text-[var(--tx)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Format cards */}
            <div className="mt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--mut)] block mb-1.5">
                Format
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('pdf')}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                    format === 'pdf'
                      ? 'border-2 border-[var(--pri)] bg-blue-50/50 dark:bg-blue-950/40 text-[var(--pri)]'
                      : 'border-[var(--line)] text-[var(--tx)] hover:bg-[var(--line-subtle)]'
                  }`}
                >
                  <FileText size={20} className="mb-1" />
                  <span className="font-bold text-xs">PDF</span>
                  <span className="text-[9px] text-[var(--mut)]">exact size</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('png')}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                    format === 'png'
                      ? 'border-2 border-[var(--pri)] bg-blue-50/50 dark:bg-blue-950/40 text-[var(--pri)]'
                      : 'border-[var(--line)] text-[var(--tx)] hover:bg-[var(--line-subtle)]'
                  }`}
                >
                  <Image size={20} className="mb-1" />
                  <span className="font-bold text-xs">PNG</span>
                  <span className="text-[9px] text-[var(--mut)]">300 DPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('zpl')}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                    format === 'zpl'
                      ? 'border-2 border-[var(--pri)] bg-blue-50/50 dark:bg-blue-950/40 text-[var(--pri)]'
                      : 'border-[var(--line)] text-[var(--tx)] hover:bg-[var(--line-subtle)]'
                  }`}
                >
                  <Code size={20} className="mb-1" />
                  <span className="font-bold text-xs">ZPL</span>
                  <span className="text-[9px] text-[var(--mut)]">printer code</span>
                </button>
              </div>
            </div>

            {/* Pages Scope */}
            <div className="mt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--mut)] block mb-1.5">
                Pages
              </span>
              <div className="grid grid-cols-3 rounded-lg bg-[var(--bg)] p-1 border border-[var(--line)] text-xs text-center font-semibold">
                <button
                  type="button"
                  onClick={() => setScope('piece')}
                  className={`rounded py-1.5 transition-all ${
                    scope === 'piece' ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs' : 'text-[var(--mut)]'
                  }`}
                >
                  This piece
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`rounded py-1.5 transition-all ${
                    scope === 'all' ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs' : 'text-[var(--mut)]'
                  }`}
                >
                  All 42 pieces
                </button>
                <button
                  type="button"
                  onClick={() => setScope('range')}
                  className={`rounded py-1.5 transition-all ${
                    scope === 'range' ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs' : 'text-[var(--mut)]'
                  }`}
                >
                  Range
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="mt-4 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exactSize}
                  onChange={(e) => setExactSize(e.target.checked)}
                  className="rounded text-[var(--pri)] focus:ring-0"
                />
                <span>Exact label size (100 × 150 mm), no page margins</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCutOutline}
                  onChange={(e) => setShowCutOutline(e.target.checked)}
                  className="rounded text-[var(--pri)] focus:ring-0"
                />
                <span>Show cut outline</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={() => useLabelStore.setState({ showExportDialog: false })}
              className="rounded-lg border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--tx)] hover:bg-[var(--line-subtle)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg bg-[var(--pri)] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              Export {format.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
