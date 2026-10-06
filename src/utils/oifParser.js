/**
 * Reads an Opti project file (.oif) into the shared label data bag shape.
 *
 * The file is JSON. Different Opti versions nest the piece list differently, so
 * the parser walks the document for the first array of objects that carry a
 * recognisable piece shape and normalises it. Nothing is invented: a field the
 * file does not contain stays absent so the canvas shows its key chip.
 */

/** `note1_field3`, `note1.field3`, `Note1F3`, `note_1_3` → { note: 1, field: 3 } */
const NOTE_TOKEN = /^note[\s._-]*(\d+)[\s._-]*(?:f|field)?[\s._-]*(\d+)$/i
/** A note object present but without a field number, e.g. `note1`. */
const NOTE_ONLY = /^note[\s._-]*(\d+)$/i

function assignNote(bag, noteNo, fieldNo, value) {
  if (!bag[`note${noteNo}`] || typeof bag[`note${noteNo}`] !== 'object') {
    bag[`note${noteNo}`] = {}
  }
  bag[`note${noteNo}`][`field${fieldNo}`] = value
}

function collectNotes(source, out) {
  if (!source || typeof source !== 'object') return out
  for (const [key, value] of Object.entries(source)) {
    if (value == null || typeof value === 'object') continue
    const token = NOTE_TOKEN.exec(key.trim())
    if (token) {
      assignNote(out, Number(token[1]), Number(token[2]), value)
      continue
    }
    const only = NOTE_ONLY.exec(key.trim())
    if (only) {
      assignNote(out, Number(only[1]), 1, value)
    }
  }
  // A nested `notes: [{ fields: [...] }]` shape, if present.
  const notes = source.notes
  if (Array.isArray(notes)) {
    notes.forEach((note, i) => {
      if (!note || typeof note !== 'object') return
      const list = note.fields || note.values || []
      if (Array.isArray(list)) {
        list.forEach((v, j) => {
          if (v != null && typeof v !== 'object') assignNote(out, i + 1, j + 1, v)
        })
      }
    })
  }
  return out
}

function looksLikePiece(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
  const keys = Object.keys(obj)
  return (
    keys.some((k) => NOTE_TOKEN.test(k.trim()) || NOTE_ONLY.test(k.trim())) ||
    keys.some((k) => /^(id|piece|pieceId|name|number)$/i.test(k))
  )
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
  } catch {
    throw new Error('That file is not valid JSON, so it is not an Opti project file.')
  }

  const raw = findPieceArray(doc)
  const pieces = raw.map((p, i) => {
    const bag = {}
    collectNotes(p, bag)
    // Carry plain string/number fields through so piece/order fields resolve too.
    for (const [k, v] of Object.entries(p)) {
      if (v == null || typeof v === 'object') continue
      const clean = k.trim()
      if (NOTE_TOKEN.test(clean) || NOTE_ONLY.test(clean)) continue
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
  const note = (n, f) => {
    const group = v[`note${n}`]
    const val = group && typeof group === 'object' ? group[`field${f}`] : null
    return val != null && String(val).trim() !== '' ? String(val) : ''
  }
  return {
    size: pick('Dimensions', 'dimensions', 'size', 'Size') || note(1, 5),
    custPo: pick('custPO', 'CustPO', 'custPo', 'PO', 'po'),
    service: pick('service1', 'Service1', 'service') || note(1, 2),
  }
}