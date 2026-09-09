import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createBarcodeField,
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
import { ERP_SAMPLE, OPTI_SAMPLE } from '../data/sampleData'
import { buildExportTemplate, parseImportTemplate } from '../utils/template'
import { fieldRect } from '../utils/geometry'

const MAX_HISTORY = 80
const LIB_KEY = 'lc-template-library'

const defaultTemplate = () => ({
  id: 'LBL_NEW',
  name: 'New Label',
  width: 100,
  height: 60,
  unit: 'mm',
  labelType: 'production',
  printerDpi: 300,
  margins: { left: 3.0, right: 1.0, top: 1.0, bottom: 1.0 },
  globalStyles: {
    fontFamily: 'Arial, sans-serif',
    defaultFontSize: 9,
    backgroundColor: '#ffffff',
    defaultColor: '#000000',
  },
  fields: [
    createHeaderField({
      fieldKey: 'title',
      label: 'Header Text',
      x: 18, y: 12, width: 240, height: 28,
      value: 'Order: {{orderNumber}}',
      fontSize: 14,
    }),
    createBarcodeField({
      fieldKey: 'mainBarcode',
      label: 'Main Barcode',
      x: 18, y: 45, width: 200, height: 52,
    }),
  ],
})

function snapshot(state) {
  return JSON.stringify({
    id: state.id,
    name: state.name,
    width: state.width,
    height: state.height,
    unit: state.unit,
    labelType: state.labelType,
    printerDpi: state.printerDpi,
    margins: state.margins,
    globalStyles: state.globalStyles,
    fields: state.fields,
    groups: state.groups,
  })
}

function loadLibrary() {
  try {
    return JSON.parse(localStorage.getItem(LIB_KEY) || '[]')
  } catch {
    return []
  }
}

export const useLabelStore = create(
  immer((set, get) => ({
    ...defaultTemplate(),
    theme: localStorage.getItem('lc-theme') || 'light',
    selectedKeys: [],
    activeTool: 'select',
    client: 'opti',
    labelData: { ...OPTI_SAMPLE },
    printServiceUrl: 'http://localhost:5088',
    printerBrand: 'zebra',
    snapToGrid: true,
    snapToElements: true,
    snapToEdges: true,
    gridMm: 1,
    showGrid: true,
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
    zoom: 2.65,
    panX: 0,
    panY: 0,
    cursorPos: { x: 0, y: 0 },
    activeSnapGuides: [],
    rulerGuides: { h: [], v: [] },
    clipboard: null,
    groups: {},
    toasts: [],
    templateLibrary: loadLibrary(),
    zplPreview: '',
    showNewModal: false,
    showAddShapeModal: false,
    _history: [],
    _future: [],

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
      const snap = snapshot(s)
      if (s._history.length && s._history[s._history.length - 1] === snap) return
      set((st) => {
        st._history.push(snap)
        if (st._history.length > MAX_HISTORY) st._history.shift()
        st._future = []
      })
    },

    undo() {
      if (!get()._history.length) return
      set((st) => {
        st._future.unshift(snapshot(st))
        Object.assign(st, JSON.parse(st._history.pop()))
      })
    },

    redo() {
      if (!get()._future.length) return
      set((st) => {
        st._history.push(snapshot(st))
        Object.assign(st, JSON.parse(st._future.shift()))
      })
    },

    canUndo: () => get()._history.length > 0,
    canRedo: () => get()._future.length > 0,

    setTool(tool) { set({ activeTool: tool }) },

    setClient(client) {
      set((st) => {
        st.client = client
        st.labelData = client === 'erp' ? { ...ERP_SAMPLE } : { ...OPTI_SAMPLE }
      })
    },

    setLabelData(data) { set({ labelData: data }) },
    select(keys) { set({ selectedKeys: Array.isArray(keys) ? keys : [keys] }) },
    clearSelection() { set({ selectedKeys: [] }) },
    setCursorPos(pos) { set({ cursorPos: pos }) },
    setActiveSnapGuides(guides) { set({ activeSnapGuides: guides }) },
    setZplPreview(zpl) { set({ zplPreview: zpl }) },

    addField(factory, overrides = {}) {
      get().pushHistory()
      set((st) => {
        const f = factory(overrides)
        f.zIndex = st.fields.length
        st.fields.push(f)
        st.selectedKeys = [f.fieldKey]
      })
    },

    addTextField() { get().addField(createTextField) },
    addBlackBoxField() { get().addField(createBlackBoxTextField) },
    addHeaderField() { get().addField(createHeaderField) },
    addBarcodeField() { get().addField(createBarcodeField) },
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
      set((st) => {
        const f = st.fields.find((x) => x.fieldKey === key)
        if (f) Object.assign(f, patch)
      })
    },

    updateFieldLive(key, patch) {
      set((st) => {
        const f = st.fields.find((x) => x.fieldKey === key)
        if (f && !f.locked) Object.assign(f, patch)
      })
    },

    updateSelectedLive(patchFn) {
      set((st) => {
        for (const key of st.selectedKeys) {
          const f = st.fields.find((x) => x.fieldKey === key)
          if (f && !f.locked) Object.assign(f, patchFn(f))
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
            ...JSON.parse(JSON.stringify(src)),
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
      set({ clipboard: JSON.parse(JSON.stringify(fields)) })
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
      get().copySelected()
      get().deleteSelected()
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

    setLabelSize(width, height) {
      get().pushHistory()
      set((st) => { st.width = width; st.height = height })
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
        st.width = Number(width) || 100
        st.height = Number(height) || 60
        st.unit = unit
        st.labelType = labelType
        st.fields = []
        st.selectedKeys = []
      })
    },

    importTemplate(json) {
      get().pushHistory()
      const parsed = parseImportTemplate(json)
      set((st) => {
        Object.assign(st, parsed)
        st.selectedKeys = []
      })
      get().addToast({ message: 'Template imported', type: 'success' })
    },

    exportTemplate() {
      return buildExportTemplate(get())
    },

    saveToLibrary() {
      const tpl = get().exportTemplate()
      const entry = {
        id: tpl.id || `lib_${Date.now()}`,
        name: tpl.name,
        savedAt: new Date().toISOString(),
        template: tpl,
      }
      set((st) => {
        st.templateLibrary = [entry, ...st.templateLibrary.filter((e) => e.id !== entry.id)].slice(0, 50)
        localStorage.setItem(LIB_KEY, JSON.stringify(st.templateLibrary))
      })
      get().addToast({ message: 'Saved to library', type: 'success' })
    },

    loadFromLibrary(id) {
      const entry = get().templateLibrary.find((e) => e.id === id)
      if (!entry) return
      get().importTemplate(entry.template)
    },

    setView({ zoom, panX, panY }) {
      set((st) => {
        if (zoom != null) st.zoom = zoom
        if (panX != null) st.panX = panX
        if (panY != null) st.panY = panY
      })
    },

    fitToScreen() { set({ zoom: 2.65, panX: 0, panY: 0 }) },

    setPrintConfig(patch) {
      set((st) => Object.assign(st, patch))
    },
  })),
)
