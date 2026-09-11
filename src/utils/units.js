/** Design DPI — matches Opti Labels editor and Label Print Service compiler. */
export const DESIGN_DPI = 96

const MM_PER_INCH = 25.4

export const mmToPx = (mm) => (Number(mm || 0) * DESIGN_DPI) / MM_PER_INCH
export const pxToMm = (px) => (Number(px || 0) * MM_PER_INCH) / DESIGN_DPI

/** Convert a display value to internal mm storage. */
export function toMm(value, unit = 'mm') {
  const v = Number(value) || 0
  if (unit === 'inch') return v * MM_PER_INCH
  if (unit === 'cm') return v * 10
  return v
}

/** Convert internal mm to display value for the given unit. */
export function fromMm(mm, unit = 'mm') {
  const v = Number(mm) || 0
  if (unit === 'inch') return v / MM_PER_INCH
  if (unit === 'cm') return v / 10
  return v
}

export function unitLabel(unit = 'mm') {
  if (unit === 'inch') return 'in'
  if (unit === 'cm') return 'cm'
  return 'mm'
}

export function formatSize(widthMm, heightMm, unit = 'mm', decimals = unit === 'inch' ? 2 : 1) {
  const w = fromMm(widthMm, unit)
  const h = fromMm(heightMm, unit)
  const u = unitLabel(unit)
  const fmt = (n) => (decimals > 0 ? n.toFixed(decimals).replace(/\.?0+$/, '') : String(Math.round(n)))
  return `${fmt(w)} × ${fmt(h)} ${u}`
}

export function roundDisplay(value, unit = 'mm') {
  const d = unit === 'inch' ? 2 : unit === 'cm' ? 1 : 1
  return Math.round(value * 10 ** d) / 10 ** d
}

/** Format width/height from a template JSON object (export/library format). */
export function formatTemplateSize(template) {
  if (!template) return ''
  const u = template.unit || 'mm'
  return `${template.width} × ${template.height} ${unitLabel(u)}`
}

export const mmToDots = (mm, dpmm) => Math.round(Number(mm || 0) * dpmm)
export const pxToDots = (px, dpmm) =>
  Math.round((Number(px || 0) * dpmm * 25.4) / DESIGN_DPI)

export const snapPx = (px, gridMm = 1) => {
  const gridPx = mmToPx(gridMm)
  return Math.round(px / gridPx) * gridPx
}

/** Opti-style margin layout for printable-area guide. */
export function computeMarginLayout(widthMm, heightMm, margins) {
  const outerWpx = mmToPx(widthMm)
  const outerHpx = mmToPx(heightMm)
  const padL = mmToPx(margins?.left ?? 0)
  const padT = mmToPx(margins?.top ?? 0)
  const padR = mmToPx(margins?.right ?? 0)
  const padB = mmToPx(margins?.bottom ?? 0)
  const innerWpx = Math.max(1, outerWpx - padL - padR)
  const innerHpx = Math.max(1, outerHpx - padT - padB)
  const hasMargin = padL > 0 || padT > 0 || padR > 0 || padB > 0
  const fitScale = hasMargin
    ? Math.min(innerWpx / outerWpx, innerHpx / outerHpx)
    : 1
  const scaledW = outerWpx * fitScale
  const scaledH = outerHpx * fitScale
  return {
    outerWpx,
    outerHpx,
    padL,
    padT,
    padR,
    padB,
    innerWpx,
    innerHpx,
    hasMargin,
    fitScale,
    contentLeft: padL + (innerWpx - scaledW) / 2,
    contentTop: padT + (innerHpx - scaledH) / 2,
    guideW: scaledW,
    guideH: scaledH,
  }
}

/** Center label in orthographic viewport (world origin = screen center). */
export function computeFitView(labelW, labelH, canvasW, canvasH, padding = 56) {
  const view = 300
  const aspect = Math.max(0.1, canvasW / Math.max(1, canvasH))
  const worldW = 2 * view * aspect
  const worldH = 2 * view
  const padX = (padding / Math.max(1, canvasW)) * worldW
  const padY = (padding / Math.max(1, canvasH)) * worldH
  const zoom = Math.min(
    (worldW - padX) / labelW,
    (worldH - padY) / labelH,
    8,
  )
  const clampedZoom = Math.max(0.15, zoom)
  return {
    zoom: clampedZoom,
    panX: -labelW * clampedZoom / 2,
    panY: labelH * clampedZoom / 2,
  }
}
