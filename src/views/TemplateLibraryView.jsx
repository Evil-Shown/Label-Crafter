import { useState } from 'react'
import {
  Search,
  Plus,
  ArrowUpDown,
  MoreVertical,
  Pencil,
  Copy,
  Download,
  Trash2,
  Star,
  Check,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { formatTemplateSize } from '../utils/units'
import TemplatePreviewThumb from '../ui/TemplatePreviewThumb'

export default function TemplateLibraryView() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all' | 'production' | 'offcut'
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState(null)
  const [deleteInputName, setDeleteInputName] = useState('')

  const client = useLabelStore((s) => s.client)
  const templateLibrary = useLabelStore((s) => s.templateLibrary)
  const defaultTemplateId = useLabelStore((s) => s.defaultTemplateId)
  const currentTemplateId = useLabelStore((s) => s.id)
  const loadFromLibrary = useLabelStore((s) => s.loadFromLibrary)
  const deleteFromLibrary = useLabelStore((s) => s.deleteFromLibrary)
  const setDefaultTemplate = useLabelStore((s) => s.setDefaultTemplate)
  const exportCurrentTemplateJson = useLabelStore((s) => s.exportCurrentTemplateJson)
  const exportAllTemplatesJson = useLabelStore((s) => s.exportAllTemplatesJson)
  const pickAndImportJsonFile = useLabelStore((s) => s.pickAndImportJsonFile)
  const setActiveTab = useLabelStore((s) => s.setActiveTab)
  const setModal = useLabelStore((s) => s.setModal)
  const addToast = useLabelStore((s) => s.addToast)

  // Filter templates for current client
  const clientTemplates = templateLibrary.filter((t) => {
    // If tagged with client or default
    return !t.client || t.client === client
  })

  const filtered = clientTemplates.filter((t) => {
    const matchesSearch = (t.name || t.id).toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (filterType === 'production') return t.labelType === 'production'
    if (filterType === 'offcut') return t.labelType === 'offcut'
    return true
  })

  const prodCount = clientTemplates.filter((t) => t.labelType === 'production').length
  const offcutCount = clientTemplates.filter((t) => t.labelType === 'offcut').length

  const handleOpen = (tpl) => {
    loadFromLibrary(tpl.id)
    setActiveTab('design')
  }

  const handleDuplicate = (tpl) => {
    const copy = {
      ...tpl,
      id: `LBL_${Date.now().toString().slice(-4)}`,
      name: `${tpl.name} (Copy)`,
      updatedAt: new Date().toISOString(),
    }
    useLabelStore.getState().importTemplate(copy)
    useLabelStore.getState().saveToLibrary()
    addToast({ message: `Duplicated “${tpl.name}”`, type: 'success' })
    setActiveMenuId(null)
  }

  const handleDelete = () => {
    if (!deleteConfirmTemplate) return
    if (deleteConfirmTemplate.id === defaultTemplateId) {
      addToast({ message: 'The default template cannot be deleted', type: 'error' })
      return
    }
    if (deleteInputName !== deleteConfirmTemplate.name) {
      addToast({ message: 'Name does not match', type: 'error' })
      return
    }
    deleteFromLibrary(deleteConfirmTemplate.id)
    setDeleteConfirmTemplate(null)
    setDeleteInputName('')
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-[var(--bg)] p-8 text-[var(--tx)] select-none">
      {/* Title & Stats */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black capitalize tracking-tight text-[var(--tx)]">
            {client === 'erp' ? 'ERP templates' : 'Opti templates'}
          </h1>
          <p className="mt-1 text-xs text-[var(--mut)]">
            {clientTemplates.length} templates in the shared database · {client === 'erp' ? 'ERP' : 'Opti'} picks its default from here
          </p>
        </div>

        {/* Global actions: Search, Import, Export, New */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[var(--mut)]" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-lg border border-[var(--line)] bg-[var(--panel)] pl-9 pr-3 text-xs text-[var(--tx)] placeholder:text-[var(--mut)] focus:border-[var(--pri)] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={pickAndImportJsonFile}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-xs font-semibold text-[var(--tx)] hover:bg-[var(--line-subtle)]"
          >
            Import JSON
          </button>

          <button
            type="button"
            onClick={exportAllTemplatesJson}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-xs font-semibold text-[var(--tx)] hover:bg-[var(--line-subtle)]"
          >
            Export all
          </button>

          <button
            type="button"
            onClick={() => setModal('showNewModal', true)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[var(--pri)] px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={14} />
            <span>New template</span>
          </button>
        </div>
      </div>

      {/* Filter Chips & Sort */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-blue-100 text-[var(--pri)] dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-[var(--mut)] hover:text-[var(--tx)]'
            }`}
          >
            All · {clientTemplates.length}
          </button>
          <button
            type="button"
            onClick={() => setFilterType('production')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
              filterType === 'production'
                ? 'bg-blue-100 text-[var(--pri)] dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-[var(--mut)] hover:text-[var(--tx)]'
            }`}
          >
            Production · {prodCount}
          </button>
          <button
            type="button"
            onClick={() => setFilterType('offcut')}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
              filterType === 'offcut'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'text-[var(--mut)] hover:text-[var(--tx)]'
            }`}
          >
            Offcut · {offcutCount}
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--mut)]">
          <span>Sort:</span>
          <span className="font-semibold text-[var(--tx)]">Last edited ▾</span>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {filtered.map((tpl) => {
          const isDefault = tpl.id === defaultTemplateId || tpl.isDefault
          const isCurrent = tpl.id === currentTemplateId
          const isOffcut = tpl.labelType === 'offcut'

          return (
            <div
              key={tpl.id}
              className={`relative flex flex-col justify-between rounded-xl border bg-[var(--panel)] p-4 shadow-sm transition-all hover:shadow-md ${
                isDefault
                  ? 'border-2 border-emerald-500 shadow-emerald-500/10'
                  : isOffcut && isDefault
                  ? 'border-2 border-amber-500'
                  : 'border-[var(--line)]'
              }`}
            >
              {/* Preview Box */}
              <div
                onClick={() => handleOpen(tpl)}
                className="flex h-36 items-center justify-center rounded-lg bg-[var(--bg)] p-2 cursor-pointer border border-[var(--line-subtle)]"
              >
                <div className="flex h-28 w-20 flex-col items-center justify-between rounded border border-slate-300 bg-white p-2 shadow-xs dark:border-slate-700">
                  <div className="h-1.5 w-full rounded bg-slate-800" />
                  <div className="space-y-1 w-full">
                    <div className="h-4 w-full bg-slate-200" />
                    <div className="h-1 w-3/4 bg-slate-300" />
                    <div className="h-1 w-1/2 bg-slate-300" />
                  </div>
                  <div className="h-1 w-full bg-slate-200" />
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <h3 className="truncate font-bold text-sm text-[var(--tx)]" title={tpl.name}>
                    {tpl.name}
                  </h3>
                  {isDefault && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      ★ Default
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-[var(--mut)]">
                  {Math.round(tpl.width)} × {Math.round(tpl.height)} mm · {tpl.labelType} · edited 2 Oct
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 flex items-center justify-between gap-1.5 pt-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => handleOpen(tpl)}
                  className="flex-1 rounded-md bg-[var(--pri)] py-1.5 text-center text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                >
                  Open
                </button>

                {isDefault ? (
                  <button
                    type="button"
                    onClick={() => handleDuplicate(tpl)}
                    className="flex-1 rounded-md border border-[var(--line)] py-1.5 text-center text-xs font-semibold text-[var(--tx)] hover:bg-[var(--line-subtle)]"
                  >
                    Duplicate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDefaultTemplate(tpl.id)}
                    className="flex-1 rounded-md border border-[var(--line)] py-1.5 text-center text-xs font-semibold text-[var(--tx)] hover:bg-[var(--line-subtle)]"
                  >
                    Set default
                  </button>
                )}

                {/* ⋯ Three dots menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveMenuId(activeMenuId === tpl.id ? null : tpl.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] text-[var(--mut)] hover:text-[var(--tx)]"
                  >
                    <MoreVertical size={13} />
                  </button>

                  {activeMenuId === tpl.id && (
                    <div className="absolute bottom-8 right-0 z-50 w-36 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-1 shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setDefaultTemplate(tpl.id)
                          setActiveMenuId(null)
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--tx)] hover:bg-[var(--line-subtle)]"
                      >
                        <Star size={12} /> Set as default
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(tpl)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--tx)] hover:bg-[var(--line-subtle)]"
                      >
                        <Copy size={12} /> Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          exportCurrentTemplateJson()
                          setActiveMenuId(null)
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--tx)] hover:bg-[var(--line-subtle)]"
                      >
                        <Download size={12} /> Export JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmTemplate(tpl)
                          setActiveMenuId(null)
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 size={12} /> Delete...
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation Modal (Screen 7.3 / delete.png) */}
      {deleteConfirmTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950">
                <Trash2 size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[var(--tx)]">
                  Delete “{deleteConfirmTemplate.name}”?
                </h3>
                <p className="mt-1 text-xs text-[var(--mut)]">
                  This removes it from the shared database for {client === 'erp' ? 'ERP' : 'Opti'}. It cannot be undone.
                </p>
              </div>
            </div>

            {deleteConfirmTemplate.id === defaultTemplateId ? (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                ⚠️ The default template cannot be deleted. Set another default first.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <label className="block text-xs font-semibold text-[var(--mut)]">
                  Type the template name to confirm
                </label>
                <input
                  type="text"
                  placeholder={deleteConfirmTemplate.name}
                  value={deleteInputName}
                  onChange={(e) => setDeleteInputName(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs text-[var(--tx)] focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmTemplate(null)
                  setDeleteInputName('')
                }}
                className="rounded-lg border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--tx)] hover:bg-[var(--line-subtle)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmTemplate.id === defaultTemplateId || deleteInputName !== deleteConfirmTemplate.name}
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                Delete template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
