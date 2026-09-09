/** Label-space geometry helpers (design px, y-down). */

export const HANDLE_SIZE = 8
export const ROTATE_HANDLE_OFFSET = 22

export function fieldRect(f) {
  return { x: f.x, y: f.y, w: f.width, h: f.height }
}

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h
}

/** 8 resize handles + rotation handle positions in label space. */
export function getHandlePositions(f) {
  const { x, y, w, h } = fieldRect(f)
  return {
    nw: { x, y, type: 'nw' },
    n: { x: x + w / 2, y, type: 'n' },
    ne: { x: x + w, y, type: 'ne' },
    e: { x: x + w, y: y + h / 2, type: 'e' },
    se: { x: x + w, y: y + h, type: 'se' },
    s: { x: x + w / 2, y: y + h, type: 's' },
    sw: { x, y: y + h, type: 'sw' },
    w: { x, y: y + h / 2, type: 'w' },
    rotate: { x: x + w / 2, y: y - ROTATE_HANDLE_OFFSET, type: 'rotate' },
  }
}

export function hitTestHandle(px, py, f, tol = HANDLE_SIZE) {
  const handles = getHandlePositions(f)
  for (const h of Object.values(handles)) {
    if (Math.abs(px - h.x) <= tol && Math.abs(py - h.y) <= tol) return h.type
  }
  return null
}

export function rectsIntersect(a, b) {
  return !(
    a.x + a.w < b.x ||
    b.x + b.w < a.x ||
    a.y + a.h < b.y ||
    b.y + b.h < a.y
  )
}

export function applyResize(orig, handle, dx, dy, minSize = 8) {
  let { x, y, width: w, height: h } = orig
  if (handle.includes('e')) w = Math.max(minSize, w + dx)
  if (handle.includes('w')) {
    w = Math.max(minSize, w - dx)
    x = orig.x + (orig.width - w)
  }
  if (handle.includes('s')) h = Math.max(minSize, h + dy)
  if (handle.includes('n')) {
    h = Math.max(minSize, h - dy)
    y = orig.y + (orig.height - h)
  }
  return { x, y, width: w, height: h }
}

export function computeSnapGuides(moving, others, labelW, labelH, tolerance = 4) {
  const guides = []
  const m = fieldRect(moving)
  const mx = [m.x, m.x + m.w / 2, m.x + m.w]
  const my = [m.y, m.y + m.h / 2, m.y + m.h]

  const addV = (x) => guides.push({ axis: 'v', pos: x })
  const addH = (y) => guides.push({ axis: 'h', pos: y })

  for (const o of others) {
    const r = fieldRect(o)
    const ox = [r.x, r.x + r.w / 2, r.x + r.w]
    const oy = [r.y, r.y + r.h / 2, r.y + r.h]
    for (const a of mx) {
      for (const b of ox) {
        if (Math.abs(a - b) <= tolerance) addV(b)
      }
    }
    for (const a of my) {
      for (const b of oy) {
        if (Math.abs(a - b) <= tolerance) addH(b)
      }
    }
  }

  // Page edges
  for (const a of mx) {
    if (Math.abs(a) <= tolerance) addV(0)
    if (Math.abs(a - labelW) <= tolerance) addV(labelW)
  }
  for (const a of my) {
    if (Math.abs(a) <= tolerance) addH(0)
    if (Math.abs(a - labelH) <= tolerance) addH(labelH)
  }

  return guides
}

export function snapPosition(x, y, w, h, guides, tolerance = 4) {
  let nx = x
  let ny = y
  const cx = x + w / 2
  const cy = y + h / 2
  const rx = x + w
  const by = y + h

  for (const g of guides) {
    if (g.axis === 'v') {
      if (Math.abs(x - g.pos) <= tolerance) nx = g.pos
      else if (Math.abs(cx - g.pos) <= tolerance) nx = g.pos - w / 2
      else if (Math.abs(rx - g.pos) <= tolerance) nx = g.pos - w
    }
    if (g.axis === 'h') {
      if (Math.abs(y - g.pos) <= tolerance) ny = g.pos
      else if (Math.abs(cy - g.pos) <= tolerance) ny = g.pos - h / 2
      else if (Math.abs(by - g.pos) <= tolerance) ny = g.pos - h
    }
  }
  return { x: nx, y: ny }
}
