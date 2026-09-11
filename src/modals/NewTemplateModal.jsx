import { useState, useEffect } from 'react'
import { X, Check, Sparkles } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { SIZE_PRESET_GROUPS } from '../data/templatePresets'
import { unitLabel } from '../utils/units'

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

  return (
    <div className="lc-modal-overlay">
      <div className="lc-modal lc-modal-new !max-w-md">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="lc-modal-icon flex h-10 w-10 items-center justify-center rounded-xl shadow-md">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--lc-text)]">New Label Template</h2>
              <p className="text-xs text-[var(--lc-text-muted)]">Set up your blank canvas</p>
            </div>
          </div>
          <button type="button" onClick={() => setModal('showNewModal', false)} className="lc-icon-btn">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--lc-text)]">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="lc-input w-full"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-[var(--lc-text-muted)]">
              Appears in the template list
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--lc-text)]">Quick size</label>
            <div className="flex flex-wrap gap-1.5">
              {SIZE_PRESET_GROUPS.flatMap((g) => g.presets).slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setWidth(p.width); setHeight(p.height); setUnit(p.unit || 'mm') }}
                  className="lc-btn lc-btn-outline !py-0.5 !px-2 !text-[10px]"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--lc-text)]">Width</label>
              <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} min={1} className="lc-input w-full" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--lc-text)]">Height</label>
              <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} min={1} className="lc-input w-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--lc-text)]">Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="lc-input w-full">
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="inch">inch</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--lc-text)]">Label Type</label>
              <select value={labelType} onChange={(e) => setLabelType(e.target.value)} className="lc-input w-full">
                <option value="production">Production</option>
                <option value="offcut">Offcut</option>
              </select>
            </div>
          </div>

          {/* Preview card */}
          <div className="lc-template-summary rounded-xl p-4">
            <p className="text-sm font-semibold text-[var(--lc-text)]">
              {name || 'New Label'} — {width} × {height} {unitLabel(unit)}
            </p>
            <span className={`lc-badge mt-2 ${isOffcut ? 'lc-badge-offcut' : 'lc-badge-prod'}`}>
              {labelType} label
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => setModal('showNewModal', false)} className="lc-btn lc-btn-outline !text-xs">
            <X size={14} />
            Cancel
          </button>
          <button type="button" onClick={handleCreate} className="lc-btn lc-btn-primary !text-xs">
            <Check size={14} />
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
