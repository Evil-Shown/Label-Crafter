import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function ServerLibraryModal() {
  const open = useLabelStore((s) => s.showServerLibrary)
  const setModal = useLabelStore((s) => s.setModal)
  const client = useLabelStore((s) => s.client)
  const refreshServerLibrary = useLabelStore((s) => s.refreshServerLibrary)
  const loadServerTemplate = useLabelStore((s) => s.loadServerTemplate)
  const serverTemplates = useLabelStore((s) => s.serverTemplates)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError('')
    refreshServerLibrary()
      .catch((err) => setError(err.message || 'Could not reach the label service'))
      .finally(() => setLoading(false))
  }, [open, client, refreshServerLibrary])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-6">
      <div className="flex max-h-[80%] w-[640px] flex-col rounded-xl border border-[var(--lc-panel-border)] bg-[var(--lc-panel)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--lc-panel-border)] px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--lc-text)]">Templates on label service</h2>
            <p className="text-[11px] text-[var(--lc-text-muted)]">
              {client === 'erp' ? 'ERP' : 'Opti'} designs. Opti and ERP lists stay separate.
            </p>
          </div>
          <button type="button" className="lc-btn lc-btn-ghost" onClick={() => setModal('showServerLibrary', false)}>
            <X size={14} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3">
          {loading && <p className="text-xs text-[var(--lc-text-muted)]">Loading…</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}
          {!loading && !error && serverTemplates.length === 0 && (
            <p className="text-xs text-[var(--lc-text-muted)]">No templates saved for this client yet.</p>
          )}
          <div className="space-y-2">
            {serverTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => loadServerTemplate(tpl.id)}
                className="flex w-full items-center justify-between rounded-lg border border-[var(--lc-panel-border)] px-3 py-2 text-left hover:bg-[var(--lc-hover)]"
              >
                <span>
                  <span className="block text-xs font-bold text-[var(--lc-text)]">{tpl.name || tpl.id}</span>
                  <span className="font-mono text-[10px] text-[var(--lc-text-muted)]">{tpl.id}</span>
                </span>
                <span className="text-[10px] uppercase text-[var(--lc-text-muted)]">{tpl.labelType || 'production'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
