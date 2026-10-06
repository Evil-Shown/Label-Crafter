import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { current, isDraft } from 'immer'
import {
  createBarcodeField,
  createCheckboxField,
  createBlackBoxTextField,
  createDxfShapeField,
  createEllipseField,
  createHeaderField,
  createImageField,
  createLineField,
  createQrField,
  createRectField,
  createRoundedRectField,
  createTableField,
  createTextField,
} from '../elements/factories'
import { buildExportTemplate, parseImportTemplate } from '../utils/template'
import { fieldRect } from '../utils/geometry'
import { computeFitView, mmToPx, toMm } from '../utils/units'
import {
  loadTemplates,
  saveTemplate,
  saveTemplates,
  deleteTemplate,
  generateNextTemplateId,
  detectLabelType,
  validateTemplateJson,
  downloadJsonFile,
  exportTemplatesToFolder,
  migrateLegacyLibrary,
  getDefaultTemplateId,
  setDefaultTemplateId,
  sanitizeFileName,
} from '../utils/templateStorage'
import { catalogForClient } from '../data/fieldCatalog'
import { SEED_TEMPLATES, MSG } from '../data/seedTemplates'
import { checkServiceHealth } from '../services/printService'
import {
  fetchDesignSession,
  fetchFieldCatalog,
  getServerTemplate,
  listServerTemplates,
  saveServerTemplate,
} from '../services/designApi'

const MAX_HISTORY = 80

/** Spec §8.2: database retry back-off in seconds. */
const DB_BACKOFF = [5, 10, 30]

migrateLegacyLibrary()

const defaultTemplate = () => ({
  ...MSG(),
  id: 'LBL_NEW',
  name: 'Standard Production Label',
})

/** Strip Immer proxies and non-serializable values before history/export clones. */
function plainValue(value) {
  return isDraft(value) ? current(value) : value
}

function jsonReplacer(_key, value) {
  if (value == null) return value
  if (typeof value === 'function') return undefined
  if (typeof Node !== 'undefined' && value instanceof Node) return undefined
  if (typeof value === 'object' && value.constructor?.name?.endsWith('Element')) return undefined
  return value
}

function cloneSerializable(value) {
  return JSON.parse(JSON.stringify(plainValue(value), jsonReplacer))
}

function templateSnapshot(state) {
  const margins = plainValue(state.margins) || {}
  const globalStyles = plainValue(state.globalStyles) || {}
  const groups = plainValue(state.groups) || {}
  return {
    id: state.id,
    name: state.name,
    width: state.width,
    height: state.height,
    unit: state.unit,
    labelType: state.labelType,
    printerDpi: state.printerDpi,
    margins: { ...margins },
    globalStyles: { ...globalStyles },
    fields: cloneSerializable(state.fields),
    groups: { ...groups },
  }
}

function snapshotKey(state) {
  return JSON.stringify(templateSnapshot(state))
}

/**
 * A host bag only counts as live data when it actually carries a printable value.
 * Opti sends `{ customerName: '', orderNumber: '' }` when no piece is loaded, so
 * key-count alone would wrongly claim "live data". Booleans are ignored: piece
 * flags (selected/locked/visible) are not printable label values.
 */
function hasRenderableData(data) {
  if (!data || typeof data !== 'object') return false
  const walk = (v) => {
    if (v == null) return false
    if (Array.isArray(v)) return v.some(walk)
    if (typeof v === 'object') return Object.values(v).some(walk)
    if (typeof v === 'number') return Number.isFinite(v)
    if (typeof v === 'string') return v.trim() !== ''
    return false
  }
  return Object.values(data).some(walk)
}

function unwrapSessionTemplate(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (raw.sections || Array.isArray(raw.fields)) return raw
  if (raw.template && typeof raw.template === 'object') return unwrapSessionTemplate(raw.template)
  return raw
}

export function getTemplateFingerprint(state) {
  return snapshotKey(state)
}

function sanitizeFieldPatch(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch
  return cloneSerializable(patch)
}

function applyTemplateSnapshot(st, data) {
  if (data.id != null) st.id = data.id
  st.name = data.name
  st.width = data.width
  st.height = data.height
  if (data.unit != null) st.unit = data.unit
  if (data.labelType != null) st.labelType = data.labelType
  if (data.printerDpi != null) st.printerDpi = data.printerDpi
  if (data.createdAt) st.createdAt = data.createdAt
  if (data.updatedAt) st.updatedAt = data.updatedAt
  st.margins = { ...data.margins }
  st.globalStyles = { ...data.globalStyles }
  st.fields = cloneSerializable(data.fields)
  st.groups = { ...(data.groups || {}) }
  st.selectedKeys = st.selectedKeys.filter((k) => st.fields.some((f) => f.fieldKey === k))
}

const initialTemplate = defaultTemplate()

/**
 * The shared database is not reachable until first-run setup finishes, so a new
 * PC starts from the built-in catalogue instead of an empty library.
 */
function initialTemplateLibrary() {
  const stored = loadTemplates()
  if (stored.length) return stored
  const now = new Date().toISOString()
  const seeded = SEED_TEMPLATES.map((tpl, i) => ({
    ...tpl,
    createdAt: tpl.updatedAt || now,
    updatedAt: tpl.updatedAt || new Date(Date.now() - (i + 1) * 86400000).toISOString(),
  }))
  saveTemplates(seeded)
  return seeded
}

export const useLabelStore = create(
  immer((set, get) => ({
    ...initialTemplate,
    theme: localStorage.getItem('lc-theme') || 'light',
    selectedKeys: [],
    activeTool: 'select',
    client: 'opti',
    /** Real host/session bag only — never fake OPTI_SAMPLE / ERP_SAMPLE. */
    labelData: {},
    fieldCatalog: catalogForClient('opti'),
    designSession: null,
    hostedInApp: false,
    /** True when Opti/ERP (or a design session) supplied previewData. */
    hasHostPreviewData: false,
    serverTemplates: [],
    showServerLibrary: false,
    printServiceUrl: localStorage.getItem('lc-print-service-url') || 'http://localhost:5088',
    printerBrand: localStorage.getItem('lc-printer-brand') || 'zebra',
    printerHost: localStorage.getItem('lc-printer-host') || '192.168.1.100',
    printerPort: Number(localStorage.getItem('lc-printer-port')) || 9100,
    snapToGrid: true,
    snapToElements: true,
    snapToEdges: true,
    gridMm: 1,
    showMargins: true,
    showRulers: true,
    thermalPreview: false,
    showLiveTokens: true,
    showZplPanel: false,
    showShortcuts: false,
    showTemplateGallery: false,
    showSampleDataEditor: false,
    showBatchPreview: false,
    showMinimap: true,
    showImportModal: false,
    pendingImport: null,
    defaultTemplateId: getDefaultTemplateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    zoom: 1,
    panX: 0,
    panY: 0,
    cursorPos: { x: 0, y: 0 },
    activeSnapGuides: [],
    rulerGuides: { h: [], v: [] },
    clipboard: null,
    groups: {},
    toasts: [],
    templateLibrary: initialTemplateLibrary(),
    zplPreview: '',
    showNewModal: false,
    showAddShapeModal: false,
    confirmDialog: null,
    activeTab: 'design', // 'design' | 'templates' | 'settings' | 'opti'
    showSplashScreen: true,
    firstTimeSetupOpen: false,
    dbStatus: 'connected', // 'connected' | 'offline'
    dbLatencyMs: 18,
    dbLastOkAt: Date.now(),
    dbRetryIn: 0,
    dbRetryStep: 0,
    dbServer: localStorage.getItem('lc-db-server') || 'SPIL-SQL01',
    dbDatabase: localStorage.getItem('lc-db-database') || 'SpilProduction',
    dbPort: Number(localStorage.getItem('lc-db-port')) || 1433,
    dbAuthType: localStorage.getItem('lc-db-auth') || 'windows', // 'windows' | 'sql'
    printServiceStatus: 'connected', // 'connected' | 'unreachable'
    printServiceLastOkAt: Date.now(),
    showConnectionPopover: false,
    showLoadDataModal: false,
    showExportDialog: false,
    showFieldPicker: false,
    fieldPickerAnchor: null,
    fieldPickerCallback: null,
    realDataInfo: null, // { source: 'Project 1265.oif', pieceIndex: 7, totalPieces: 42 }
    recentActivity: [
      { id: '1', time: 'Today 15:31', client: 'opti', text: 'MSG saved · revision 14' },
      { id: '2', time: 'Today 11:02', client: 'opti', text: 'Default set to MSG (from Opti)' },
      { id: '3', time: 'Yesterday', client: 'erp', text: 'Glass Order Label created' },
    ],
    showKeysOnCanvas: false,
    lastSavedAt: null,
    showGrid: true,
    showEdges: true,
    _history: [],
    _future: [],
    _savedSnapshot: snapshotKey(initialTemplate),

    addToast({ message, type = 'info', duration = 3200 }) {
      const id = `toast_${Date.now()}`
      set((st) => {
        st.toasts.push({ id, message, type, duration })
      })
    },
    removeToast(id) {
      set((st) => {
        st.toasts = st.toasts.filter((t) => t.id !== id)
      })
    },

    toggleTheme() {
      set((st) => {
        st.theme = st.theme === 'light' ? 'dark' : 'light'
        localStorage.setItem('lc-theme', st.theme)
        document.documentElement.setAttribute('data-theme', st.theme)
      })
    },

    setModal(modalName, isOpen) {
      set((st) => { st[modalName] = isOpen })
    },

    pushHistory() {
      const s = get()
      let snap
      try {
        snap = snapshotKey(s)
      } catch (err) {
        console.warn('pushHistory: snapshot failed', err)
        return
      }
      if (s._history.length && s._history[s._history.length - 1] === snap) return
      set((st) => {
        st._history.push(snap)
        if (st._history.length > MAX_HISTORY) st._history.shift()
        st._future = []
      })
    },

    clearHistory() {
      set((st) => {
        st._history = []
        st._future = []
      })
    },

    undo() {
      const { _history } = get()
      if (!_history.length) return
      set((st) => {
        st._future.unshift(snapshotKey(st))
        const prev = JSON.parse(st._history.pop())
        applyTemplateSnapshot(st, prev)
      })
    },

    redo() {
      const { _future } = get()
      if (!_future.length) return
      set((st) => {
        st._history.push(snapshotKey(st))
        const next = JSON.parse(st._future.shift())
        applyTemplateSnapshot(st, next)
      })
    },

    setTool(tool) { set({ activeTool: tool }) },

    setClient(client) {
      const next = client === 'erp' ? 'erp' : 'opti'
      const locked = get().designSession?.client
      if (locked && locked !== next) {
        get().addToast({ message: `This session is locked to ${locked}`, type: 'warning' })
        return
      }
      set((st) => {
        st.client = next
        if (!st.designSession) {
          st.fieldCatalog = catalogForClient(next)
          // Standalone toggle: do not carry or invent sample bags across clients.
          st.labelData = {}
          st.hasHostPreviewData = false
        }
      })
    },

    setLabelData(data) {
      set({
        labelData: data && typeof data === 'object' ? data : {},
        hasHostPreviewData: hasRenderableData(data),
      })
    },
    select(keys) { set({ selectedKeys: Array.isArray(keys) ? keys : [keys] }) },
    clearSelection() { set({ selectedKeys: [] }) },
    setCursorPos(pos) { set({ cursorPos: pos }) },
    setActiveSnapGuides(guides) { set({ activeSnapGuides: guides }) },
    setZplPreview(zpl) { set({ zplPreview: zpl }) },

    addField(factory, overrides = {}) {
      get().pushHistory()
      set((st) => {
        const n = st.fields.length
        const f = factory({ x: 10 + n * 10, y: 10 + n * 10, ...overrides })
        f.zIndex = n
        st.fields.push(f)
        st.selectedKeys = [f.fieldKey]
      })
    },

    addTextField() { get().addField(createTextField) },
    addBlackBoxField() { get().addField(createBlackBoxTextField) },
    addHeaderField() { get().addField(createHeaderField) },
    addBarcodeField() { get().addField(createBarcodeField) },
    addCheckboxField() { get().addField(createCheckboxField) },
    addQrField() { get().addField(createQrField) },
    addRectField(o) { get().addField(createRectField, o) },
    addRoundedRectField(o) { get().addField(createRoundedRectField, o) },
    addEllipseField(o) { get().addField(createEllipseField, o) },
    addLineField() { get().addField(createLineField) },
    addImageField() { get().addField(createImageField) },
    addDxfField() { get().addField(createDxfShapeField) },
    addTableField() { get().addField(createTableField) },

    updateField(key, patch) {
      get().pushHistory()
      const clean = sanitizeFieldPatch(patch)
      set((st) => {
        const f = st.fields.find((x) => x.fieldKey === key)
        if (f) Object.assign(f, clean)
      })
    },

    updateFieldLive(key, patch) {
      const clean = sanitizeFieldPatch(patch)
      set((st) => {
        const f = st.fields.find((x) => x.fieldKey === key)
        if (f && !f.locked) Object.assign(f, clean)
      })
    },

    updateSelectedLive(patchFn) {
      set((st) => {
        for (const key of st.selectedKeys) {
          const f = st.fields.find((x) => x.fieldKey === key)
          if (f && !f.locked) Object.assign(f, sanitizeFieldPatch(patchFn(f)))
        }
      })
    },

    deleteSelected() {
      const keys = get().selectedKeys
      if (!keys.length) return
      get().pushHistory()
      set((st) => {
        st.fields = st.fields.filter((f) => !keys.includes(f.fieldKey))
        st.selectedKeys = []
      })
      get().addToast({ message: 'Deleted selection', type: 'info' })
    },

    deleteField(key) {
      if (!key) return
      get().pushHistory()
      set((st) => {
        st.fields = st.fields.filter((f) => f.fieldKey !== key)
        st.selectedKeys = st.selectedKeys.filter((k) => k !== key)
      })
    },

    duplicateSelected() {
      const keys = get().selectedKeys
      if (!keys.length) return
      get().pushHistory()
      set((st) => {
        const clones = []
        for (const key of keys) {
          const src = st.fields.find((f) => f.fieldKey === key)
          if (!src) continue
          clones.push({
            ...cloneSerializable(src),
            fieldKey: `${src.fieldKey}_copy_${Date.now()}_${clones.length}`,
            x: src.x + 8,
            y: src.y + 8,
          })
        }
        st.fields.push(...clones)
        st.selectedKeys = clones.map((c) => c.fieldKey)
      })
      get().addToast({ message: 'Duplicated', type: 'success' })
    },

    copySelected() {
      const keys = get().selectedKeys
      if (!keys.length) return
      const fields = get().fields.filter((f) => keys.includes(f.fieldKey))
      set({ clipboard: cloneSerializable(fields) })
      get().addToast({ message: 'Copied to clipboard', type: 'success' })
    },

    pasteClipboard() {
      const clip = get().clipboard
      if (!clip?.length) return
      get().pushHistory()
      set((st) => {
        const clones = clip.map((src, i) => ({
          ...src,
          fieldKey: `paste_${Date.now()}_${i}`,
          x: src.x + 12,
          y: src.y + 12,
          zIndex: st.fields.length + i,
        }))
        st.fields.push(...clones)
        st.selectedKeys = clones.map((c) => c.fieldKey)
      })
      get().addToast({ message: 'Pasted', type: 'success' })
    },

    cutSelected() {
      const keys = get().selectedKeys
      if (!keys.length) return
      const clip = get().fields.filter((f) => keys.includes(f.fieldKey))
      get().pushHistory()
      set((st) => {
        st.clipboard = cloneSerializable(clip)
        st.fields = st.fields.filter((f) => !keys.includes(f.fieldKey))
        st.selectedKeys = []
      })
      get().addToast({ message: 'Cut to clipboard', type: 'info' })
    },

    nudgeSelected(dx, dy) {
      const keys = get().selectedKeys
      if (!keys.length) return
      get().pushHistory()
      set((st) => {
        for (const key of keys) {
          const f = st.fields.find((x) => x.fieldKey === key)
          if (f && !f.locked) {
            f.x += dx
            f.y += dy
          }
        }
      })
    },

    alignSelected(mode) {
      const keys = get().selectedKeys
      if (keys.length < 1) return
      get().pushHistory()
      set((st) => {
        const sel = st.fields.filter((f) => keys.includes(f.fieldKey))
        const rects = sel.map(fieldRect)
        const minX = Math.min(...rects.map((r) => r.x))
        const maxX = Math.max(...rects.map((r) => r.x + r.w))
        const minY = Math.min(...rects.map((r) => r.y))
        const maxY = Math.max(...rects.map((r) => r.y + r.h))
        const midX = (minX + maxX) / 2
        const midY = (minY + maxY) / 2
        for (const f of sel) {
          if (f.locked) continue
          if (mode === 'left') f.x = minX
          if (mode === 'right') f.x = maxX - f.width
          if (mode === 'centerH') f.x = midX - f.width / 2
          if (mode === 'top') f.y = minY
          if (mode === 'bottom') f.y = maxY - f.height
          if (mode === 'centerV') f.y = midY - f.height / 2
        }
      })
    },

    distributeSelected(axis) {
      const keys = get().selectedKeys
      if (keys.length < 3) return
      get().pushHistory()
      set((st) => {
        const sel = st.fields.filter((f) => keys.includes(f.fieldKey))
        if (axis === 'h') {
          sel.sort((a, b) => a.x - b.x)
          const first = sel[0].x
          const last = sel[sel.length - 1].x
          const step = (last - first) / (sel.length - 1)
          sel.forEach((f, i) => { if (!f.locked) f.x = first + step * i })
        } else {
          sel.sort((a, b) => a.y - b.y)
          const first = sel[0].y
          const last = sel[sel.length - 1].y
          const step = (last - first) / (sel.length - 1)
          sel.forEach((f, i) => { if (!f.locked) f.y = first + step * i })
        }
      })
    },

    groupSelected() {
      const keys = get().selectedKeys
      if (keys.length < 2) return
      const gid = `grp_${Date.now()}`
      get().pushHistory()
      set((st) => {
        for (const k of keys) st.groups[k] = gid
      })
      get().addToast({ message: 'Grouped', type: 'success' })
    },

    ungroupSelected() {
      const keys = get().selectedKeys
      if (!keys.length) return
      get().pushHistory()
      set((st) => {
        for (const k of keys) delete st.groups[k]
      })
    },

    toggleFieldLock(key) {
      get().pushHistory()
      set((st) => {
        const f = st.fields.find((x) => x.fieldKey === key)
        if (f) f.locked = !f.locked
      })
    },

    toggleFieldVisible(key) {
      get().pushHistory()
      set((st) => {
        const f = st.fields.find((x) => x.fieldKey === key)
        if (f) f.hidden = !f.hidden
      })
    },

    reorderField(key, direction) {
      get().pushHistory()
      set((st) => {
        const idx = st.fields.findIndex((f) => f.fieldKey === key)
        if (idx < 0) return
        const swap = direction === 'up' ? idx + 1 : idx - 1
        if (swap < 0 || swap >= st.fields.length) return
        ;[st.fields[idx], st.fields[swap]] = [st.fields[swap], st.fields[idx]]
        st.fields.forEach((f, i) => { f.zIndex = i })
      })
    },

    /** Set label size from display values in the current unit. */
    setLabelSize(displayW, displayH) {
      get().pushHistory()
      const unit = get().unit || 'mm'
      set((st) => {
        st.width = toMm(displayW, unit)
        st.height = toMm(displayH, unit)
      })
    },

    setDisplayUnit(unit) {
      set((st) => { st.unit = unit || 'mm' })
    },

    applySizePreset(preset) {
      if (!preset) return
      get().pushHistory()
      const u = preset.unit || 'mm'
      set((st) => {
        st.width = toMm(preset.width, u)
        st.height = toMm(preset.height, u)
        st.unit = u
      })
    },

    setMargins(margins) {
      get().pushHistory()
      set((st) => { st.margins = { ...st.margins, ...margins } })
    },

    setTemplateMeta(patch) {
      get().pushHistory()
      set((st) => { Object.assign(st, patch) })
    },

    createNewTemplate({ name, width, height, unit = 'mm', labelType = 'production' }) {
      get().pushHistory()
      set((st) => {
        st.name = name || 'New Label'
        st.width = toMm(Number(width) || 100, unit)
        st.height = toMm(Number(height) || 60, unit)
        st.unit = unit
        st.labelType = labelType
        st.fields = []
        st.selectedKeys = []
      })
    },

    importTemplate(json, { skipHistory = false, markSaved = false } = {}) {
      const parsed = parseImportTemplate(json)
      if (skipHistory) {
        const s = get()
        if (s.id === parsed.id && s.fields?.length === parsed.fields?.length && s.name === parsed.name) {
          return
        }
      } else {
        get().pushHistory()
      }
      set((st) => {
        applyTemplateSnapshot(st, parsed)
        st.selectedKeys = []
        st.updatedAt = new Date().toISOString()
        if (markSaved) st._savedSnapshot = snapshotKey(st)
        st.lastSavedAt = Date.now()
      })
      if (!skipHistory) get().addToast({ message: 'Template loaded', type: 'success' })
    },

    exportTemplate() {
      return buildExportTemplate(get())
    },

    refreshTemplateLibrary() {
      set({ templateLibrary: initialTemplateLibrary(), defaultTemplateId: getDefaultTemplateId() })
    },

    addBoundField(field) {
      const key = field?.key
      if (!key) return
      const noteMatch = String(key).match(/^note(\d+)\.field(\d+)$/i)
      if (noteMatch) {
        get().addField(createHeaderField, {
          label: field.label || key,
          noteField: Number(noteMatch[1]),
          subField: Number(noteMatch[2]),
        })
        return
      }
      const type = field.type || 'text'
      if (type === 'barcode') {
        get().addField(createBarcodeField, {
          label: field.label || key,
          source: [key, String(key).toLowerCase()].filter((v, i, a) => a.indexOf(v) === i),
        })
        return
      }
      if (type === 'qrcode') {
        get().addField(createQrField, { label: field.label || key, source: [key] })
        return
      }
      get().addField(createHeaderField, {
        label: field.label || key,
        value: `{{${key}}}`,
      })
    },

    async refreshServerLibrary() {
      const s = get()
      const templates = await listServerTemplates(s.printServiceUrl, s.client)
      set({ serverTemplates: templates })
      return templates
    },

    async loadServerTemplate(id) {
      const s = get()
      const record = await getServerTemplate(s.printServiceUrl, s.client, id)
      get().importTemplate(record.template || record, { markSaved: true })
      set((st) => {
        st.id = record.id || st.id
        st.client = record.client || st.client
        st.showServerLibrary = false
      })
    },

    async saveToDesignService() {
      const s = get()
      const tpl = buildExportTemplate(s)
      const existingId = tpl.id && !String(tpl.id).startsWith('LBL_NEW') && !String(tpl.id).startsWith('__builtin')
        ? tpl.id
        : undefined
      const saved = await saveServerTemplate(s.printServiceUrl, {
        client: s.client,
        id: existingId,
        name: tpl.name,
        labelType: tpl.labelType,
        template: tpl,
        sessionId: s.designSession?.sessionId,
      })
      set((st) => {
        st.id = saved.id
        st._savedSnapshot = snapshotKey(st)
st.lastSavedAt = Date.now()
      })
      get().addToast({ message: `Saved ${saved.id} on the label service`, type: 'success' })
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: 'spil-label-template-saved', record: saved },
          '*',
        )
      }
      return saved
    },

    async applyDesignSession(sessionId, serviceUrl) {
      if (serviceUrl) {
        set((st) => { st.printServiceUrl = serviceUrl })
        localStorage.setItem('lc-print-service-url', serviceUrl)
      }
      const session = await fetchDesignSession(get().printServiceUrl, sessionId)
      const catalog = session.fieldCatalog?.length
        ? session.fieldCatalog
        : await fetchFieldCatalog(get().printServiceUrl, session.client).catch(() => catalogForClient(session.client))
      const tpl = unwrapSessionTemplate(session.template)
      if (tpl) {
        get().importTemplate(tpl, { skipHistory: true, markSaved: true })
      }
      set((st) => {
        st.client = session.client === 'erp' ? 'erp' : 'opti'
        st.designSession = {
          sessionId: session.sessionId,
          client: st.client,
          expiresAt: session.expiresAt,
          returnApp: session.returnApp || null,
          templateId: session.templateId || null,
        }
        st.fieldCatalog = catalog
        if (session.previewData && typeof session.previewData === 'object') {
          st.labelData = { ...session.previewData }
          st.hasHostPreviewData = hasRenderableData(session.previewData)
        } else {
          st.labelData = {}
          st.hasHostPreviewData = false
        }
        if (session.labelType) st.labelType = session.labelType
        if (session.templateId && !tpl) st.id = session.templateId
      })
      const hasPreview = hasRenderableData(session.previewData)
      get().addToast({
        message: hasPreview
          ? `Opened ${session.client} session with live preview data`
          : `Opened ${session.client} session — no preview data from host`,
        type: hasPreview ? 'success' : 'warning',
      })
    },

    applyHostTemplate(payload) {
      const tpl = unwrapSessionTemplate(payload?.template || payload)
      if (tpl) get().importTemplate(tpl, { skipHistory: true, markSaved: true })
      if (payload?.previewData && typeof payload.previewData === 'object') {
        const client = payload.client === 'erp' ? 'erp' : get().client
        const live = hasRenderableData(payload.previewData)
        set({
          client,
          labelData: { ...payload.previewData },
          hasHostPreviewData: live,
          hostedInApp: true,
        })
        if (live) {
          get().addToast({
            message: `Loaded live preview data from ${client === 'erp' ? 'ERP' : 'Opti'}`,
            type: 'success',
          })
        } else {
          get().addToast({
            message: `${client === 'erp' ? 'ERP' : 'Opti'} sent no printable values — open a piece or order to load real preview data`,
            type: 'warning',
          })
        }
      } else {
        set({ hostedInApp: true })
      }
      if (payload?.labelType) set({ labelType: payload.labelType })
    },

    saveToHost() {
      const s = get()
      const tpl = buildExportTemplate(s)
      const id = tpl.id && !String(tpl.id).startsWith('__builtin') ? tpl.id : generateNextTemplateId()
      const record = {
        id,
        name: tpl.name,
        labelType: tpl.labelType || 'production',
        client: s.client || 'opti',
        template: { ...tpl, id, builtin: false },
      }
      set((st) => {
        st.id = id
        st.hostedInApp = true
        st._savedSnapshot = snapshotKey(st)
st.lastSavedAt = Date.now()
      })
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'spil-label-template-saved', record }, '*')
      }
      const hostName = record.client === 'erp' ? 'ERP' : 'Opti'
      get().addToast({ message: `Saved “${record.name || id}” to ${hostName}`, type: 'success' })
      return record
    },

    saveToLibrary() {
      const s = get()
      const tpl = buildExportTemplate(s)
      const id = tpl.id && !String(tpl.id).startsWith('__builtin') ? tpl.id : generateNextTemplateId()
      const saved = saveTemplate({ ...tpl, id, builtin: false })
      set((st) => {
        st.id = saved.id
        st._savedSnapshot = snapshotKey(st)
st.lastSavedAt = Date.now()
      })
      get().refreshTemplateLibrary()
      get().addToast({ message: 'Saved to template library', type: 'success' })
    },

    loadFromLibrary(id) {
      const tpl = loadTemplates().find((t) => t.id === id)
      if (!tpl) return
      get().importTemplate(tpl, { markSaved: true })
      set({ showTemplateGallery: false })
    },

    deleteFromLibrary(id) {
      deleteTemplate(id)
      get().refreshTemplateLibrary()
      get().addToast({ message: 'Template deleted', type: 'info' })
    },

    setDefaultTemplate(id) {
      setDefaultTemplateId(id)
      set({ defaultTemplateId: id })
      get().addToast({ message: 'Default template updated', type: 'success' })
    },

    exportCurrentTemplateJson() {
      const tpl = get().exportTemplate()
      downloadJsonFile(tpl, sanitizeFileName(tpl.name || tpl.id))
      get().addToast({ message: 'Template exported', type: 'success' })
    },

    exportTemplateJsonById(id) {
      const tpl = loadTemplates().find((t) => t.id === id)
      if (!tpl) return
      downloadJsonFile(tpl, sanitizeFileName(tpl.name || tpl.id))
    },

    async exportAllTemplatesJson() {
      const result = await exportTemplatesToFolder(loadTemplates())
      if (!result.count) {
        get().addToast({ message: 'No user templates to export', type: 'info' })
        return
      }
      const msg = result.mode === 'folder'
        ? `Exported ${result.count} templates to folder`
        : `Downloaded bundle with ${result.count} templates`
      get().addToast({ message: msg, type: 'success' })
    },

    beginImportFromJson(parsed) {
      const check = validateTemplateJson(parsed)
      if (!check.ok) {
        get().addToast({ message: check.error, type: 'error' })
        return
      }
      set({
        showImportModal: true,
        pendingImport: {
          parsed,
          suggestedName: (typeof parsed.name === 'string' && parsed.name.trim()) || 'Imported Label',
          labelType: detectLabelType(parsed),
        },
      })
    },

    cancelImportTemplate() {
      set({ showImportModal: false, pendingImport: null })
    },

    confirmImportTemplate({ name, labelType }) {
      const pending = get().pendingImport
      if (!pending?.parsed) return
      const templates = loadTemplates()
      const id = generateNextTemplateId(templates)
      const hasSections =
        pending.parsed.sections &&
        typeof pending.parsed.sections === 'object' &&
        !Array.isArray(pending.parsed.sections)

      const imported = {
        ...pending.parsed,
        id,
        name: (name || '').trim() || 'Imported Label',
        labelType: labelType || detectLabelType(pending.parsed),
        unit: pending.parsed.unit || 'mm',
        builtin: false,
        sections: hasSections
          ? pending.parsed.sections
          : {
              main: {
                enabled: true,
                display: 'block',
                position: 'relative',
                fields: pending.parsed.fields || [],
              },
            },
      }
      delete imported.fields

      const saved = saveTemplate(imported)
      get().refreshTemplateLibrary()
      get().importTemplate(saved, { markSaved: true })
      set({ showImportModal: false, pendingImport: null, showTemplateGallery: false })
    },

    pickAndImportJsonFile() {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json,application/json'
      input.onchange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const parsed = JSON.parse(reader.result)
            get().beginImportFromJson(parsed)
          } catch {
            get().addToast({ message: 'Invalid JSON file', type: 'error' })
          }
        }
        reader.readAsText(file)
      }
      input.click()
    },

    setView({ zoom, panX, panY }) {
      set((st) => {
        if (zoom != null) st.zoom = zoom
        if (panX != null) st.panX = panX
        if (panY != null) st.panY = panY
      })
    },

    fitToScreen(canvasW, canvasH) {
      const s = get()
      const lw = mmToPx(s.width)
      const lh = mmToPx(s.height)
      const view = computeFitView(lw, lh, canvasW || 800, canvasH || 600)
      set(view)
    },

    setPrintConfig(patch) {
      if (patch.printServiceUrl != null) localStorage.setItem('lc-print-service-url', patch.printServiceUrl)
      if (patch.printerBrand != null) localStorage.setItem('lc-printer-brand', patch.printerBrand)
      if (patch.printerHost != null) localStorage.setItem('lc-printer-host', patch.printerHost)
      if (patch.printerPort != null) localStorage.setItem('lc-printer-port', String(patch.printerPort))
      set((st) => Object.assign(st, patch))
    },

    /** R3: setup opens once on a new PC, then only when re-opened. */
    setSetupDone(done = true) {
      if (done) localStorage.setItem('lc-setup-done', '1')
      else localStorage.removeItem('lc-setup-done')
      set((st) => {
        st.firstTimeSetupOpen = !done
      })
    },

    /** R5: database details can be changed later without reinstalling. */
    setDbConfig(patch) {
      if (patch.dbServer != null) localStorage.setItem('lc-db-server', patch.dbServer)
      if (patch.dbPort != null) localStorage.setItem('lc-db-port', String(patch.dbPort))
      if (patch.dbDatabase != null) localStorage.setItem('lc-db-database', patch.dbDatabase)
      if (patch.dbAuthType != null) localStorage.setItem('lc-db-auth', patch.dbAuthType)
      set((st) => Object.assign(st, patch))
    },

    requestConfirmation(config) {
      set((st) => { st.confirmDialog = config })
    },

    dismissConfirmation() {
      set((st) => { st.confirmDialog = null })
    },

    setActiveTab(tab) {
      set({ activeTab: tab })
    },

    setClient(client) {
      if (get().designSession) return
      set((st) => {
        st.client = client
        st.fieldCatalog = catalogForClient(client)
        // Rule: switching clears loaded data and reloads fields
        st.labelData = {}
        st.hasHostPreviewData = false
        st.realDataInfo = null
      })
      get().addToast({
        message: `Switched to ${client === 'erp' ? 'ERP' : 'Opti'} mode`,
        type: 'info',
      })
    },

    loadRealData({ source, pieceIndex, totalPieces, data }) {
      set((st) => {
        st.labelData = { ...data }
        st.hasHostPreviewData = true
        st.realDataInfo = {
          source,
          pieceIndex: pieceIndex ?? 1,
          totalPieces: totalPieces ?? 1,
        }
      })
      get().addToast({
        message: `Loaded real piece data: ${source}`,
        type: 'success',
      })
    },

    clearRealData() {
      set((st) => {
        st.labelData = {}
        st.hasHostPreviewData = false
        st.realDataInfo = null
      })
    },

    stepPiece(delta) {
      const info = get().realDataInfo
      if (!info || !info.totalPieces) return
      let next = info.pieceIndex + delta
      if (next < 1) next = info.totalPieces
      if (next > info.totalPieces) next = 1
      set((st) => {
        st.realDataInfo.pieceIndex = next
      })
    },

    toggleDbOffline() {
      set((st) => {
        st.dbStatus = st.dbStatus === 'connected' ? 'offline' : 'connected'
      })
    },

    togglePrintServiceStatus() {
      set((st) => {
        st.printServiceStatus = st.printServiceStatus === 'connected' ? 'unreachable' : 'connected'
      })
    },

    /**
     * Spec §8.1 / §8.2: poll the Print Service and the template database,
     * auto-retry with back-off (5, 10, 30 s) and clear the banner on recovery.
     */
    async checkServiceHealth() {
      const st = get()
      const started = Date.now()
      try {
        await checkServiceHealth(st.printServiceUrl)
        set((s) => {
          s.printServiceStatus = 'connected'
          s.printServiceLastOkAt = Date.now()
        })
      } catch {
        set((s) => {
          s.printServiceStatus = 'unreachable'
          if (!s.printServiceLastOkAt) s.printServiceLastOkAt = null
        })
      }

      // The database is reached through the same design service endpoint.
      try {
        const templates = await listServerTemplates(st.printServiceUrl, st.client)
        set((s) => {
          s.dbStatus = 'connected'
          s.dbLastOkAt = Date.now()
          s.dbLatencyMs = Date.now() - started
          s.dbRetryIn = 0
          s.dbRetryStep = 0
          if (Array.isArray(templates)) s.serverTemplates = templates
        })
      } catch {
        set((s) => {
          s.dbStatus = 'offline'
          s.dbRetryStep = Math.min(s.dbRetryStep + 1, DB_BACKOFF.length - 1)
          s.dbRetryIn = DB_BACKOFF[s.dbRetryStep]
        })
      }
    },

    /** Manual "Retry now" from the offline banner. */
    async retryDatabase() {
      set((s) => {
        s.dbRetryIn = 0
      })
      await get().checkServiceHealth()
    },

    tickRetryCountdown() {
      const st = get()
      if (st.dbStatus === 'connected' || st.dbRetryIn <= 0) return
      const next = st.dbRetryIn - 1
      set((s) => {
        s.dbRetryIn = next
      })
      if (next <= 0) get().checkServiceHealth()
    },

    discardUnsavedChanges() {
      const savedSnapshot = get()._savedSnapshot
      if (!savedSnapshot) return
      set((st) => {
        applyTemplateSnapshot(st, JSON.parse(savedSnapshot))
        st._history = []
        st._future = []
      })
      get().addToast({ message: 'Unsaved changes discarded', type: 'info' })
    },
  })),
)
