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

/** Build Opti / Print Service template JSON from editor state. */
export function buildExportTemplate(state) {
  const { id, name, width, height, printerDpi, globalStyles, fields, margins } =
    state
  return {
    id: id || 'LBL_CUSTOM',
    name: name || 'Custom Label',
    width: Number(width) || 90,
    height: Number(height) || 43,
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
  }
}

/** Import template from Opti JSON file. */
export function parseImportTemplate(json) {
  const t = typeof json === 'string' ? JSON.parse(json) : json
  const fields = extractFields(t).map((f, i) => ({
    ...f,
    fieldKey: f.fieldKey || `field_${i}`,
    zIndex: f.zIndex ?? i,
  }))
  return {
    id: t.id || 'LBL_IMPORTED',
    name: t.name || 'Imported Label',
    width: Number(t.width) || 90,
    height: Number(t.height) || 43,
    printerDpi: t.printerDpi || 300,
    margins: {
      left: t.left ?? 0,
      right: t.right ?? 0,
      top: t.top ?? 0,
      bottom: t.bottom ?? 0,
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
