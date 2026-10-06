import { useState } from 'react'
import {
  FileCode,
  FolderOpen,
  Database,
  X,
  Check,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function LoadRealDataModal() {
  const isOpen = useLabelStore((s) => s.showLoadDataModal)
  const client = useLabelStore((s) => s.client)
  const loadRealData = useLabelStore((s) => s.loadRealData)

  const [tab, setTab] = useState('oif') // 'oif' | 'erp'
  const [selectedPieceId, setSelectedPieceId] = useState(7)

  if (!isOpen) return null

  const pieces = [
    { id: 1, size: '1200 × 800', custPo: 'PO-88213', service: 'Polish' },
    { id: 7, size: '1500 × 900', custPo: 'PO-88213', service: 'Holes ×4' },
    { id: 12, size: '600 × 400', custPo: 'PO-88240', service: '—' },
    { id: 13, size: '600 × 400', custPo: 'PO-88240', service: '—' },
  ]

  const handleApply = () => {
    loadRealData({
      source: tab === 'oif' ? 'Project 1265.oif' : 'ERP Order SO-9942',
      pieceIndex: selectedPieceId,
      totalPieces: 42,
      data: {
        orderNumber: 'SO-24581-07',
        customerName: 'MS GLASS',
        route: 'Route 12',
        glassSpec: 'TOUGHENED 10MM',
        Dimensions: '1500 × 900',
        custPO: 'PO-88213',
        marks: 'LEFT EDGE',
        service1: 'Polish',
        service2: 'Holes ×4',
        service3: '',
        Barcode: 'SO-24581-07',
        barcode: 'SO-24581-07',
      },
    })
    useLabelStore.setState({ showLoadDataModal: false })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-2xl text-[var(--tx)]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-[var(--pri)] dark:bg-blue-950">
              <FileCode size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--tx)]">
                Load real data for preview
              </h2>
              <p className="text-xs text-[var(--mut)]">
                The canvas and printer code use real values only. Nothing is saved to the template.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => useLabelStore.setState({ showLoadDataModal: false })}
            className="text-[var(--mut)] hover:text-[var(--tx)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Source Switcher */}
        <div className="mt-4 grid grid-cols-2 rounded-lg bg-[var(--bg)] p-1 border border-[var(--line)]">
          <button
            type="button"
            onClick={() => setTab('oif')}
            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
              tab === 'oif'
                ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs'
                : 'text-[var(--mut)]'
            }`}
          >
            <FolderOpen size={13} />
            <span>Opti project file (.oif)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('erp')}
            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
              tab === 'erp'
                ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs'
                : 'text-[var(--mut)]'
            }`}
          >
            <Database size={13} />
            <span>ERP order from database</span>
          </button>
        </div>

        {/* File / Project Bar */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--tx)]">
            <FolderOpen size={15} className="text-[var(--mut)]" />
            <span>D:\Opti\Projects\<strong>1265.oif</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              42 pieces
            </span>
            <button
              type="button"
              className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1 text-xs font-semibold text-[var(--tx)] hover:bg-[var(--line-subtle)]"
            >
              Browse...
            </button>
          </div>
        </div>

        {/* Pieces Table */}
        <div className="mt-4">
          <span className="text-xs font-bold text-[var(--mut)] mb-2 block">Choose a piece</span>
          <div className="overflow-hidden rounded-xl border border-[var(--line)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg)] text-[var(--mut)] font-semibold border-b border-[var(--line)]">
                <tr>
                  <th className="py-2 px-3">Piece</th>
                  <th className="py-2 px-3">Size (mm)</th>
                  <th className="py-2 px-3">Cust PO</th>
                  <th className="py-2 px-3">Service 1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {pieces.map((p) => {
                  const isSelected = selectedPieceId === p.id
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPieceId(p.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 font-semibold text-[var(--pri)] dark:bg-blue-950/40'
                          : 'hover:bg-[var(--line-subtle)]'
                      }`}
                    >
                      <td className="py-2 px-3">{p.id}</td>
                      <td className="py-2 px-3">{p.size}</td>
                      <td className="py-2 px-3">{p.custPo}</td>
                      <td className="py-2 px-3">{p.service}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50/60 p-2.5 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
          <span>ℹ️</span>
          <span>Notes mapping from this project's Labels settings is applied automatically.</span>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={() => useLabelStore.setState({ showLoadDataModal: false })}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--tx)] hover:bg-[var(--line-subtle)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-lg bg-[var(--pri)] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            Use piece {selectedPieceId}
          </button>
        </div>
      </div>
    </div>
  )
}
