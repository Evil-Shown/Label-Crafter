/**
 * Reads an Opti project file (.oif) into the shared label data bag shape.
 *
 * The file is JSON. Different Opti versions nest the piece list differently, so
 * the parser walks the document for the first array of objects that carry a
 * recognisable piece shape and normalises it. Nothing is invented: a field that
 * the file does not contain stays absent so the canvas shows its key chip.
 */

const NOTE_KEY = /^note(\d+)$/i

function collectNotes(source, out = {}) {
  if (!source || typeof source !== 'object') return out
  for (const [key, value] of Object.entries(source)) {
    const m = key.match(NOTE_KEY)
    if (m && value != null && typeof value !== 'object') {
      out[`note${m[1]}`] = out[`note${m[1]}`] || {}
      out[`note${m[1]}`][`field${NOTE_SLOT[key] ?? 1}`] = value
    }
  }
  return out
}

/** Maps Opti's flat note names (e.g. "note1_field3") onto note/field pairs. */
const NOTE_SLOT = (() => {
  const map = {}
  for (let n = 1; n <= 50; n += 1) {
    for (let f = 1; f <= 30; f += 1) map[`note${n}_field${f}`] = f
  }
  return map
})()

function looksLikePiece(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
  const keys = Object.keys(obj)
  return keys.some((k) => NOTE_KEY.test(k)) || keys.some((k) => /^(id|piece|pieceId|name|number)$/i.test(k))
}

function findPieceArray(doc) {
  const queue = [doc]
  const seen = new Set()
  while (queue.length) {
    const node = queue.shift()
    if (!node || typeof node !== 'object' || seen.has(node)) continue
    seen.add(node)
    if (Array.isArray(node)) {
      if (node.length && node.every(looksLikePiece)) return node
      queue.push(...node)
      continue
    }
    queue.push(...Object.values(node))
  }
  return []
}

export function parseOifText(text) {
  let doc
  try {
    doc = JSON.parse(text)
  } catch (e) {
    throw new Error('That file is not valid JSON, so it is not an Opti project file.')
  }

  const raw = findPieceArray(doc)
  const pieces = raw.map((p, i) => {
    const bag = {}
    collectNotes(p, bag)
    // Carry plain string/number fields through so piece/order fields resolve too.
    for (const [k, v] of Object.entries(p)) {
      if (v == null || typeof v === 'object') continue
      if (NOTE_KEY.test(k)) continue
      bag[k] = v
    }
    if (bag.id == null) bag.id = i + 1
    return { index: i + 1, values: bag }
  })

  if (!pieces.length) throw new Error('No pieces were found in that project file.')
  return pieces
}

/** Flatten one piece for display in the picker table. */
export function pieceSummary(piece) {
  const v = piece?.values || {}
  const pick = (...keys) => {
    for (const k of keys) {
      const val = v[k]
      if (val != null && String(val).trim() !== '') return String(val)
    }
    return ''
  }
  return {
    size: pick('Dimensions', 'dimensions', 'size', 'Size'),
    custPo: pick('custPO', 'CustPO', 'custPo', 'PO', 'po'),
    service: pick('service1', 'Service1', 'service'),
  }
}