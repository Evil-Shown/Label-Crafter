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

function parseNoteObject(val) {
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (parsed && typeof parsed === 'object') return parsed
    } catch {}
  }
  return val && typeof val === 'object' ? val : null
}

function collectNotes(source, out) {
  if (!source || typeof source !== 'object') return out
  for (const [key, value] of Object.entries(source)) {
    if (value == null) continue
    const token = NOTE_TOKEN.exec(key.trim())
    if (token) {
      if (typeof value !== 'object') {
        assignNote(out, Number(token[1]), Number(token[2]), value)
      }
      continue
    }
    const only = NOTE_ONLY.exec(key.trim())
    if (only) {
      const noteNo = Number(only[1])
      const obj = parseNoteObject(value)
      if (obj) {
        if (Array.isArray(obj)) {
          obj.forEach((v, j) => {
            if (v != null && typeof v !== 'object') assignNote(out, noteNo, j + 1, v)
          })
        } else {
          for (const [subKey, subVal] of Object.entries(obj)) {
            if (subVal == null || typeof subVal === 'object') continue
            const subMatch = /(?:field|f)?[\s._-]*(\d+)/i.exec(subKey.trim())
            if (subMatch) {
              assignNote(out, noteNo, Number(subMatch[1]), subVal)
            }
          }
        }
      } else if (typeof value !== 'object') {
        assignNote(out, noteNo, 1, value)
      }
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
    size: pick('Dimensions', 'dimensions', 'size', 'Size') || note(1, 5) || (v.width && v.height ? `${Math.round(v.width)} × ${Math.round(v.height)}` : ''),
    custPo: pick('custPO', 'CustPO', 'custPo', 'PO', 'po'),
    service: pick('service1', 'Service1', 'service') || note(1, 2),
  }
}

/**
 * Extracts and categorizes all unique data fields and note slots available
 * across an array of parsed OIF pieces.
 */
export function extractOifDataFields(pieces = []) {
  const pieceKeyMap = new Map()
  const noteKeyMap = new Map()

  pieces.forEach((p) => {
    const v = p.values || {}
    for (const [k, val] of Object.entries(v)) {
      if (k.startsWith('note') && typeof val === 'object' && val !== null) {
        const noteMatch = /^note(\d+)$/i.exec(k)
        const noteNo = noteMatch ? Number(noteMatch[1]) : 1
        for (const [fk, fval] of Object.entries(val)) {
          const fieldMatch = /(?:field|f)?[\s._-]*(\d+)/i.exec(fk)
          const fieldNo = fieldMatch ? Number(fieldMatch[1]) : 1
          const fullKey = `note${noteNo}.field${fieldNo}`
          if (!noteKeyMap.has(fullKey)) {
            noteKeyMap.set(fullKey, {
              key: fullKey,
              label: `Note ${noteNo} · Field ${fieldNo}`,
              category: 'note',
              noteField: noteNo,
              subField: fieldNo,
              samples: new Set(),
            })
          }
          if (fval != null && String(fval).trim() !== '') {
            noteKeyMap.get(fullKey).samples.add(String(fval).trim())
          }
        }
      } else if (val != null && typeof val !== 'object') {
        if (!pieceKeyMap.has(k)) {
          // Format label nicely
          const formattedLabel = k
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (s) => s.toUpperCase())
            .trim()
          pieceKeyMap.set(k, {
            key: k,
            label: formattedLabel,
            category: 'piece',
            samples: new Set(),
          })
        }
        if (String(val).trim() !== '') {
          pieceKeyMap.get(k).samples.add(String(val).trim())
        }
      }
    }
  })

  const pieceFields = Array.from(pieceKeyMap.values()).map((f) => {
    const sampleArr = Array.from(f.samples)
    return {
      key: f.key,
      label: f.label,
      category: 'piece',
      sample: sampleArr[0] || '',
      totalSamples: sampleArr.length,
    }
  })

  // Sort note fields numerically by note then field
  const noteFields = Array.from(noteKeyMap.values())
    .map((f) => {
      const sampleArr = Array.from(f.samples)
      return {
        key: f.key,
        label: f.label,
        category: 'note',
        noteField: f.noteField,
        subField: f.subField,
        sample: sampleArr[0] || '',
        totalSamples: sampleArr.length,
      }
    })
    .sort((a, b) => (a.noteField === b.noteField ? a.subField - b.subField : a.noteField - b.noteField))

  return { pieceFields, noteFields }
}