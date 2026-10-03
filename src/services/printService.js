/**
 * Client for SPIL Label Print Service (Lable Print Service repo).
 * POST /api/labels/compile | /api/labels/send | compile-batch
 *
 * The service publishes its printer catalogue at GET /api/health and
 * GET /api/brands. The list below mirrors it so the Designer still works when
 * the service is unreachable (the dropdown must never be empty).
 */
export const PRINTER_BRANDS = [
  { brand: 'zebra', language: 'zpl', name: 'Zebra', hint: 'Native ZPL on TCP 9100' },
  { brand: 'honeywell', language: 'zpl', name: 'Honeywell', hint: 'Enable ZPL or ZSim on the printer' },
  { brand: 'citizen', language: 'zpl', name: 'Citizen', hint: 'Enable Zebra ZPL emulation' },
  { brand: 'sato', language: 'zpl', name: 'SATO (SZPL)', hint: 'Enable SZPL / ZPL emulation' },
  { brand: 'sato-sbpl', language: 'sbpl', name: 'SATO (SBPL)', hint: 'Native SBPL' },
  { brand: 'tsc', language: 'tspl', name: 'TSC', hint: 'Native TSPL (TE / TX / TTP)' },
  { brand: 'godex', language: 'ezpl', name: 'Godex', hint: 'Native EZPL' },
  { brand: 'datamax', language: 'dpl', name: 'Datamax', hint: 'Native DPL (I-Class / A-Class)' },
  { brand: 'epl', language: 'epl', name: 'Eltron / EPL2', hint: 'Older EPL2 printers' },
]

/** Languages the service can emit, in the order the tabs should appear. */
export const PRINTER_LANGUAGES = ['zpl', 'tspl', 'ezpl', 'sbpl', 'dpl', 'epl']

export const LANGUAGE_LABELS = {
  zpl: 'ZPL',
  tspl: 'TSPL',
  ezpl: 'EZPL',
  sbpl: 'SBPL',
  dpl: 'DPL',
  epl: 'EPL',
}

/**
 * The service takes a *brand*, not a language. Several brands share ZPL, so the
 * language tabs have to resolve to a brand before compiling.
 */
export function brandForLanguage(language, preferredBrand) {
  const lang = String(language || '').toLowerCase()
  if (preferredBrand && brandLanguage(preferredBrand) === lang) return preferredBrand
  const match = PRINTER_BRANDS.find((p) => p.language === lang)
  return match ? match.brand : 'zebra'
}

export function brandLanguage(brand) {
  const found = PRINTER_BRANDS.find((p) => p.brand === brand)
  return found ? found.language : 'zpl'
}

/** Ask the service what it supports, falling back to the built-in list. */
export async function fetchPrinterCatalogue(baseUrl, timeoutMs = 2500) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/brands`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) throw new Error(`Service returned ${res.status}`)
  const data = await res.json()
  const brands = Array.isArray(data?.brands) && data.brands.length ? data.brands : PRINTER_BRANDS
  return {
    brands,
    languages: PRINTER_LANGUAGES.filter((l) => brands.some((b) => b.language === l)),
  }
}

export async function compileLabel({
  baseUrl,
  client = 'opti',
  brand = 'zebra',
  template,
  labelData,
  configuration = {},
  printerDpi = 300,
}) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/labels/compile`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client,
      brand,
      layout: 'template',
      printerDpi,
      template,
      labelData,
      configuration,
    }),
  })
  const text = await res.text()
  if (!res.ok) {
    // The service answers { ok:false, error:"..." } — surface that message.
    let message = text
    try {
      message = JSON.parse(text).error || text
    } catch {
      /* keep the raw text */
    }
    throw new Error(message || `Compile failed (${res.status})`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('The Print Service returned a response that was not JSON.')
  }
}

/** Compile many pieces into one concatenated job. */
export async function compileLabelBatch({ baseUrl, client = 'opti', brand = 'zebra', template, labels, printerDpi = 300 }) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/labels/compile-batch`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client, brand, layout: 'template', printerDpi, template, labels }),
  })
  const text = await res.text()
  if (!res.ok) {
    let message = text
    try {
      message = JSON.parse(text).error || text
    } catch {
      /* keep the raw text */
    }
    throw new Error(message || `Batch compile failed (${res.status})`)
  }
  return JSON.parse(text)
}

export async function sendToPrinter({
  baseUrl,
  host,
  port = 9100,
  payload,
  compileRequest,
}) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/labels/send`
  const body = compileRequest
    ? { host, port, compile: compileRequest }
    : { host, port, payload, zpl: payload }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Send failed (${res.status})`)
  }
  return res.json()
}

export async function checkServiceHealth(baseUrl, timeoutMs = 2000) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/health`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) throw new Error(`Service returned ${res.status}`)
  const data = await res.json()
  if (!data?.ok) throw new Error('Service did not report ready')
  return data
}

/** Host label for banners and the status popover ("localhost:5088"). */
export function printServiceHost(url) {
  try {
    return new URL(url).host
  } catch {
    return String(url || '')
  }
}
