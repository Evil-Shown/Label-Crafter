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
