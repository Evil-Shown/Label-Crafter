import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function NewTemplateModal() {
  const isOpen = useLabelStore((s) => s.showNewModal)
  const setModal = useLabelStore((s) => s.setModal)
  const createNewTemplate = useLabelStore((s) => s.createNewTemplate)

  const [name, setName] = useState('New Label')
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(60)
  const [unit, setUnit] = useState('mm')
  const [labelType, setLabelType] = useState('production')

  useEffect(() => {
    if (isOpen) {
      setName('New Label')
      setWidth(100)
      setHeight(60)
      setUnit('mm')
      setLabelType('production')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleCreate = () => {
    createNewTemplate({
      name: name.trim() || 'New Label',
      width: Number(width) || 100,
      height: Number(height) || 60,
      unit,
      labelType,
    })
    setModal('showNewModal', false)
  }

  const isOffcut = labelType === 'offcut'
  const badgeLabel = `${labelType.toUpperCase()} LABEL`
  const badgeBg = isOffcut ? 'bg-[#7c3aed]' : 'bg-[#2563eb]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="flex w-full max-w-md flex-col rounded-xl border border-[var(--lc-panel-border)] bg-[var(--lc-panel)] p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--lc-text)]">New Label Template</h2>
          <button
            type="button"
            onClick={() => setModal('showNewModal', false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--lc-text-muted)] hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          {/* Name */}
          <div>
            <label className="mb-1 block font-medium text-[var(--lc-text)]">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New Label"
              className="lc-input w-full"
              autoFocus
            />
            <span className="mt-1 block text-xs text-[var(--lc-text-muted)]">
              This name will appear in the template list.
            </span>
          </div>

          {/* Width & Height */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-[var(--lc-text)]">Width</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min={1}
                className="lc-input w-full"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-[var(--lc-text)]">Height</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                min={1}
                className="lc-input w-full"
              />
            </div>
          </div>

          {/* Unit */}
          <div>
            <label className="mb-1 block font-medium text-[var(--lc-text)]">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="lc-input w-full"
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="inch">inch</option>
            </select>
          </div>

          {/* Label Type */}
          <div>
            <label className="mb-1 block font-medium text-[var(--lc-text)]">Label Type</label>
            <select
              value={labelType}
              onChange={(e) => setLabelType(e.target.value)}
              className="lc-input w-full"
            >
              <option value="production">Production</option>
              <option value="offcut">Offcut</option>
            </select>
          </div>

          {/* Preview Box */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
            <div className="text-sm font-medium text-[var(--lc-text)]">
              {name || 'New Label'} — {width} × {height} {unit}
            </div>
            <div className="mt-2">
              <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold tracking-wider text-white ${badgeBg}`}>
                {badgeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setModal('showNewModal', false)}
            className="lc-btn lc-btn-outline"
          >
            <X size={15} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="lc-btn lc-btn-primary"
          >
            <Check size={15} />
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
