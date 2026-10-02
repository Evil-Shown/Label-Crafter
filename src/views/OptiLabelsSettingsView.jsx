import { useEffect, useMemo, useState } from 'react'
import {
  RefreshCw,
  ExternalLink,
  Tag,
  Scissors,
  Eye,
  Check,
  CircleCheck,
  TriangleAlert,
  PenTool,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { formatSize } from '../utils/units'
import TemplatePreviewThumb from '../ui/TemplatePreviewThumb'

/**
 * Screen 10.1 — Opti no longer contains a designer. It lists the templates it
 * can print and picks one default for production and one for offcut (R6).
 */
export default function OptiLabelsSettingsView() {
  const client = useLabelStore((s) => s.client)
  const templateLibrary = useLabelStore((s) => s.templateLibrary)
  const defaultTemplateId = useLabelStore((s) => s.defaultTemplateId)
  const setDefaultTemplate = useLabelStore((s) => s.setDefaultTemplate)
  const refreshTemplateLibrary = useLabelStore((s) => s.refreshTemplateLibrary)
  const refreshServerLibrary = useLabelStore((s) => s.refreshServerLibrary)
  const setActiveTab = useLabelStore((s) => s.setActiveTab)
  const addToast = useLabelStore((s) => s.addToast)

  const [prodId, setProdId] = useState(null)
  const [offcutId, setOffcutId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [source, setSource] = useState('library')

  const options = useMemo(
    () => templateLibrary.filter((t) => (t.client || 'opti') === client),
    [templateLibrary, client],
  )
  const production = options.filter((t) => (t.labelType || 'production') === 'production')
  const offcut = options.filter((t) => t.labelType === 'offcut')

  // Default to whatever the database already has marked as default.
  useEffect(() => {
    const storeDefault = options.find((t) => t.id === defaultTemplateId)
    if (storeDefault) {
      if ((storeDefault.labelType || 'production') === 'production') setProdId(storeDefault.id)
      else setOffcutId(storeDefault.id)
      return
    }
    setProdId((p) => (p && production.some((t) => t.id === p) ? p : production[0]?.id || null))
    setOffcutId((o) => (o && offcut.some((t) => t.id === o) ? o : offcut[0]?.id || null))
  }, [options, defaultTemplateId, production, offcut])

  const refresh = async () => {
    setRefreshing(true)
    setSource('library')
    try {
      // Prefer the shared database; fall back to the local library when offline.
      await refreshServerLibrary()
      setSource('server')
      addToast({ message: 'Templates reloaded from the database', type: 'success' })
    } catch {
      refreshTemplateLibrary()
      setSource('library')
      addToast({
        message: 'Database unreachable — showing the templates stored on this PC',
        type: 'warning',
      })
    } finally {
      setRefreshing(false)
    }
  }

  const pick = (id, kind) => {
    if (kind === 'production') setProdId(id)
    else setOffcutId(id)
    setDefaultTemplate(id)
    const tpl = options.find((t) => t.id === id)
    addToast({ message: `${kind === 'production' ? 'Production' : 'Offcut'} default set to ${tpl?.name || id}`, type: 'success' })
  }

  const chosen = options.find((t) => t.id === prodId) || production[0] || options[0]

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--bg)] px-8 py-7 text-[var(--tx)] select-none">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[12px] font-semibold text-[var(--mut)]">
            SPIL Opti › Settings › Labels
          </p>
          <h1 className="lc-page-title">Label templates</h1>
          <p className="mt-1 text-[13px] text-[var(--mut)]">
            Opti prints with these templates. Designing happens in the Label Designer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="lc-badge lc-badge-neutral">
            {source === 'server' ? 'From database' : 'Stored on this PC'}
          </span>
          <button type="button" onClick={refresh} disabled={refreshing} className="lc-btn lc-btn-secondary !h-10">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
          <button type="button" onClick={() => setActiveTab('design')} className="lc-btn lc-btn-primary !h-10">
            <PenTool size={15} />
            <span>Open Label Designer</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Picker
          title="Production label"
          hint="Printed on every finished piece."
          icon={Tag}
          items={production}
          selectedId={prodId}
          savedDefaultId={defaultTemplateId}
          onSelect={(id) => pick(id, 'production')}
        />
        <Picker
          title="Offcut label"
          hint="Printed on offcuts."
          icon={Scissors}
          items={offcut}
          selectedId={offcutId}
          savedDefaultId={defaultTemplateId}
          onSelect={(id) => pick(id, 'offcut')}
          warn
        />

        <section className="lc-card flex flex-col p-5">
          <div className="mb-3 flex items-center gap-2">
            <Eye size={16} className="text-[var(--mut)]" />
            <h2 className="lc-section-title">Preview · {chosen?.name || '—'}</h2>
          </div>
          {chosen ? (
            <>
              <div className="lc-preview-frame flex-1 py-4">
                <TemplatePreviewThumb template={chosen} large />
              </div>
              <p className="mt-3 text-[12px] text-[var(--mut)]">
                {formatSize(chosen.width, chosen.height)} ·{' '}
                {chosen.labelType === 'offcut' ? 'Offcut' : 'Production'} ·{' '}
                <span className="lc-mono">{chosen.id}</span>
              </p>
            </>
          ) : (
            <p className="py-10 text-center text-[13px] text-[var(--mut)]">
              No template is available yet.
            </p>
          )}
        </section>
      </div>

      {options.length === 0 && (
        <div className="lc-card lc-empty-state mt-6">
          <span className="lc-empty-icon">
            <TriangleAlert size={22} />
          </span>
          <div>
            <h2 className="lc-dialog-title">No templates yet</h2>
            <p className="mt-1 max-w-[520px] text-[13px] text-[var(--mut)]">
              Create a label template in the Label Designer, then come back to choose it as the
              default. Opti can only read templates — it never creates or edits them.
            </p>
          </div>
          <button type="button" onClick={() => setActiveTab('design')} className="lc-btn lc-btn-primary mt-1">
            <PenTool size={15} />
            <span>Open Label Designer</span>
          </button>
        </div>
      )}
    </div>
  )
}

function Picker({ title, hint, icon: Icon, items, selectedId, savedDefaultId, onSelect, warn }) {
  return (
    <section className="lc-card flex flex-col p-5">
      <div className="mb-1 flex items-center gap-2">
        <Icon size={16} className={warn ? 'text-[var(--warn)]' : 'text-[var(--mut)]'} />
        <h2 className="lc-section-title">{title}</h2>
      </div>
      <p className="mb-4 text-[12px] text-[var(--mut)]">{hint}</p>

      {items.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-[var(--line)] px-4 py-6 text-center text-[13px] text-[var(--mut)]">
          No {title.toLowerCase()} templates.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((t) => {
            const on = selectedId === t.id
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onSelect(t.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-colors ${
                    on
                      ? 'border-[var(--pri)] bg-[var(--panel)]'
                      : 'border-[var(--line)] bg-[var(--panel)] hover:border-[var(--mut)]'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
                      on ? 'border-[var(--pri)]' : 'border-[var(--line)]'
                    }`}
                  >
                    {on && <span className="h-2 w-2 rounded-full bg-[var(--pri)]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-[var(--tx)]">
                      {t.name}
                    </span>
                    <span className="block text-[12px] text-[var(--mut)]">
                      {formatSize(t.width, t.height)}
                    </span>
                  </span>
                  {t.id === savedDefaultId && (
                    <span className={`lc-badge flex-none ${warn ? 'lc-badge-warn' : 'lc-badge-ok'}`}>
                      <Check size={11} />
                      Current
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}