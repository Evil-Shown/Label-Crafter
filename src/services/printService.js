/**
 * Client for SPIL Label Print Service (Lable Print Service repo).
 * POST /api/labels/compile | /api/labels/send | batch
 */

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
      printerBrand: brand,
      layout: 'template',
      printerDpi,
      widthMm: template.width,
      heightMm: template.height,
      template,
      labelData,
      configuration,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Compile failed (${res.status})`)
  }
  return res.json()
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

export async function checkServiceHealth(baseUrl) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/health`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Service returned ${res.status}`)
  const data = await res.json()
  if (!data?.ok) throw new Error('Service did not report ready')
  return data
}
