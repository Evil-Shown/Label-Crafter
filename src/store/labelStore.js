import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createBarcodeField,
  createDxfShapeField,
  createHeaderField,
  createImageField,
  createLineField,
  createQrField,
  createRectField,
  createTextField,
} from '../elements/factories'
import { ERP_SAMPLE, OPTI_SAMPLE } from '../data/sampleData'
import { buildExportTemplate, parseImportTemplate } from '../utils/template'

const MAX_HISTORY = 80

const defaultTemplate = () => ({
  id: 'LBL_NEW',
  name: 'New Label',
  width: 100,
  height: 60,
  unit: 'mm',
  labelType: 'production', // 'production' | 'offcut'
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
      x: 18,
      y: 12,
      width: 240,
      height: 28,
      value: 'Order: {{orderNumber}}',
      fontSize: 14,
    }),
    createBarcodeField({
      fieldKey: 'mainBarcode',
      label: 'Main Barcode',
      x: 18,
      y: 45,
      width: 200,
      height: 52,
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
  })
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
    gridMm: 1,
    showGrid: true,
    showMargins: true,
    zoom: 2.65, // default 265% matching legacy editor screenshot
    panX: 0,
    panY: 0,

    // Modal dialog states
    showNewModal: false,
    showAddShapeModal: false,
    showManageTemplatesModal: false,

    _history: [],
    _future: [],

    toggleTheme() {
      set((st) => {
        st.theme = st.theme === 'light' ? 'dark' : 'light'
        localStorage.setItem('lc-theme', st.theme)
        document.documentElement.setAttribute('data-theme', st.theme)
      })
    },

    setTheme(theme) {
      set((st) => {
        st.theme = theme
        localStorage.setItem('lc-theme', theme)
        document.documentElement.setAttribute('data-theme', theme)
      })
    },

    setModal(modalName, isOpen) {
      set((st) => {
        st[modalName] = isOpen
      })
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
      const s = get()
      if (!s._history.length) return
      set((st) => {
        st._future.unshift(snapshot(st))
        const prev = JSON.parse(st._history.pop())
        Object.assign(st, prev)
      })
    },

    redo() {
      const s = get()
      if (!s._future.length) return
      set((st) => {
        st._history.push(snapshot(st))
        const next = JSON.parse(st._future.shift())
        Object.assign(st, next)
      })
    },

    canUndo: () => get()._history.length > 0,
    canRedo: () => get()._future.length > 0,

    setTool(tool) {
      set({ activeTool: tool })
    },

    setClient(client) {
      set((st) => {
        st.client = client
        st.labelData =
          client === 'erp' ? { ...ERP_SAMPLE } : { ...OPTI_SAMPLE }
      })
    },

    setLabelData(data) {
      set({ labelData: data })
    },

    select(keys) {
      set({ selectedKeys: Array.isArray(keys) ? keys : [keys] })
    },

    clearSelection() {
      set({ selectedKeys: [] })
    },

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
    addHeaderField() { get().addField(createHeaderField) },
    addBarcodeField() { get().addField(createBarcodeField) },
    addQrField() { get().addField(createQrField) },
    addRectField(overrides) { get().addField(createRectField, overrides) },
    addLineField() { get().addField(createLineField) },
    addImageField() { get().addField(createImageField) },
    addDxfField() { get().addField(createDxfShapeField) },

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
        if (f) Object.assign(f, patch)
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
          const c = {
            ...JSON.parse(JSON.stringify(src)),
            fieldKey: `${src.fieldKey}_copy_${Date.now()}`,
            x: src.x + 8,
            y: src.y + 8,
          }
          clones.push(c)
        }
        st.fields.push(...clones)
        st.selectedKeys = clones.map((c) => c.fieldKey)
      })
    },

    reorderField(key, direction) {
      get().pushHistory()
      set((st) => {
        const idx = st.fields.findIndex((f) => f.fieldKey === key)
        if (idx < 0) return
        const swap = direction === 'up' ? idx + 1 : idx - 1
        if (swap < 0 || swap >= st.fields.length) return
        const [a, b] = [st.fields[idx], st.fields[swap]]
        st.fields[idx] = b
        st.fields[swap] = a
        st.fields.forEach((f, i) => {
          f.zIndex = i
        })
      })
    },

    setLabelSize(width, height) {
      get().pushHistory()
      set((st) => {
        st.width = width
        st.height = height
      })
    },

    setMargins(margins) {
      get().pushHistory()
      set((st) => {
        st.margins = { ...st.margins, ...margins }
      })
    },

    setTemplateMeta(patch) {
      get().pushHistory()
      set((st) => {
        Object.assign(st, patch)
      })
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
    },

    exportTemplate() {
      return buildExportTemplate(get())
    },

    setView({ zoom, panX, panY }) {
      set((st) => {
        if (zoom != null) st.zoom = zoom
        if (panX != null) st.panX = panX
        if (panY != null) st.panY = panY
      })
    },

    fitToScreen() {
      set({ zoom: 2.65, panX: 0, panY: 0 })
    },

    setPrintConfig(patch) {
      set((st) => Object.assign(st, patch))
    },
  })),
)
