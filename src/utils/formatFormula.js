/**
 * Small Crystal-style formulas for one label element.
 *
 * Rules, one per line:
 *   if {Rush} then bold
 *   if {Status} = "HOLD" then suppress
 *   if {WeightKg} > 20 then color #B91C1C else color #111111
 *   if {OrderNo} <> "" then text "Job " & {OrderNo}
 *
 * Actions: bold, normal, italic, regular, underline, strike, suppress, show,
 * color #hex, size 14, align left|center|right, text "..." or text {Field}
 */

function lookup(data, key) {
  if (!data || !key) return ''
  if (Object.prototype.hasOwnProperty.call(data, key)) return data[key]
  const found = Object.keys(data).find((k) => k.toLowerCase() === key.toLowerCase())
  return found ? data[found] : ''
}

function isTruthy(v) {
  if (v === true) return true
  if (v === false || v == null) return false
  const s = String(v).trim().toLowerCase()
  if (s === '' || s === '0' || s === 'false' || s === 'no' || s === 'n') return false
  return true
}

function compare(left, op, right) {
  const ln = Number(left)
  const rn = Number(right)
  const bothNum = left !== '' && right !== '' && Number.isFinite(ln) && Number.isFinite(rn)
  const a = bothNum ? ln : String(left ?? '').toLowerCase()
  const b = bothNum ? rn : String(right ?? '').toLowerCase()
  switch (op) {
    case '=':
    case '==':
      return a === b
    case '<>':
    case '!=':
      return a !== b
    case '>':
      return a > b
    case '<':
      return a < b
    case '>=':
      return a >= b
    case '<=':
      return a <= b
    default:
      return false
  }
}

function tokenize(src) {
  const s = String(src || '')
  const out = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (/\s/.test(c)) { i += 1; continue }
    if (c === '"') {
      let j = i + 1
      let buf = ''
      while (j < s.length && s[j] !== '"') {
        buf += s[j]
        j += 1
      }
      out.push({ t: 'str', v: buf })
      i = j + 1
      continue
    }
    if (c === '{') {
      const j = s.indexOf('}', i + 1)
      out.push({ t: 'field', v: s.slice(i + 1, j === -1 ? s.length : j).trim() })
      i = j === -1 ? s.length : j + 1
      continue
    }
    if (c === '&' || c === '(' || c === ')') {
      out.push({ t: c, v: c })
      i += 1
      continue
    }
    if (s.startsWith('<>', i) || s.startsWith('>=', i) || s.startsWith('<=', i) || s.startsWith('!=', i)) {
      out.push({ t: 'op', v: s.slice(i, i + 2) })
      i += 2
      continue
    }
    if ('=><'.includes(c)) {
      out.push({ t: 'op', v: c })
      i += 1
      continue
    }
    if (/[0-9.]/.test(c)) {
      let j = i + 1
      while (j < s.length && /[0-9.]/.test(s[j])) j += 1
      out.push({ t: 'num', v: Number(s.slice(i, j)) })
      i = j
      continue
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j += 1
      out.push({ t: 'id', v: s.slice(i, j) })
      i = j
      continue
    }
    if (c === '#') {
      let j = i + 1
      while (j < s.length && /[0-9A-Fa-f]/.test(s[j])) j += 1
      out.push({ t: 'str', v: s.slice(i, j) })
      i = j
      continue
    }
    i += 1
  }
  return out
}

function evaluateExpression(src, data) {
  const tokens = tokenize(src)
  let i = 0

  function peek() { return tokens[i] }
  function primary() {
    const tok = peek()
    if (!tok) return ''
    if (tok.t === 'str') { i += 1; return tok.v }
    if (tok.t === 'num') { i += 1; return tok.v }
    if (tok.t === 'field') { i += 1; return lookup(data, tok.v) }
    if (tok.t === 'id') {
      i += 1
      const id = tok.v.toLowerCase()
      if (id === 'true') return true
      if (id === 'false') return false
      if (id === 'not') return !isTruthy(orExpr())
      return lookup(data, tok.v)
    }
    if (tok.t === '(') {
      i += 1
      const v = orExpr()
      if (peek()?.t === ')') i += 1
      return v
    }
    i += 1
    return ''
  }
  function value() {
    const parts = [primary()]
    while (peek()?.t === '&') {
      i += 1
      parts.push(primary())
    }
    if (parts.length === 1) return parts[0]
    return parts.map((p) => (p == null ? '' : String(p))).join('')
  }
  function cmp() {
    const left = value()
    const op = peek()
    if (op?.t === 'op') {
      i += 1
      const right = value()
      return compare(left, op.v, right)
    }
    return left
  }
  function andExpr() {
    let v = cmp()
    while (peek()?.t === 'id' && peek().v.toLowerCase() === 'and') {
      i += 1
      v = isTruthy(v) && isTruthy(cmp())
    }
    return v
  }
  function orExpr() {
    let v = andExpr()
    while (peek()?.t === 'id' && peek().v.toLowerCase() === 'or') {
      i += 1
      v = isTruthy(v) || isTruthy(andExpr())
    }
    return v
  }
  return orExpr()
}

function parseAction(raw, data) {
  const text = String(raw || '').trim()
  const m = text.match(/^(bold|normal|italic|regular|underline|strike|strikeout|suppress|show|hide)\b/i)
  if (m && text.length === m[1].length) {
    const a = m[1].toLowerCase()
    if (a === 'bold') return { fontWeight: 'bold' }
    if (a === 'normal' || a === 'regular') return { fontWeight: 'normal', fontStyle: 'normal' }
    if (a === 'italic') return { fontStyle: 'italic' }
    if (a === 'underline') return { underline: true }
    if (a === 'strike' || a === 'strikeout') return { strikeout: true }
    if (a === 'suppress' || a === 'hide') return { suppress: true }
    if (a === 'show') return { suppress: false }
  }
  const color = text.match(/^color\s+(#[0-9A-Fa-f]{3,8})\s*$/i)
  if (color) return { color: color[1] }
  const size = text.match(/^size\s+([0-9.]+)\s*$/i)
  if (size) return { fontSize: Number(size[1]) }
  const align = text.match(/^align\s+(left|center|right)\s*$/i)
  if (align) return { textAlign: align[1].toLowerCase() }
  const textCmd = text.match(/^text\s+(.+)$/i)
  if (textCmd) return { display: String(evaluateExpression(textCmd[1], data) ?? '') }
  if (!text) return {}
  return { display: String(evaluateExpression(text, data) ?? '') }
}

function splitRule(line) {
  const src = line.trim()
  const lower = src.toLowerCase()
  if (!lower.startsWith('if ')) return null
  const thenAt = lower.indexOf(' then ')
  if (thenAt < 0) return null
  const elseAt = lower.indexOf(' else ', thenAt + 6)
  const condition = src.slice(3, thenAt).trim()
  const thenPart = (elseAt < 0 ? src.slice(thenAt + 6) : src.slice(thenAt + 6, elseAt)).trim()
  const elsePart = elseAt < 0 ? '' : src.slice(elseAt + 6).trim()
  return { condition, thenPart, elsePart }
}

export function applyFormatRules(rulesText, data) {
  const patch = {}
  const lines = String(rulesText || '').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const rule = splitRule(trimmed)
    if (!rule) continue
    let cond = false
    try {
      cond = isTruthy(evaluateExpression(rule.condition, data))
    } catch {
      cond = false
    }
    const action = cond ? rule.thenPart : rule.elsePart
    if (!action) continue
    Object.assign(patch, parseAction(action, data))
  }
  return patch
}

export function effectiveFormat(field, data) {
  const base = {
    suppress: !!field.hidden || !!field.suppress,
    fontWeight: field.fontWeight || 'normal',
    fontStyle: field.fontStyle || 'normal',
    underline: !!field.underline,
    strikeout: !!field.strikeout,
    color: field.color || '#000000',
    fontSize: field.fontSize || 12,
    fontFamily: field.fontFamily || 'Arial',
    textAlign: field.textAlign || 'left',
    letterSpacing: Number(field.letterSpacing) || 0,
    canGrow: !!field.canGrow,
    maxLines: Number(field.maxLines) || 0,
    borderLeft: field.borderLeft || 'none',
    borderRight: field.borderRight || 'none',
    borderTop: field.borderTop || 'none',
    borderBottom: field.borderBottom || 'none',
    borderColor: field.borderColor || '#000000',
    background: !!field.background,
    backgroundColor: field.backgroundColor || '#ffffff',
    display: null,
  }
  const patch = applyFormatRules(field.formatRules, data)
  return { ...base, ...patch }
}

export function formulaPreview(rulesText, data) {
  try {
    return applyFormatRules(rulesText, data)
  } catch (err) {
    return { error: err?.message || 'Formula error' }
  }
}
