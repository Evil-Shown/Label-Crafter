import { X, Download, Upload } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { BUILTIN_TEMPLATES, LABEL_SIZE_PRESETS } from '../data/templatePresets'

export default function TemplateGallery() {
  const open = useLabelStore((s) => s.showTemplateGallery)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const templateLibrary = useLabelStore((s) => s.templateLibrary)
  const loadFromLibrary = useLabelStore((s) => s.loadFromLibrary)
  const saveToLibrary = useLabelStore((s) => s.saveToLibrary)
  const createNewTemplate = useLabelStore((s) => s.createNewTemplate)
  const setLabelSize = useLabelStore((s) => s.setLabelSize)

  if (!open) return null

  return (
    <div className="lc-modal-overlay">
      <div className="lc-modal !max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">Template Gallery</h2>
          <button type="button" onClick={() => setPrintConfig({ showTemplateGallery: false })} className="lc-icon-btn">
            <X size={16} />
          </button>
        </div>

        <section className="mb-4">
          <h3 className="lc-section-label">Label size presets</h3>
          <div className="flex flex-wrap gap-2">
            {LABEL_SIZE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setLabelSize(p.width, p.height); setPrintConfig({ showTemplateGallery: false }) }}
                className="lc-btn lc-btn-outline !text-xs"
              >
                {p.name}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-4">
          <h3 className="lc-section-label">Built-in starters</h3>
          <div className="grid grid-cols-2 gap-2">
            {BUILTIN_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  createNewTemplate({ name: t.name, width: t.width, height: t.height, labelType: t.labelType })
                  setPrintConfig({ showTemplateGallery: false })
                }}
                className="rounded-lg border border-[var(--lc-panel-border)] p-3 text-left hover:border-[var(--lc-accent)] hover:bg-[var(--lc-accent-soft)]"
              >
                <div className="text-xs font-bold">{t.name}</div>
                <div className="text-[10px] text-[var(--lc-text-muted)]">{t.description}</div>
                <div className="mt-1 text-[10px]">{t.width}×{t.height} mm</div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="lc-section-label !mb-0">Your library</h3>
            <button type="button" onClick={saveToLibrary} className="lc-btn lc-btn-primary !py-1 !px-2 !text-xs">
              <Upload size={12} /> Save current
            </button>
          </div>
          {templateLibrary.length === 0 ? (
            <p className="text-xs text-[var(--lc-text-muted)]">No saved templates yet.</p>
          ) : (
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {templateLibrary.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => { loadFromLibrary(e.id); setPrintConfig({ showTemplateGallery: false }) }}
                  className="flex w-full items-center justify-between rounded-md border border-[var(--lc-panel-border)] px-3 py-2 text-left text-xs hover:bg-[var(--lc-accent-soft)]"
                >
                  <span className="font-semibold">{e.name}</span>
                  <span className="text-[var(--lc-text-muted)]">{new Date(e.savedAt).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
