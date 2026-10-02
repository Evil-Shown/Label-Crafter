import { useState } from 'react'
import {
  RefreshCw,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function OptiLabelsSettingsView() {
  const [selectedProdId, setSelectedProdId] = useState('LBL_001')
  const [selectedOffcutId, setSelectedOffcutId] = useState('LBL_OFF_001')

  const setActiveTab = useLabelStore((s) => s.setActiveTab)
  const addToast = useLabelStore((s) => s.addToast)

  const prodTemplates = [
    { id: 'LBL_001', name: 'MSG', size: '100 × 150 mm', date: 'edited 2 Oct', isDefault: true },
    { id: 'LBL_002', name: 'Premium Showers', size: '100 × 111 mm', date: 'edited 11 Sep', isDefault: false },
    { id: 'LBL_003', name: 'new latest tuffco', size: '99 × 149 mm', date: 'edited 11 Sep', isDefault: false },
    { id: 'LBL_004', name: 'Standard Label', size: '90 × 43 mm', date: 'edited 11 Sep', isDefault: false },
  ]

  const offcutTemplates = [
    { id: 'LBL_OFF_001', name: 'Offcut small', size: '100 × 60 mm', isDefault: true },
    { id: 'LBL_OFF_002', name: 'New Label', size: '100 × 60 mm', isDefault: false },
  ]

  const handleSetProdDefault = (id) => {
    setSelectedProdId(id)
    addToast({ message: 'Default production template updated', type: 'success' })
  }

  const handleSetOffcutDefault = (id) => {
    setSelectedOffcutId(id)
    addToast({ message: 'Default offcut template updated', type: 'success' })
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-[var(--bg)] p-8 text-[var(--tx)] select-none">
      {/* Top Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold text-[var(--mut)] mb-1">
            SPIL Opti &gt; Settings &gt; Labels
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--tx)]">
            Label templates
          </h1>
          <p className="mt-1 text-xs text-[var(--mut)]">
            Templates are designed in Label Designer. Here you only choose which one Opti prints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addToast({ message: 'Refreshed templates list from database', type: 'info' })}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-xs font-semibold text-[var(--tx)] hover:bg-[var(--line-subtle)]"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('design')}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[var(--pri)] px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <ExternalLink size={13} />
            <span>Open Label Designer</span>
          </button>
        </div>
      </div>

      {/* 3-Column Layout: Production | Offcut | Preview (screen 10.1 / opti.png) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Col 1: Production label */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--line)]">
            <span className="text-sm">🏷️</span>
            <h3 className="font-bold text-sm text-[var(--tx)]">Production label</h3>
          </div>

          <div className="space-y-2.5">
            {prodTemplates.map((t) => {
              const isSelected = selectedProdId === t.id
              return (
                <div
                  key={t.id}
                  onClick={() => handleSetProdDefault(t.id)}
                  className={`flex items-center justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-2 border-[var(--pri)] bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-[var(--line)] bg-[var(--panel)] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="prod_template"
                      checked={isSelected}
                      onChange={() => handleSetProdDefault(t.id)}
                      className="h-4 w-4 text-[var(--pri)] focus:ring-0"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-[var(--tx)]">{t.name}</h4>
                      <p className="text-[10px] text-[var(--mut)]">
                        {t.size} {t.date ? `· ${t.date}` : ''}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Current default
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Col 2: Offcut label */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--line)]">
            <span className="text-sm">✂️</span>
            <h3 className="font-bold text-sm text-[var(--tx)]">Offcut label</h3>
          </div>

          <div className="space-y-2.5">
            {offcutTemplates.map((t) => {
              const isSelected = selectedOffcutId === t.id
              return (
                <div
                  key={t.id}
                  onClick={() => handleSetOffcutDefault(t.id)}
                  className={`flex items-center justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-2 border-[var(--pri)] bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-[var(--line)] bg-[var(--panel)] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="offcut_template"
                      checked={isSelected}
                      onChange={() => handleSetOffcutDefault(t.id)}
                      className="h-4 w-4 text-[var(--pri)] focus:ring-0"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-[var(--tx)]">{t.name}</h4>
                      <p className="text-[10px] text-[var(--mut)]">{t.size}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Current default
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Col 3: Live Preview of chosen template */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--line)]">
            <div className="flex items-center gap-2">
              <span className="text-sm">👁️</span>
              <h3 className="font-bold text-sm text-[var(--tx)]">Preview · MSG</h3>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center rounded-xl bg-[var(--bg)] p-4 border border-[var(--line-subtle)]">
            {/* Paper Label Mockup */}
            <div className="w-56 rounded-md bg-white p-4 shadow-md text-black border border-slate-200">
              <div className="flex items-center justify-between border-b pb-1">
                <span className="font-black text-sm">Route 12</span>
                <span className="font-bold text-xs">TGH</span>
              </div>
              <div className="my-1.5 bg-black py-0.5 text-center font-bold text-[9px] text-white">
                TOUGHENED 10MM
              </div>
              <div className="text-[10px] font-bold text-purple-700">💎 MS GLASS</div>
              <div className="my-2 flex flex-col items-center">
                <div className="h-9 w-full bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_4px)]" />
                <span className="font-mono text-[8px]">SO-24581-07</span>
              </div>
              <div className="text-[8px] space-y-0.5 text-slate-700">
                <div>Marks: LEFT EDGE</div>
                <div>Cust PO: PO-88213</div>
                <div className="font-semibold text-black">Finished size 1200 × 800</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
