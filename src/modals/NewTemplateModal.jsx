import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Plus,
  Sparkles,
  FilePlus2,
  Copy,
  Upload,
  FileCode,
  TriangleAlert,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

const SIZES = [
  { id: '100x150', w: 100, h: 150, label: '100 × 150 mm' },
  { id: '100x111', w: 100, h: 111, label: '100 × 111 mm' },
  { id: '100x60', w: 100, h: 60, label: '100 × 60 mm' },
  { id: '100x50', w: 100, h: 50, label: '100 × 50 mm' },
  { id: '90x43', w: 90, h: 43, label: '90 × 43 mm · Opti' },
  { id: '4x6in', w: 102, h: 152, label: '4 × 6 in' },
]

const STARTS = [
  { id: 'blank', label: 'Blank', Icon: FilePlus2 },
  { id: 'copy', label: 'Copy of current', Icon: Copy },
  { id: 'json', label: 'Import JSON', Icon: Upload },
  { id: 'oif', label: 'Import OIF', Icon: FileCode },
]

/** Size cards keep their true proportions so the shape is obvious (spec §7.1). */
function SizeCard({ size, selected, onClick }) {
  const box = 52
  const scale = box / Math.max(size.w, size.h)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-[10px] border-2 px-2 py-3 transition-colors ${
        selected
          ? 'border-[var(--pri)] bg-[var(--panel)]'
          : 'border-[var(--line)] bg-[var(--panel)] hover:border-[var(--mut)]'
      }`}
    >
      <span className="flex h-[56px] items-center justify-center">
        <span
          className="block rounded-[2px] border bg-[var(--bg)]"
          style={{
            width: Math.max(6, size.w * scale),
            height: Math.max(6, size.h * scale),
            borderColor: selected ? 'var(--pri)' : 'var(--line)',
          }}
        />
      </span>
      <span className="text-center text-[11.5px] font-medium leading-tight text-[var(--tx-2)]">
        {size.label}
      </span>
    </button>
  )
}

export default function NewTemplateModal() {
  const isOpen = useLabelStore((s) => s.showNewModal)
  const setModal = useLabelStore((s) => s.setModal)
  const createNewTemplate = useLabelStore((s) => s.createNewTemplate)
  const importTemplate = useLabelStore((s) => s.importTemplate)
  const pickAndImportJsonFile = useLabelStore((s) => s.pickAndImportJsonFile)
  const saveToLibrary = useLabelStore((s) => s.saveToLibrary)
  const client = useLabelStore((s) => s.client)
  const currentName = useLabelStore((s) => s.name)

  const [name, setName] = useState('')
  const [selectedSizeId, setSelectedSizeId] = useState('100x150')
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(150)
  const [labelType, setLabelType] = useState('production')
  const [startFrom, setStartFrom] = useState('blank')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setName('Premium Showers v2')
    setWidth(100)
    setHeight(150)
    setSelectedSizeId('100x150')
    setLabelType('production')
    setStartFrom('blank')
    setTouched(false)
  }, [isOpen])

  if (!isOpen) return null

  const clientLabel = client === 'erp' ? 'ERP' : 'OPTI'
  const trimmed = name.trim()
  const nameError = touched && !trimmed

  const handleSelectPreset = (p) => {
    setSelectedSizeId(p.id)
    setWidth(p.w)
    setHeight(p.h)
  }

  const handleCreate = () => {
    setTouched(true)
    if (!trimmed) return

    if (startFrom === 'json') {
      setModal('showNewModal', false)
      pickAndImportJsonFile()
      return
    }

    if (startFrom === 'oif') {
      setModal('showNewModal', false)
      setModal('showOifImportModal', true)
      return
    }

    if (startFrom === 'copy') {
      // Keep the current layout, resize it to the chosen label, rename it.
      const s = useLabelStore.getState()
      importTemplate(
        {
          ...s,
          id: undefined,
          name: trimmed,
          width: Number(width) || s.width,
          height: Number(height) || s.height,
          labelType,
          client,
          sections: undefined,
        },
        { markSaved: false },
      )
      saveToLibrary()
    } else {
      createNewTemplate({
        name: trimmed,
        width: Number(width) || 100,
        height: Number(height) || 60,
        unit: 'mm',
        labelType,
      })
    }
    setModal('showNewModal', false)
  }

  return createPortal(
    <div className="lc-modal-overlay" onClick={() => setModal('showNewModal', false)}>
      <div
        className="lc-modal !max-w-[790px]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="New template"
      >
        <div className="lc-modal-head">
          <span className="lc-modal-head-icon">
            <Sparkles size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="lc-dialog-title">New template</h2>
            <p className="mt-0.5 text-[13px] text-[var(--mut)]">
              It will be saved for <span className="lc-badge lc-badge-opti">{clientLabel}</span> ·
              switch Opti / ERP in the top bar
            </p>
          </div>
          <button type="button" className="lc-icon-btn" onClick={() => setModal('showNewModal', false)} title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="lc-modal-body">
          <div>
            <label className="lc-label mb-1.5 block" htmlFor="new-tpl-name">
              Template name
            </label>
            <input
              id="new-tpl-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="lc-input !h-10"
              placeholder="e.g. MSG — Premium Shower"
            />
            {nameError && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-[var(--err)]">
                <TriangleAlert size={13} />
                A name is required. Names are unique per client.
              </p>
            )}
          </div>

          <div className="mt-6">
            <p className="lc-label mb-2.5 block">Size</p>
            <div className="grid grid-cols-6 gap-2">
              {SIZES.map((s) => (
                <SizeCard
                  key={s.id}
                  size={s}
                  selected={selectedSizeId === s.id}
                  onClick={() => handleSelectPreset(s)}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div>
              <label className="lc-label mb-1.5 block" htmlFor="new-tpl-w">
                Width
              </label>
              <div className="lc-input-unit">
                <input
                  id="new-tpl-w"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="lc-input !h-9"
                />
                <span>mm</span>
              </div>
            </div>
            <div>
              <label className="lc-label mb-1.5 block" htmlFor="new-tpl-h">
                Height
              </label>
              <div className="lc-input-unit">
                <input
                  id="new-tpl-h"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="lc-input !h-9"
                />
                <span>mm</span>
              </div>
            </div>
            <div>
              <label className="lc-label mb-1.5 block">Type</label>
              <div className="lc-segment !h-9">
                {['production', 'offcut'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={labelType === t ? 'is-on' : ''}
                    onClick={() => setLabelType(t)}
                  >
                    {t === 'production' ? 'Production' : 'Offcut'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="lc-label mb-2.5 block">Start from</p>
            <div className="lc-segment">
              {STARTS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={startFrom === id ? 'is-on' : ''}
                  onClick={() => setStartFrom(id)}
                >
                  <Icon size={14} />
                  {id === 'copy' ? `Copy of current (${currentName})` : label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lc-modal-foot">
          <button type="button" onClick={() => setModal('showNewModal', false)} className="lc-btn lc-btn-secondary !h-10">
            Cancel
          </button>
          <button type="button" onClick={handleCreate} className="lc-btn lc-btn-primary !h-10">
            {startFrom === 'json' ? <Upload size={15} /> : startFrom === 'oif' ? <FileCode size={15} /> : <Plus size={15} />}
            <span>
              {startFrom === 'json'
                ? 'Choose a JSON file'
                : startFrom === 'oif'
                  ? 'Import OIF & map fields'
                  : 'Create template'}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}