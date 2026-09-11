/** Browser localStorage template library — mirrors spil-opti templateStorage patterns. */

const STORAGE_KEY = 'lc_blank_templates'
const DEFAULT_TEMPLATE_KEY = 'lc_default_template_id'

export function loadTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveTemplates(templates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

export function saveTemplate(template) {
  const templates = loadTemplates()
  const now = new Date().toISOString()
  const idx = templates.findIndex((t) => t.id === template.id)
  const updated = {
    ...template,
    updatedAt: now,
    createdAt: idx >= 0 ? templates[idx].createdAt || now : now,
  }
  if (idx >= 0) templates[idx] = updated
  else templates.push(updated)
  saveTemplates(templates)
  return updated
}

export function deleteTemplate(templateId) {
  const templates = loadTemplates().filter((t) => t.id !== templateId)
  saveTemplates(templates)
  if (getDefaultTemplateId() === templateId) setDefaultTemplateId(null)
}

export function getDefaultTemplateId() {
  return localStorage.getItem(DEFAULT_TEMPLATE_KEY) || null
}

export function setDefaultTemplateId(templateId) {
  if (templateId) localStorage.setItem(DEFAULT_TEMPLATE_KEY, templateId)
  else localStorage.removeItem(DEFAULT_TEMPLATE_KEY)
}

export function generateNextTemplateId(templates = loadTemplates()) {
  const nums = templates
    .map((t) => String(t.id || '').match(/^LBL_(\d+)$/i))
    .filter(Boolean)
    .map((m) => Number(m[1]))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `LBL_${String(next).padStart(3, '0')}`
}

export function detectLabelType(template) {
  const t = String(template?.labelType || '').toLowerCase()
  if (t === 'offcut' || t === 'sample' || t === 'production') return t
  const name = String(template?.name || '').toLowerCase()
  if (name.includes('offcut')) return 'offcut'
  if (name.includes('sample')) return 'sample'
  return 'production'
}

export function validateTemplateJson(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'JSON must be a label template object.' }
  }
  const hasSections =
    parsed.sections && typeof parsed.sections === 'object' && !Array.isArray(parsed.sections)
  const hasFields = Array.isArray(parsed.fields)
  if (!hasSections && !hasFields) {
    return { ok: false, error: 'Template is missing layout (sections or fields).' }
  }
  if (!parsed.width || !parsed.height) {
    return { ok: false, error: 'Template must include width and height.' }
  }
  return { ok: true }
}

export function sanitizeFileName(name) {
  return String(name ?? '')
    .trim()
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim() || 'Label'
}

export function downloadJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Export all user templates — directory picker when supported, else bundle download. */
export async function exportTemplatesToFolder(templates) {
  const userTemplates = templates.filter((t) => !t.builtin)
  if (!userTemplates.length) return { count: 0, mode: 'none' }

  if (window.showDirectoryPicker) {
    const dir = await window.showDirectoryPicker()
    const used = new Set()
    for (const tpl of userTemplates) {
      let base = sanitizeFileName(tpl.name || tpl.id)
      let candidate = base
      let n = 2
      while (used.has(candidate.toLowerCase())) {
        candidate = `${base} (${n})`
        n += 1
      }
      used.add(candidate.toLowerCase())
      const handle = await dir.getFileHandle(`${candidate}.json`, { create: true })
      const writable = await handle.createWritable()
      await writable.write(JSON.stringify(tpl, null, 2))
      await writable.close()
    }
    return { count: userTemplates.length, mode: 'folder' }
  }

  downloadJsonFile(
    { exportedAt: new Date().toISOString(), templates: userTemplates },
    'label-templates-bundle.json',
  )
  return { count: userTemplates.length, mode: 'bundle' }
}

/** Migrate legacy `lc-template-library` entries into lc_blank_templates. */
export function migrateLegacyLibrary() {
  const LEGACY = 'lc-template-library'
  try {
    const raw = localStorage.getItem(LEGACY)
    if (!raw) return
    const legacy = JSON.parse(raw)
    if (!Array.isArray(legacy) || !legacy.length) return
    const existing = loadTemplates()
    const ids = new Set(existing.map((t) => t.id))
    for (const entry of legacy) {
      const tpl = entry.template || entry
      if (!tpl?.id || ids.has(tpl.id)) continue
      saveTemplate({ ...tpl, name: entry.name || tpl.name })
      ids.add(tpl.id)
    }
    localStorage.removeItem(LEGACY)
  } catch {
    /* ignore */
  }
}
