import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link2, X, Check, Eye, Unlink, Database, FileText, Braces, TypeIcon } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { catalogForClient } from '../data/fieldCatalog'
import { resolveMappedPreview } from '../utils/template'

const TABS = [
  { id: 'slot', label: 'Note slot', Icon: FileText },
  { id: 'field', label: 'Piece / order field', Icon: Database },
  { id: 'tokens', label: 'Text with tokens', Icon: Braces },
  { id: 'fixed', label: 'Fixed text', Icon: TypeIcon },
]

const EMPTY_OPTIONS = [
  { id: 'blank', label: 'Print nothing' },
  { id: 'hide', label: 'Hide element' },
]

export default function MappingDialog({ field, onSave, onClose }) {
  const allFields = useLabelStore((s) => s.fields) || []
  const labelData = useLabelStore((s) => s.labelData) || {}
  const realDataInfo = useLabelStore((s) => s.realDataInfo)
  const client = useLabelStore((s) => s.client)
  const fieldCatalog = useLabelStore((s) => s.fieldCatalog)
  const catalog = useMemo(
    () => (client === 'erp' ? fieldCatalog || [] : catalogForClient('opti')),
    [client, fieldCatalog],
  )

  const noteNumber = Number(field?.noteField) || 0
  const [activeTab, setActiveTab] = useState(
    noteNumber > 0 ? 'slot' : (field?.source?.length ? 'field' : 'fixed'),
  )
  const [note, setNote] = useState(noteNumber || 1)
  const [sub, setSub] = useState(Number(field?.subField) || 1)
  const [page, setPage] = useState(1)
  const [ifEmpty, setIfEmpty] = useState(field?.ifEmpty || 'blank')
  const [source, setSource] = useState(field?.source?.[0] || catalog[0]?.key || '')
  const [tokens, setTokens] = useState(
    typeof field?.value === 'string' && field.value.includes('{{') ? field.value : 'Order {{orderNumber}}',
  )
  const [fixed, setFixed] = useState(
    typeof field?.value === 'string' && !field.value.includes('{{') ? field.value : '',
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // A slot already used by another element is greyed out but still selectable.
  const isSlotUsed = (n, s) =>
    allFields.some(
      (f) => f.fieldKey !== field?.fieldKey && Number(f.noteField) === n && Number(f.subField) === s,
    )

  const slotRange = page === 1 ? Array.from({ length: 20 }, (_, i) => i + 1) : Array.from({ length: 30 }, (_, i) => i + 21)
  const previewKey = activeTab === 'slot' ? `N${note}F${sub}` : (source || 'key')

  // Live result: the key plus the real value when data is loaded (spec §5.2).
  const liveValue = useMemo(() => {
    const probe = {
      noteField: activeTab === 'slot' ? note : 0,
      subField: activeTab === 'slot' ? sub : 0,
      source: activeTab === 'field' && source ? [source] : [],
      value: activeTab === 'tokens' ? tokens : activeTab === 'fixed' ? fixed : field?.value,
      fallbackValue: '',
    }
    const resolved = resolveMappedPreview(probe, labelData)
    if (resolved != null && String(resolved).trim() !== '') return String(resolved)
    return null
  }, [activeTab, note, sub, source, tokens, fixed, field?.value, labelData])

  const handleApply = () => {
    const patch = { ifEmpty, source: [], value: undefined }
    if (activeTab === 'slot') {
      patch.noteField = note
      patch.subField = sub
      patch.value = undefined
    } else if (activeTab === 'field') {
      patch.noteField = 0
      patch.subField = 0
      patch.source = [source]
      patch.value = `{{${source}}}`
    } else if (activeTab === 'tokens') {
      patch.noteField = 0
      patch.subField = 0
      patch.value = tokens
    } else {
      patch.noteField = 0
      patch.subField = 0
      patch.value = fixed
    }
    onSave?.(patch)
    onClose?.()
  }

  const handleRemove = () => {
    onSave?.({ noteField: 0, subField: 0, source: [], value: '', ifEmpty: 'blank' })
    onClose?.()
  }

  return createPortal(
    <div className="lc-modal-overlay" onClick={onClose}>
      <div
        className="lc-modal !max-w-[720px]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Data mapping"
      >
        <div className="lc-modal-head">
          <span className="lc-modal-head-icon">
            <Link2 size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="lc-dialog-title">Where does this value come from?</h2>
            <p className="mt-0.5 text-[13px] text-[var(--mut)]">
              {field?.label || 'Element'} · {client === 'erp' ? 'ERP' : 'Opti'} fields
            </p>
          </div>
          <button type="button" className="lc-icon-btn" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="lc-modal-body">
          {/* Four sources as tabs (spec §5.2) */}
          <div className="lc-segment mb-5">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={activeTab === id ? 'is-on' : ''}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-[168px_1fr]">
            {activeTab === 'slot' && (
              <>
                {/* Note column: number grid, not two long dropdowns */}
                <div>
                  <label className="lc-label mb-2 block">Note</label>
                  <div className="grid grid-cols-2 gap-2">
                    {slotRange.map((n) => {
                      const used = isSlotUsed(n, sub)
                      const on = note === n
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNote(n)}
                          className={`h-10 rounded-[10px] border text-[13px] font-semibold transition-colors ${
                            on
                              ? 'border-[var(--pri)] bg-[var(--pri)] text-white'
                              : used
                                ? 'border-[var(--line)] bg-[var(--bg)] text-[var(--mut)]'
                                : 'border-[var(--line)] bg-[var(--panel)] text-[var(--tx-2)] hover:border-[var(--pri)]'
                          }`}
                          title={used ? `Note ${n} is already used by another element` : `Note ${n}`}
                        >
                          {n}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage((p) => (p === 1 ? 2 : 1))}
                    className="lc-link mt-2 text-[12px]"
                  >
                    {page === 1 ? '21 – 50' : '1 – 20'}
                  </button>
                </div>

                {/* Field column */}
                <div>
                  <label className="lc-label mb-2 block">Field</label>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: page === 1 ? 20 : 30 }, (_, i) => (page === 1 ? i + 1 : i + 21)).map((n) => {
                      const used = isSlotUsed(note, n)
                      const on = sub === n
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setSub(n)}
                          className={`h-10 rounded-[10px] border text-[13px] font-semibold transition-colors ${
                            on
                              ? 'border-[var(--pri)] bg-[var(--pri)] text-white'
                              : used
                                ? 'border-[var(--line)] bg-[var(--bg)] text-[var(--mut)]'
                                : 'border-[var(--line)] bg-[var(--panel)] text-[var(--tx-2)] hover:border-[var(--pri)]'
                          }`}
                          title={used ? `Field ${n} is already used` : `Field ${n}`}
                        >
                          {n}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'field' && (
              <div className="sm:col-span-2">
                <label className="lc-label mb-2 block" htmlFor="mapping-source">
                  {client === 'erp' ? 'Order field' : 'Piece field'}
                </label>
                <select
                  id="mapping-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="lc-select !h-10"
                >
                  {catalog.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label || f.key} — {f.key}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[12px] text-[var(--mut)]">
                  The list comes from the field catalogue for the active client.
                </p>
              </div>
            )}

            {activeTab === 'tokens' && (
              <div className="sm:col-span-2">
                <label className="lc-label mb-2 block" htmlFor="mapping-tokens">
                  Text with tokens
                </label>
                <textarea
                  id="mapping-tokens"
                  rows={3}
                  value={tokens}
                  onChange={(e) => setTokens(e.target.value)}
                  className="lc-input font-[var(--mono)] !text-[12.5px]"
                />
                <p className="mt-2 text-[12px] text-[var(--mut)]">
                  Wrap a field key in double braces, for example{' '}
                  <span className="lc-mono">{'{{orderNumber}}'}</span>. Tokens are resolved first.
                </p>
              </div>
            )}

            {activeTab === 'fixed' && (
              <div className="sm:col-span-2">
                <label className="lc-label mb-2 block" htmlFor="mapping-fixed">
                  Fixed text
                </label>
                <input
                  id="mapping-fixed"
                  type="text"
                  value={fixed}
                  onChange={(e) => setFixed(e.target.value)}
                  placeholder="Text printed on every label"
                  className="lc-input !h-10"
                />
                <p className="mt-2 text-[12px] text-[var(--mut)]">
                  Nothing is substituted — the same words print every time.
                </p>
              </div>
            )}
          </div>

          {/* If empty — replaces the old fake fallback value (spec §5.2) */}
          <div className="lc-divider my-5" />
          <div className="max-w-[280px]">
            <label className="lc-label mb-2 block" htmlFor="mapping-ifempty">
              If the slot is empty
            </label>
            <select
              id="mapping-ifempty"
              value={ifEmpty}
              onChange={(e) => setIfEmpty(e.target.value)}
              className="lc-select !h-10"
            >
              {EMPTY_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Live result */}
          <div className="mt-5 rounded-[10px] border border-[var(--line)] bg-[var(--bg)] p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-[var(--line)] bg-[var(--panel)] text-[var(--mut)]">
                <Eye size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[var(--tx)]">Live result</p>
                <p className="lc-mono text-[12px] text-[var(--mut)]">
                  {activeTab === 'slot' ? `note${note}.field${sub}` : previewKey}
                  <span className="mx-1.5">·</span>shows
                  <span className="ml-1 font-bold text-[var(--pri)]">{previewKey}</span>
                </p>
              </div>
            </div>
            <p className="mt-2.5 border-t border-[var(--line)] pt-2.5 text-[13px] text-[var(--tx-2)]">
              {liveValue ?? (
                <span className="text-[var(--mut)]">
                  No value —{' '}
                  {realDataInfo
                    ? 'this piece has nothing in that slot.'
                    : 'load real data to see the value here.'}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="lc-modal-foot">
          <button type="button" onClick={handleRemove} className="lc-btn lc-btn-ghost mr-auto">
            <Unlink size={14} />
            <span>Remove mapping</span>
          </button>
          <button type="button" onClick={onClose} className="lc-btn lc-btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleApply} className="lc-btn lc-btn-primary">
            <Check size={14} />
            <span>Apply</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}