import { useState } from 'react'
import {
  X, Upload, Download, Plus, Pencil, Trash2, Star, Eye, FolderDown,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { BUILTIN_TEMPLATES, getBuiltinTemplateConfig, isBuiltinId } from '../data/builtinTemplates'
import { SIZE_PRESET_GROUPS } from '../data/templatePresets'
import { formatTemplateSize } from '../utils/units'
import TemplatePreviewThumb from './TemplatePreviewThumb'

const TYPE_BADGE = {
  production: 'lc-badge-prod',
  offcut: 'lc-badge-offcut',
  sample: 'lc-badge-offcut',
}

function TemplateCard({
  template,
  isDefault,
  onOpen,
  onPreview,
  onExport,
  onDelete,
  onSetDefault,
  builtin = false,
}) {
  const labelType = template.labelType || 'production'
  const badgeClass = TYPE_BADGE[labelType] || TYPE_BADGE.production

  return (
    <div
      className={`lc-template-card flex flex-col rounded-xl border bg-[var(--lc-panel)] p-3 ${
        isDefault ? 'is-default' : 'border-[var(--lc-panel-border)]'
      }`}
    >
      <TemplatePreviewThumb template={builtin ? getBuiltinTemplateConfig(template.id) : template} />

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span className="text-xs font-bold text-[var(--lc-text)]">{template.name}</span>
        {isDefault && (
          <span className="lc-default-badge rounded px-1.5 py-0.5 text-[9px] font-bold text-white">DEFAULT</span>
        )}
        <span className={`lc-badge ${badgeClass}`}>{labelType}</span>
      </div>

      <p className="mt-0.5 text-[10px] text-[var(--lc-text-muted)]">
        {formatTemplateSize(template)}
        {template.updatedAt && ` · ${new Date(template.updatedAt).toLocaleDateString()}`}
      </p>
      {template.description && (
        <p className="mt-1 line-clamp-2 text-[10px] text-[var(--lc-text-muted)]">{template.description}</p>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        <button type="button" onClick={onOpen} className="lc-btn lc-btn-primary !py-0.5 !px-2 !text-[10px]">
          <Pencil size={11} /> Open
        </button>
        <button type="button" onClick={onPreview} className="lc-btn lc-btn-outline !py-0.5 !px-2 !text-[10px]">
          <Eye size={11} /> Preview
        </button>
        {!builtin && onExport && (
          <button type="button" onClick={onExport} className="lc-btn lc-btn-ghost !py-0.5 !px-2 !text-[10px]">
            <Download size={11} />
          </button>
        )}
        {!builtin && onSetDefault && (
          <button type="button" onClick={onSetDefault} className="lc-btn lc-btn-ghost !py-0.5 !px-2 !text-[10px]" title="Set as default">
            <Star size={11} />
          </button>
        )}
        {!builtin && onDelete && (
          <button type="button" onClick={onDelete} className="lc-btn lc-btn-ghost !py-0.5 !px-2 !text-[10px] !text-red-500">
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function TemplateGallery() {
  const open = useLabelStore((s) => s.showTemplateGallery)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const setModal = useLabelStore((s) => s.setModal)
  const templateLibrary = useLabelStore((s) => s.templateLibrary)
  const defaultTemplateId = useLabelStore((s) => s.defaultTemplateId)
  const loadFromLibrary = useLabelStore((s) => s.loadFromLibrary)
  const loadBuiltinTemplate = useLabelStore((s) => s.loadBuiltinTemplate)
  const saveToLibrary = useLabelStore((s) => s.saveToLibrary)
  const deleteFromLibrary = useLabelStore((s) => s.deleteFromLibrary)
  const setDefaultTemplate = useLabelStore((s) => s.setDefaultTemplate)
  const exportTemplateJsonById = useLabelStore((s) => s.exportTemplateJsonById)
  const exportAllTemplatesJson = useLabelStore((s) => s.exportAllTemplatesJson)
  const pickAndImportJsonFile = useLabelStore((s) => s.pickAndImportJsonFile)
  const refreshTemplateLibrary = useLabelStore((s) => s.refreshTemplateLibrary)
  const applySizePreset = useLabelStore((s) => s.applySizePreset)

  const [previewTpl, setPreviewTpl] = useState(null)

  if (!open) return null

  const userTemplates = templateLibrary.filter((t) => !t.builtin && !isBuiltinId(t.id))
  const byType = (type) => userTemplates.filter((t) => (t.labelType || 'production') === type)

  const openPreview = (tpl, builtin) => {
    setPreviewTpl(builtin ? getBuiltinTemplateConfig(tpl.id) : tpl)
  }

  return (
    <>
      <div className="lc-modal-overlay">
        <div className="lc-modal lc-gallery-modal !max-w-4xl !max-h-[90vh] flex flex-col">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Label Template Gallery</h2>
              <p className="text-xs text-[var(--lc-text-muted)]">
                Import, export, preview and manage Opti-compatible JSON templates
              </p>
            </div>
            <button type="button" onClick={() => setPrintConfig({ showTemplateGallery: false })} className="lc-icon-btn">
              <X size={16} />
            </button>
          </div>

          {/* Toolbar */}
          <div className="mb-4 flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={() => setModal('showNewModal', true)} className="lc-btn lc-btn-primary !text-xs">
              <Plus size={13} /> New Template
            </button>
            <button type="button" onClick={pickAndImportJsonFile} className="lc-btn lc-btn-outline !text-xs">
              <Upload size={13} /> Import JSON
            </button>
            <button type="button" onClick={exportAllTemplatesJson} className="lc-btn lc-btn-outline !text-xs">
              <FolderDown size={13} /> Export All
            </button>
            <button type="button" onClick={saveToLibrary} className="lc-btn lc-btn-outline !text-xs">
              <Download size={13} /> Save Current
            </button>
            <button type="button" onClick={refreshTemplateLibrary} className="lc-btn lc-btn-ghost !text-xs">
              Refresh
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
            {/* Size presets */}
            {SIZE_PRESET_GROUPS.map((group) => (
              <section key={group.id}>
                <h3 className="lc-section-label">{group.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.presets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { applySizePreset(p); setPrintConfig({ showTemplateGallery: false }) }}
                      className="lc-btn lc-btn-outline !text-xs"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </section>
            ))}

            {/* Built-in */}
            <section>
              <h3 className="lc-section-label">Designed templates (built-in)</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {BUILTIN_TEMPLATES.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    builtin
                    isDefault={defaultTemplateId === t.id}
                    onOpen={() => loadBuiltinTemplate(t.id)}
                    onPreview={() => openPreview(t, true)}
                    onSetDefault={() => setDefaultTemplate(t.id)}
                  />
                ))}
              </div>
            </section>

            {/* User templates by type */}
            {[
              { key: 'production', title: 'Production labels' },
              { key: 'sample', title: 'Sample labels' },
              { key: 'offcut', title: 'Offcut labels' },
            ].map(({ key, title }) => {
              const list = byType(key)
              if (!list.length) return null
              return (
                <section key={key}>
                  <h3 className="lc-section-label">{title}</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {list.map((t) => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        isDefault={defaultTemplateId === t.id}
                        onOpen={() => loadFromLibrary(t.id)}
                        onPreview={() => openPreview(t, false)}
                        onExport={() => exportTemplateJsonById(t.id)}
                        onDelete={() => { if (confirm(`Delete "${t.name}"?`)) deleteFromLibrary(t.id) }}
                        onSetDefault={() => setDefaultTemplate(t.id)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}

            {userTemplates.length === 0 && (
              <div className="lc-gallery-empty rounded-xl p-8 text-center">
                <p className="text-sm font-medium text-[var(--lc-text)]">No saved templates yet</p>
                <p className="mt-1 text-xs text-[var(--lc-text-muted)]">
                  Import a JSON file from Opti, or design a label and click Save Current.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Large preview dialog */}
      {previewTpl && (
        <div className="lc-modal-overlay !z-[60]">
          <div className="lc-modal !max-w-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">{previewTpl.name}</h3>
              <button type="button" onClick={() => setPreviewTpl(null)} className="lc-icon-btn">
                <X size={16} />
              </button>
            </div>
            <TemplatePreviewThumb template={previewTpl} large />
            <p className="mt-2 text-center text-[11px] text-[var(--lc-text-muted)]">
              {formatTemplateSize(previewTpl)} · live preview with sample data
            </p>
          </div>
        </div>
      )}
    </>
  )
}
