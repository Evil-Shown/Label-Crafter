import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function NewTemplateModal() {
  const isOpen = useLabelStore((s) => s.showNewModal)
  const setModal = useLabelStore((s) => s.setModal)
  const createNewTemplate = useLabelStore((s) => s.createNewTemplate)
  const client = useLabelStore((s) => s.client)

  const [name, setName] = useState('Premium Showers v2')
  const [selectedSizeId, setSelectedSizeId] = useState('100x150')
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(150)
  const [labelType, setLabelType] = useState('production')
  const [startFrom, setStartFrom] = useState('blank') // 'blank' | 'copy' | 'json'

  const sizePresets = [
    { id: '100x150', w: 100, h: 150, label: '100 × 150 mm', aspect: 'h-12 w-8' },
    { id: '100x60', w: 100, h: 60, label: '100 × 60 mm', aspect: 'h-8 w-12' },
    { id: '90x43', w: 90, h: 43, label: '90 × 43 mm · Opti', aspect: 'h-7 w-12' },
    { id: '100x50', w: 100, h: 50, label: '100 × 50 mm', aspect: 'h-7 w-12' },
    { id: '75x50', w: 75, h: 50, label: '75 × 50 mm', aspect: 'h-8 w-11' },
    { id: '4x6in', w: 102, h: 152, label: '4 × 6 in', aspect: 'h-12 w-8' },
  ]

  useEffect(() => {
    if (isOpen) {
      setName('New label template')
      setWidth(100)
      setHeight(150)
      setSelectedSizeId('100x150')
      setLabelType('production')
      setStartFrom('blank')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSelectPreset = (p) => {
    setSelectedSizeId(p.id)
    setWidth(p.w)
    setHeight(p.h)
  }

  const handleCreate = () => {
    createNewTemplate({
      name: name.trim() || 'New Label',
      width: Number(width) || 100,
      height: Number(height) || 60,
      unit: 'mm',
      labelType,
    })
    setModal('showNewModal', false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-2xl text-[var(--tx)]">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-[var(--pri)] dark:bg-blue-950">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--tx)]">
                New label template
              </h2>
              <p className="text-xs text-[var(--mut)]">
                It will be saved for <span className="rounded bg-blue-100 px-1 py-0.2 font-bold uppercase text-blue-800 text-[9px] dark:bg-blue-950 dark:text-blue-300">{client}</span> · switch Opti/ERP in the top bar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModal('showNewModal', false)}
            className="text-[var(--mut)] hover:text-[var(--tx)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-[var(--mut)] block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold text-[var(--tx)] focus:border-[var(--pri)] focus:outline-none"
              autoFocus
            />
          </div>

          {/* Size Cards */}
          <div>
            <label className="text-xs font-semibold text-[var(--mut)] block mb-1.5">Size</label>
            <div className="grid grid-cols-6 gap-2">
              {sizePresets.map((p) => {
                const isSelected = selectedSizeId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                      isSelected
                        ? 'border-2 border-[var(--pri)] bg-blue-50/60 dark:bg-blue-950/40 text-[var(--pri)]'
                        : 'border-[var(--line)] text-[var(--tx)] hover:bg-[var(--line-subtle)]'
                    }`}
                  >
                    <div className={`mb-1.5 rounded border border-current opacity-80 ${p.aspect}`} />
                    <span className="text-[10px] font-bold leading-tight">{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Width, Height, Type */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--mut)] block mb-1">Width (mm)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="h-8 w-full rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-2.5 text-xs font-semibold focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--mut)] block mb-1">Height (mm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="h-8 w-full rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-2.5 text-xs font-semibold focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--mut)] block mb-1">Type</label>
              <div className="grid grid-cols-2 rounded-lg bg-[var(--bg)] p-0.5 border border-[var(--line)] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLabelType('production')}
                  className={`rounded py-1 transition-all ${
                    labelType === 'production' ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs' : 'text-[var(--mut)]'
                  }`}
                >
                  Production
                </button>
                <button
                  type="button"
                  onClick={() => setLabelType('offcut')}
                  className={`rounded py-1 transition-all ${
                    labelType === 'offcut' ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs' : 'text-[var(--mut)]'
                  }`}
                >
                  Offcut
                </button>
              </div>
            </div>
          </div>

          {/* Start From */}
          <div>
            <label className="text-xs font-semibold text-[var(--mut)] block mb-1.5">Start from</label>
            <div className="grid grid-cols-3 rounded-lg bg-[var(--bg)] p-1 border border-[var(--line)] text-xs font-semibold text-center">
              <button
                type="button"
                onClick={() => setStartFrom('blank')}
                className={`rounded py-1.5 transition-all ${
                  startFrom === 'blank' ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs' : 'text-[var(--mut)]'
                }`}
              >
                📄 Blank
              </button>
              <button
                type="button"
                onClick={() => setStartFrom('copy')}
                className={`rounded py-1.5 transition-all ${
                  startFrom === 'copy' ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs' : 'text-[var(--mut)]'
                }`}
              >
                📑 Copy of current
              </button>
              <button
                type="button"
                onClick={() => setStartFrom('json')}
                className={`rounded py-1.5 transition-all ${
                  startFrom === 'json' ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs' : 'text-[var(--mut)]'
                }`}
              >
                📥 Import JSON
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={() => setModal('showNewModal', false)}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--tx)] hover:bg-[var(--line-subtle)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-lg bg-[var(--pri)] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            Create template
          </button>
        </div>
      </div>
    </div>
  )
}
