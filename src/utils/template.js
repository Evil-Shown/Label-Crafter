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
      orderCustomerBlock: {
        enabled: true,
        display: 'block',
        position: 'relative',
        fields: fields.map((f) => ({
          ...f,
          position: f.position || 'absolute',
          left: `${Number(f.x) || 0}px`,
          top: `${Number(f.y) || 0}px`,
          x: Number(f.x) || 0,
          y: Number(f.y) || 0,
        })),
      },
    },
    createdAt: createdAt || now,
    updatedAt: now,
    fieldMappings: buildFieldMappings(fields),
  }
}

/** Opti print path: fieldMappings[fieldKey] = { noteField, subField, isBlackBox }. */
export function buildFieldMappings(fields = []) {
  const mappings = {}
  for (const f of fields || []) {
    if (!f?.fieldKey) continue
    if (f.type === 'shape' || f.type === 'image' || f.type === 'line') continue
    const nf = Number(f.noteField) || 0
    const sf = Number(f.subField) || 0
    const isBlackBox = !!(f.blackBox || f.isBlackBox)
    if (!nf && !isBlackBox) continue
    mappings[f.fieldKey] = {
      label: f.label || f.fieldKey,
      noteField: nf,
      subField: sf,
      isBlackBox,
    }
  }
  return mappings
}

export function lookupPath(data, path) {
  if (!data || path == null || path === '') return undefined
  const key = String(path).trim()
  if (Object.prototype.hasOwnProperty.call(data, key) && data[key] != null && data[key] !== '') {
    return data[key]
  }
  let cur = data
  for (const part of key.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = cur[part] ?? cur[`field${part}`]
  }
  return cur
}

export function isTextLikeType(type) {
  const t = String(type || 'text').toLowerCase()
  return t === 'text' || t === 'header'
}

export function isMappableType(type) {
  const t = String(type || '').toLowerCase()
  return t === 'text' || t === 'header' || t === 'barcode' || t === 'qrcode'
}

export function mappingLabel(field) {
  const nf = Number(field?.noteField) || 0
  const sf = Number(field?.subField) || 0
  if (nf > 0) return `N${nf}F${sf || 1}`
  if (field?.blackBox || field?.isBlackBox) return 'Black box'
  return ''
}

function parseCoord(css, numeric) {
  if (numeric != null && numeric !== '' && Number.isFinite(Number(numeric))) return Number(numeric)
  if (css == null || css === '') return 0
  const n = parseFloat(String(css))
  return Number.isFinite(n) ? n : 0
}

export function resolveMappedPreview(field, data = {}) {
  const nf = Number(field?.noteField) || 0
  const sf = Number(field?.subField) || 0
  if (nf > 0) {
    const note = lookupPath(data, `note${nf}`) ?? lookupPath(data, `Note${nf}`) ?? lookupPath(data, `noteFields.${nf}`)
    if (note != null) {
      if (typeof note === 'object' && !Array.isArray(note) && sf > 0) {
        const v =
          note[`field${sf}`] ??
          note[sf] ??
          note.fields?.[`field${sf}`] ??
          note.fields?.[sf]
        if (v != null && typeof v !== 'object') return String(v)
      } else if (Array.isArray(note) && sf > 0 && note[sf - 1] != null) {
        return String(note[sf - 1])
      } else if (typeof note !== 'object') {
        return String(note)
      }
    }
  }
  if (Array.isArray(field?.source)) {
    for (const s of field.source) {
      const v = lookupPath(data, s)
      if (v != null && v !== '') return String(v)
    }
  }
  if (field?.value && String(field.value).includes('{{')) {
    return interpolateTokens(field.value, data)
  }
  return undefined
}

/** Canvas text: match Opti editor (tokens/static value first, then note mapping, then N2F3). */
export function resolveFieldDisplayText(field, data = {}, { showLiveTokens = true } = {}) {
  const raw = field?.value != null ? String(field.value) : ''
  const hasTokens = raw.includes('{{')
  if (hasTokens) {
    return showLiveTokens ? interpolateTokens(raw, data) : raw
  }
  if (raw.trim() !== '') return raw
  if (showLiveTokens) {
    const mapped = resolveMappedPreview(field, data)
    if (mapped != null && mapped !== '') return mapped
  }
  const nf = Number(field?.noteField) || 0
  const sf = Number(field?.subField) || 0
  if (nf > 0) return `N${nf}F${sf || 1}`
  if (field?.fallbackValue) return String(field.fallbackValue)
  return ''
}

/** Import template from Opti JSON (file or object). */
export function parseImportTemplate(json) {
  const t = typeof json === 'string' ? JSON.parse(json) : json
  const fields = extractFields(t).map((f, i) => {
    const fieldKey = f.fieldKey || f.editableField || `field_${i}`
    const mapping = t.fieldMappings?.[fieldKey]
    const blackBox = !!(f.blackBox || f.isBlackBox || mapping?.isBlackBox)
    return {
      ...f,
      fieldKey,
      type: f.type || 'text',
      label: typeof f.label === 'string' ? f.label : String(f.label ?? ''),
      value: typeof f.value === 'string' ? f.value : f.value == null ? undefined : String(f.value),
      zIndex: f.zIndex ?? i,
      x: parseCoord(f.left, f.x),
      y: parseCoord(f.top, f.y),
      width: Number(f.width) || 80,
      height: Number(f.height) || 24,
      blackBox,
      isBlackBox: blackBox,
      noteField: Number(f.noteField ?? mapping?.noteField) || 0,
      subField: Number(f.subField ?? mapping?.subField) || 0,
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
    fieldMappings: t.fieldMappings || {},
    fields,
  }
}

/** Replace {{tokens}} in a string with labelData values. */
export function interpolateTokens(str, data = {}) {
  if (!str || typeof str !== 'string') return str || ''
  return str.replace(/\{\{([^}]+)\}\}/g, (_, raw) => {
    const v = lookupPath(data, String(raw).trim())
    if (v == null) return ''
    if (typeof v === 'object') return Array.isArray(v) ? v.join(', ') : ''
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
