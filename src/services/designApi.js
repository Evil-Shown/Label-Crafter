function baseUrl(url) {
  return String(url || '').replace(/\/$/, '')
}

async function readError(res) {
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    return json.error || json.message || text
  } catch {
    return text || `Request failed (${res.status})`
  }
}

export async function fetchDesignSession(serviceUrl, sessionId) {
  const res = await fetch(`${baseUrl(serviceUrl)}/api/design-sessions/${encodeURIComponent(sessionId)}`)
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

/** Read SQL table/column names for the ERP field list. Password is not stored on the service. */
export async function inspectDatabase(serviceUrl, body) {
  const res = await fetch(`${baseUrl(serviceUrl)}/api/db/inspect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function fetchFieldCatalog(serviceUrl, client) {
  const res = await fetch(`${baseUrl(serviceUrl)}/api/field-catalog?client=${encodeURIComponent(client)}`)
  if (!res.ok) throw new Error(await readError(res))
  const data = await res.json()
  return data.fields || []
}

export async function listServerTemplates(serviceUrl, client) {
  const res = await fetch(`${baseUrl(serviceUrl)}/api/templates?client=${encodeURIComponent(client)}`)
  if (!res.ok) throw new Error(await readError(res))
  const data = await res.json()
  return data.templates || []
}

/** ERP orders come from the shared database, read-only (spec §5.1). */
export async function listErpOrders(serviceUrl, { search = '' } = {}) {
  const q = search ? `?search=${encodeURIComponent(search)}` : ''
  const res = await fetch(`${baseUrl(serviceUrl)}/api/erp/orders${q}`)
  if (!res.ok) throw new Error(await readError(res))
  const data = await res.json()
  return data.orders || []
}

/** One ERP order with its real piece values. Never written back. */
export async function getErpOrder(serviceUrl, orderNo) {
  const res = await fetch(
    `${baseUrl(serviceUrl)}/api/erp/orders/${encodeURIComponent(orderNo)}`,
  )
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function getServerTemplate(serviceUrl, client, id) {
  const res = await fetch(
    `${baseUrl(serviceUrl)}/api/templates/${encodeURIComponent(client)}/${encodeURIComponent(id)}`,
  )
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}

export async function saveServerTemplate(serviceUrl, { client, id, name, labelType, template, sessionId }) {
  const payload = { client, id, name, labelType, template, sessionId }
  const url = id
    ? `${baseUrl(serviceUrl)}/api/templates/${encodeURIComponent(client)}/${encodeURIComponent(id)}`
    : `${baseUrl(serviceUrl)}/api/templates`
  const res = await fetch(url, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}
