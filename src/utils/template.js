import { fromMm, toMm } from './units'

/** Flatten Opti sections → fields array; pass through if already flat. */
export function extractFields(template) {
  if (!template || typeof template !== 'object') return []
  if (Array.isArray(template.fields)) return template.fields
  const out = []
  const sections = template.sections || {}
  for (const key of Object.keys(sections)) {
    const sec = sections[key]
    if (!sec?.enabled && sec?.enabled !== undefined) continue
    for (const f of sec?.fields || []) out.push(f)
  }
  return out
}

/** Build Opti-compatible template JSON from editor state. */
export function buildExportTemplate(state) {
  const {
    id, name, width, height, unit, labelType, printerDpi,
    globalStyles, fields, margins, createdAt, updatedAt,
  } = state
  const now = new Date().toISOString()
  const displayUnit = unit || 'mm'
  return {
    id: id || 'LBL_CUSTOM',
    name: name || 'Custom Label',
    width: fromMm(Number(width) || 90, displayUnit),
    height: fromMm(Number(height) || 43, displayUnit),
    unit: displayUnit,
    labelType: labelType || 'production',
    printerDpi: printerDpi || 300,
    left: margins?.left ?? 0,
    right: margins?.right ?? 0,
    top: margins?.top ?? 0,
    bottom: margins?.bottom ?? 0,
    globalStyles: globalStyles || {
      fontFamily: 'Arial, sans-serif',
      defaultFontSize: 9,
      backgroundColor: '#ffffff',
      defaultColor: '#000000',
    },
    sections: {
      main: {
        enabled: true,
        display: 'block',
        position: 'relative',
        fields: fields.map((f) => ({ ...f })),
      },
    },
    createdAt: createdAt || now,
    updatedAt: now,
  }
}

/** Import template from Opti JSON (file or object). */
export function parseImportTemplate(json) {
  const t = typeof json === 'string' ? JSON.parse(json) : json
  const fields = extractFields(t).map((f, i) => {
    const {
      fieldKey, type, shapeType, label, value, source, x, y, width, height, left, top,
      zIndex, rotation, locked, hidden, fontSize, fontFamily, fontWeight, textAlign, color,
      blackBox, border, borderRadius, padding, boxSizing, whiteSpace, fallbackValue,
      editableField, displayValue, barcodeFormat, qrEcc, strokeColor, strokeWidth,
      fillEnabled, fillColor, dashStyle, arrowEnd, cornerRadius, columns, rows, src,
      hideEdgeLabels, showOrientation, showBevel, position,
    } = f
    return {
      fieldKey: fieldKey || `field_${i}`,
      type,
      shapeType,
      label: typeof label === 'string' ? label : String(label ?? ''),
      value: typeof value === 'string' ? value : value == null ? undefined : String(value),
      source,
      zIndex: zIndex ?? i,
      x: x ?? (parseFloat(String(left || '0')) || 0),
      y: y ?? (parseFloat(String(top || '0')) || 0),
      width: width ?? 80,
      height: height ?? 24,
      rotation, locked, hidden, fontSize, fontFamily, fontWeight, textAlign, color,
      blackBox, border, borderRadius, padding, boxSizing, whiteSpace, fallbackValue,
      editableField, displayValue, barcodeFormat, qrEcc, strokeColor, strokeWidth,
      fillEnabled, fillColor, dashStyle, arrowEnd, cornerRadius, columns, rows, src,
      hideEdgeLabels, showOrientation, showBevel, position,
    }
  })
  const importUnit = t.unit || 'mm'
  return {
    id: t.id || 'LBL_IMPORTED',
    name: t.name || 'Imported Label',
    width: toMm(Number(t.width) || 90, importUnit),
    height: toMm(Number(t.height) || 43, importUnit),
    unit: importUnit,
    labelType: t.labelType || 'production',
    printerDpi: t.printerDpi || 300,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    margins: {
      left: t.left ?? t.margins?.left ?? 0,
      right: t.right ?? t.margins?.right ?? 0,
      top: t.top ?? t.margins?.top ?? 0,
      bottom: t.bottom ?? t.margins?.bottom ?? 0,
    },
    globalStyles: t.globalStyles || {
      fontFamily: 'Arial, sans-serif',
      defaultFontSize: 9,
      backgroundColor: '#ffffff',
      defaultColor: '#000000',
    },
    fields,
  }
}

/** Replace {{tokens}} in a string with labelData values. */
export function interpolateTokens(str, data = {}) {
  if (!str || typeof str !== 'string') return str || ''
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = data[key]
    if (v == null) return ''
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  })
}

/** Build render state from a stored/exported template object. */
export function templateToEditorState(template, labelData) {
  const parsed = parseImportTemplate(template)
  return {
    ...parsed,
    labelData: labelData || {},
  }
}
