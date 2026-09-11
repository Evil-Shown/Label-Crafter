import { useState, useEffect } from 'react'
import { X, Check, Upload } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { formatTemplateSize } from '../utils/units'
import TemplatePreviewThumb from '../ui/TemplatePreviewThumb'

export default function ImportTemplateModal() {
  const open = useLabelStore((s) => s.showImportModal)
  const pendingImport = useLabelStore((s) => s.pendingImport)
  const confirmImportTemplate = useLabelStore((s) => s.confirmImportTemplate)
  const cancelImportTemplate = useLabelStore((s) => s.cancelImportTemplate)

  const [name, setName] = useState('')
  const [labelType, setLabelType] = useState('production')

  useEffect(() => {
    if (open && pendingImport) {
      setName(pendingImport.suggestedName || 'Imported Label')
      setLabelType(pendingImport.labelType || 'production')
    }
  }, [open, pendingImport])

  if (!open || !pendingImport) return null

  return (
    <div className="lc-modal-overlay">
      <div className="lc-modal !max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-[var(--lc-accent)]" />
            <h2 className="text-base font-bold">Import Label Template</h2>
          </div>
          <button type="button" onClick={cancelImportTemplate} className="lc-icon-btn">
            <X size={16} />
          </button>
        </div>

        <TemplatePreviewThumb template={pendingImport.parsed} large className="mb-4" />

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold">Template name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="lc-input w-full"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Label type</label>
            <select value={labelType} onChange={(e) => setLabelType(e.target.value)} className="lc-input w-full">
              <option value="production">Production</option>
              <option value="sample">Sample</option>
              <option value="offcut">Offcut</option>
            </select>
          </div>
          <p className="text-[11px] text-[var(--lc-text-muted)]">
            {formatTemplateSize(pendingImport.parsed)} ·
            {extractFieldCount(pendingImport.parsed)} elements
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={cancelImportTemplate} className="lc-btn lc-btn-outline !text-xs">Cancel</button>
          <button
            type="button"
            onClick={() => confirmImportTemplate({ name: name.trim() || 'Imported Label', labelType })}
            className="lc-btn lc-btn-primary !text-xs"
          >
            <Check size={14} /> Import &amp; Open
          </button>
        </div>
      </div>
    </div>
  )
}

function extractFieldCount(t) {
  if (!t) return 0
  if (Array.isArray(t.fields)) return t.fields.length
  const sections = t.sections || {}
  return Object.values(sections).reduce((n, s) => n + (s?.fields?.length || 0), 0)
}
