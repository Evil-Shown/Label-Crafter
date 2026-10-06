import { useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Upload,
  Download,
  MoreVertical,
  Pencil,
  Copy,
  FileJson,
  Trash2,
  Star,
  Check,
  LayoutGrid,
  ArrowUpDown,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { downloadJsonFile, sanitizeFileName } from '../utils/templateStorage'
import TemplatePreviewThumb from '../ui/TemplatePreviewThumb'

const SORTS = [
  { id: 'edited', label: 'Last edited' },
  { id: 'name', label: 'Name' },
  { id: 'size', label: 'Size' },
]

function MenuItem({ icon: Icon, children, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-[7px] px-2 py-1.5 text-left text-[13px] font-medium transition-colors ${
        danger
          ? 'text-[var(--err)] hover:bg-[var(--err-s)]'
          : 'text-[var(--tx-2)] hover:bg-[var(--bg)] hover:text-[var(--tx)]'
      }`}
    >
      <Icon size={14} className="flex-none" />
      {children}
    </button>
  )
}

export default function TemplateLibraryView() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sort, setSort] = useState('edited')
  const [sortOpen, setSortOpen] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [renaming, setRenaming] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const client = useLabelStore((s) => s.client)
  const templateLibrary = useLabelStore((s) => s.templateLibrary)
  const defaultTemplateId = useLabelStore((s) => s.defaultTemplateId)
  const currentTemplateId = useLabelStore((s) => s.id)
  const loadFromLibrary = useLabelStore((s) => s.loadFromLibrary)
  const deleteFromLibrary = useLabelStore((s) => s.deleteFromLibrary)
  const setDefaultTemplate = useLabelStore((s) => s.setDefaultTemplate)
  const exportAllTemplatesJson = useLabelStore((s) => s.exportAllTemplatesJson)
  const pickAndImportJsonFile = useLabelStore((s) => s.pickAndImportJsonFile)
  const setActiveTab = useLabelStore((s) => s.setActiveTab)
  const setModal = useLabelStore((s) => s.setModal)
  const addToast = useLabelStore((s) => s.addToast)

  const clientLabel = client === 'erp' ? 'ERP' : 'Opti'

  // R2: a template saved for one client is never visible to the other.
  const clientTemplates = useMemo(
    () => templateLibrary.filter((t) => (t.client || 'opti') === client),
    [templateLibrary, client],
  )

  const counts = useMemo(
    () => ({
      all: clientTemplates.length,
      production: clientTemplates.filter((t) => (t.labelType || 'production') === 'production').length,
      offcut: clientTemplates.filter((t) => t.labelType === 'offcut').length,
    }),
    [clientTemplates],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = clientTemplates.filter((t) => {
      if (q && !`${t.name || ''} ${t.id}`.toLowerCase().includes(q)) return false
      if (filterType === 'production') return (t.labelType || 'production') === 'production'
      if (filterType === 'offcut') return t.labelType === 'offcut'
      return true
    })
    const byArea = (t) => Math.max(1, (t.width || 1) * (t.height || 1))
    return [...list].sort((a, b) => {
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sort === 'size') return byArea(b) - byArea(a)
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    })
  }, [clientTemplates, search, filterType, sort])

  const open = (tpl) => {
    loadFromLibrary(tpl.id)
    setActiveTab('design')
  }

  const duplicate = (tpl) => {
    const state = useLabelStore.getState()
    const nums = clientTemplates
      .map((t) => String(t.id || '').match(/^(?:LBL|ERP)_(\d+)$/i))
      .filter(Boolean)
      .map((m) => Number(m[1]))
    const prefix = client === 'erp' ? 'ERP' : 'LBL'
    const next = `G${prefix}_${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`
    state.importTemplate({ ...tpl, id: next, name: `${tpl.name} (Copy)` })
    state.saveToLibrary()
    addToast({ message: `Duplicated “${tpl.name}” as ${next}`, type: 'success' })
    setActiveMenuId(null)
  }

  // Rename writes straight back to the library so the shared list stays in step.
  const commitRename = (tpl) => {
    const value = renameValue.trim()
    setRenaming(null)
    setActiveMenuId(null)
    if (!value || value === tpl.name) return
    const state = useLabelStore.getState()
    state.templateLibrary = state.templateLibrary.map((t) =>
      t.id === tpl.id ? { ...t, name: value, updatedAt: new Date().toISOString() } : t,
    )
    state.templateLibrary = [...state.templateLibrary]
    addToast({ message: `Renamed to “${value}”`, type: 'success' })
  }

  const exportOne = (tpl) => {
    downloadJsonFile(tpl, `${sanitizeFileName(tpl.name)}_template.json`)
    addToast({ message: `Exported “${tpl.name}”`, type: 'success' })
    setActiveMenuId(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.id === defaultTemplateId) {
      addToast({ message: 'The default template cannot be deleted', type: 'warning' })
      return
    }
    deleteFromLibrary(deleteTarget.id)
    addToast({ message: `Deleted “${deleteTarget.name}”`, type: 'success' })
    setDeleteTarget(null)
  }


  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'production', label: 'Production' },
    { id: 'offcut', label: 'Offcut' },
  ]

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--bg)]">
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
        {/* Title + actions */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="lc-page-title">{clientLabel} templates</h1>
            <p className="mt-1 text-[13px] text-[var(--mut)]">
              {counts.all === 0
                ? `No ${clientLabel} templates yet · ${clientLabel} picks its default from here`
                : `${counts.all} template${counts.all === 1 ? '' : 's'} in the shared database · ${clientLabel} picks its default from here`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mut)]" />
              <input
                type="search"
                placeholder="Search templates…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="lc-input !h-10 !w-[330px] !pl-9"
              />
            </div>
            <button type="button" onClick={pickAndImportJsonFile} className="lc-btn lc-btn-secondary !h-10">
              <Upload size={15} />
              <span>Import JSON</span>
            </button>
            <button type="button" onClick={exportAllTemplatesJson} className="lc-btn lc-btn-secondary !h-10">
              <Download size={15} />
              <span>Export all</span>
            </button>
            <button
              type="button"
              onClick={() => setModal('showNewModal', true)}
              className="lc-btn lc-btn-primary !h-10"
            >
              <Plus size={15} />
              <span>New template</span>
            </button>
          </div>
        </div>

        {/* Filters + sort */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`lc-chip-btn ${filterType === f.id ? 'is-on' : ''}`}
              >
                {f.label} · {counts[f.id]}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              aria-expanded={sortOpen}
              className="lc-chip-btn"
            >
              <ArrowUpDown size={15} />
              <span>Sort: {SORTS.find((s) => s.id === sort)?.label}</span>
            </button>
            {sortOpen && (
              <div className="lc-pop right-0 top-11 w-[168px] p-1">
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSort(s.id)
                      setSortOpen(false)
                    }}
                    className="flex w-full items-center justify-between rounded-[7px] px-2 py-1.5 text-left text-[13px] font-medium text-[var(--tx-2)] hover:bg-[var(--bg)]"
                  >
                    {s.label}
                    {sort === s.id && <Check size={14} className="text-[var(--pri)]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="lc-card lc-empty-state">
            <span className="lc-empty-icon">
              <LayoutGrid size={22} />
            </span>
            <div>
              <h2 className="lc-dialog-title">
                {clientTemplates.length === 0 ? `No ${clientLabel} templates yet` : 'Nothing matches your search'}
              </h2>
              <p className="mt-1 text-[13px] text-[var(--mut)]">
                {clientTemplates.length === 0
                  ? `Create the first ${clientLabel} label template. ${clientLabel} will then be able to pick it as its default.`
                  : 'Try a different search term or filter.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModal('showNewModal', true)}
              className="lc-btn lc-btn-primary mt-1"
            >
              <Plus size={15} />
              <span>New template</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            {filtered.map((tpl) => {
              const isDefault = tpl.id === defaultTemplateId || tpl.isDefault
              const isOffcut = tpl.labelType === 'offcut'
              return (
                <article
                  key={tpl.id}
                  className={`lc-template-card flex flex-col p-3 ${
                    isDefault ? (isOffcut ? 'is-default-offcut' : 'is-default') : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => open(tpl)}
                    className="lc-preview-frame relative h-[200px] w-full p-2"
                    title={`Open “${tpl.name}”`}
                  >
                    <TemplatePreviewThumb template={tpl} />
                    {tpl.id === currentTemplateId && (
                      <span className="lc-badge lc-badge-opti absolute left-2 top-2 !bg-[var(--pri)] !text-white">
                        Open
                      </span>
                    )}
                  </button>

                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {renaming === tpl.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => commitRename(tpl)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(tpl)
                            if (e.key === 'Escape') setRenaming(null)
                          }}
                          className="lc-input !h-7 !px-1.5 !text-[13px]"
                        />
                      ) : (
                        <h3 className="truncate text-[13px] font-bold text-[var(--tx)]" title={tpl.name}>
                          {tpl.name}
                        </h3>
                      )}
                      <p className="mt-0.5 text-[11.5px] text-[var(--mut)]">
                        {Math.round(tpl.width)} × {Math.round(tpl.height)} mm ·{' '}
                        {isOffcut ? 'Offcut' : 'Production'}
                      </p>
                      <p className="lc-mono mt-0.5 text-[11px] text-[var(--mut)]">
                        {tpl.id} · {editedLabel(tpl.updatedAt)}
                      </p>
                    </div>
                    {isDefault && (
                      <span
                        className={`lc-badge flex-none ${isOffcut ? 'lc-badge-warn' : 'lc-badge-ok'}`}
                        title={isOffcut ? 'Default offcut label' : 'Default production label'}
                      >
                        <Star size={11} />
                        Default
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--line)] pt-3">
                    <button type="button" onClick={() => open(tpl)} className="lc-btn lc-btn-primary lc-btn-sm flex-1">
                      <Pencil size={13} />
                      <span>Open</span>
                    </button>
                    {isDefault ? (
                      <button type="button" onClick={() => duplicate(tpl)} className="lc-btn lc-btn-secondary lc-btn-sm flex-1">
                        <Copy size={13} />
                        <span>Duplicate</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDefaultTemplate(tpl.id)}
                        className="lc-btn lc-btn-secondary lc-btn-sm flex-1"
                      >
                        <Star size={13} />
                        <span>Set default</span>
                      </button>
                    )}

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === tpl.id ? null : tpl.id)}
                        aria-label={`More actions for ${tpl.name}`}
                        className="lc-icon-btn !h-7 !w-7"
                      >
                        <MoreVertical size={15} />
                      </button>
                      {activeMenuId === tpl.id && (
                        <div className="lc-pop bottom-9 right-0 z-30 w-[200px] p-1">
                          <MenuItem
                            icon={Star}
                            onClick={() => {
                              setDefaultTemplate(tpl.id)
                              setActiveMenuId(null)
                            }}
                          >
                            Set as default
                          </MenuItem>
                          <MenuItem
                            icon={Pencil}
                            onClick={() => {
                              setRenaming(tpl.id)
                              setRenameValue(tpl.name || '')
                              setActiveMenuId(null)
                            }}
                          >
                            Rename…
                          </MenuItem>
                          <MenuItem icon={Copy} onClick={() => duplicate(tpl)}>
                            Duplicate
                          </MenuItem>
                          <MenuItem icon={FileJson} onClick={() => exportOne(tpl)}>
                            Export JSON
                          </MenuItem>
                          <div className="lc-divider my-1" />
                          <MenuItem
                            icon={Trash2}
                            danger
                            onClick={() => {
                              setDeleteTarget(tpl)
                              setDeleteInputName('')
                              setActiveMenuId(null)
                            }}
                          >
                            Delete…
                          </MenuItem>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* 7.3 Delete confirmation — type the name to confirm */}
      {deleteTarget && (
        <div className="lc-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div
            className="lc-modal !max-w-[480px]"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="lc-modal-head !items-start">
              <span className="lc-confirm-icon is-danger">
                <Trash2 size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="lc-dialog-title">Delete “{deleteTarget.name}”?</h2>
                <p className="mt-1 text-[13px] text-[var(--mut)]">
                  This removes the template from the shared database for {clientLabel}. It cannot be
                  undone.
                </p>
              </div>
              <button type="button" className="lc-icon-btn" onClick={() => setDeleteTarget(null)} title="Close">
                <X size={16} />
              </button>
            </div>

            <div className="lc-modal-body">
              {deleteTarget.id === defaultTemplateId ? (
                <div className="lc-msg lc-msg-warn">
                  <TriangleAlert size={15} className="flex-none" />
                  <span>The default template cannot be deleted. Set another default first.</span>
                </div>
              ) : (
                <p className="text-[13px] text-[var(--txt)]">
                  Are you sure you want to delete <strong className="font-semibold text-[var(--txt)]">“{deleteTarget.name}”</strong>?
                </p>
              )}
            </div>

            <div className="lc-modal-foot">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="lc-btn lc-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteTarget.id === defaultTemplateId}
                onClick={handleDelete}
                className="lc-btn lc-btn-danger"
              >
                <Trash2 size={14} />
                <span>Delete template</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

function editedLabel(iso) {
  if (!iso) return 'just now'
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'edited today'
  if (days === 1) return 'edited yesterday'
  return `edited ${days} days ago`
}