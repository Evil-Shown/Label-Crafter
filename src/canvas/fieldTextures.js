import * as THREE from 'three'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import { isTextLikeType, resolveFieldDisplayText, resolveMappedPreview } from '../utils/template'

/** Pixel ratio for offscreen field canvases — matches screen zoom so textures stay sharp. */
export function getTexturePixelRatio(zoom = 1) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  return Math.min(4, Math.max(1, Math.ceil(dpr * Math.max(1, zoom))))
}

function canvasTexture(canvas, { crisp = false } = {}) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.generateMipmaps = false
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = crisp ? THREE.NearestFilter : THREE.LinearFilter
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

function createHiDpiContext(w, h, pixelRatio) {
  const pr = Math.max(1, pixelRatio)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * pr)
  canvas.height = Math.round(h * pr)
  const ctx = canvas.getContext('2d')
  ctx.scale(pr, pr)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return { canvas, ctx, w, h, pr }
}

function drawRoundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.lineTo(x + w - rad, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad)
  ctx.lineTo(x + w, y + h - rad)
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
  ctx.lineTo(x + rad, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad)
  ctx.lineTo(x, y + rad)
  ctx.quadraticCurveTo(x, y, x + rad, y)
  ctx.closePath()
}

function isBoldWeight(weight) {
  const w = String(weight || '').toLowerCase()
  if (w === 'bold' || w === 'bolder') return true
  const n = Number(weight)
  return Number.isFinite(n) && n >= 600
}

function drawEmptyDxf(ctx, w, h) {
  ctx.setLineDash([6, 4])
  ctx.strokeStyle = '#888'
  ctx.lineWidth = 1.25
  ctx.strokeRect(1, 1, w - 2, h - 2)
  ctx.setLineDash([])
  ctx.fillStyle = '#888'
  ctx.font = '11px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('No Shape', w / 2, h / 2)
}

function drawDxfPreview(ctx, w, h, labelData, field) {
  const stored = Array.isArray(field.dxfShape) ? field.dxfShape : []
  const contour = stored.length ? stored : (labelData?.contour || labelData?.shapeContour)
  const hasContour = Array.isArray(contour) && contour.length >= 3 && stored.length > 0
  if (!hasContour) {
    drawEmptyDxf(ctx, w, h)
    return
  }

  const pad = 8
  const iw = w - pad * 2
  const ih = h - pad * 2
  const cx = w / 2

  ctx.strokeStyle = field.strokeColor || '#111'
  ctx.lineWidth = field.strokeWidth || 1.5

  const xs = contour.map((p) => p.x ?? p[0] ?? p.x1)
  const ys = contour.map((p) => p.y ?? p[1] ?? p.y1)
  const minX = Math.min(...xs.filter((n) => Number.isFinite(n)))
  const maxX = Math.max(...xs.filter((n) => Number.isFinite(n)))
  const minY = Math.min(...ys.filter((n) => Number.isFinite(n)))
  const maxY = Math.max(...ys.filter((n) => Number.isFinite(n)))
  const rw = maxX - minX || 1
  const rh = maxY - minY || 1
  const scale = Math.min(iw / rw, ih / rh)
  const ox = pad + (iw - rw * scale) / 2
  const oy = pad + (ih - rh * scale) / 2

  ctx.beginPath()
  contour.forEach((p, i) => {
    const px = ox + ((p.x ?? p[0]) - minX) * scale
    const py = oy + ((p.y ?? p[1]) - minY) * scale
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.closePath()
  if (field.fillEnabled) {
    ctx.fillStyle = field.fillColor || '#f1f5f9'
    ctx.fill()
  }
  ctx.stroke()

  if (!field.hideEdgeLabels) {
    const dims = String(labelData?.Dimensions || labelData?.dimensions || '')
    if (dims) {
      ctx.font = '8px Arial'
      ctx.fillStyle = '#475569'
      ctx.textAlign = 'center'
      ctx.fillText(dims, cx, pad + ih + 2)
    }
  }

  if (field.showOrientation) {
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.moveTo(cx, pad + 4)
    ctx.lineTo(cx - 5, pad + 12)
    ctx.lineTo(cx + 5, pad + 12)
    ctx.closePath()
    ctx.fill()
  }
}

export async function buildFieldCanvas(
  field,
  labelData,
  globalStyles,
  showLiveTokens = true,
  pixelRatio = 1,
) {
  const w = Math.max(8, Math.round(field.width || 10))
  const h = Math.max(8, Math.round(field.height || 10))
  const { canvas, ctx, pr } = createHiDpiContext(w, h, pixelRatio)
  ctx.clearRect(0, 0, w, h)

  const type = (field.type || 'text').toLowerCase()
  const data = showLiveTokens ? labelData : {}

  if (isTextLikeType(type)) {
    const text = resolveFieldDisplayText(field, data, { showLiveTokens })
    const fs = field.fontSize || globalStyles?.defaultFontSize || 12
    const ff = field.fontFamily || globalStyles?.fontFamily || 'Arial'
    const fw = isBoldWeight(field.fontWeight) ? 'bold' : 'normal'
    const inverted = !!(field.blackBox || field.isBlackBox)

    if (inverted) {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = field.color && field.color !== '#000000' ? field.color : '#ffffff'
    } else {
      ctx.fillStyle = field.color || globalStyles?.defaultColor || '#000'
    }

    ctx.font = `${fw} ${fs}px ${ff}`
    const align = String(field.textAlign || 'left').toLowerCase()
    ctx.textAlign = align === 'center' || align === 'middle' ? 'center'
      : align === 'right' || align === 'end' ? 'right'
      : 'left'
    ctx.textBaseline = 'middle'
    const pad = inverted ? 4 : 2
    const lines = String(text || '').split('\n')
    const lineH = fs * 1.2
    const totalH = Math.max(lineH, lines.length * lineH)
    let y = (h - totalH) / 2 + lineH / 2
    for (const line of lines) {
      let x = pad
      if (ctx.textAlign === 'center') x = w / 2
      if (ctx.textAlign === 'right') x = w - pad
      ctx.fillText(line, x, y)
      y += lineH
    }
    if (field.border) {
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 1
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
    }
    return canvasTexture(canvas, { crisp: false })
  }

  if (type === 'table') {
    const cols = field.columns || ['Col1', 'Col2']
    const rows = field.rows || [['A', 'B']]
    const fs = field.fontSize || 9
    const rowH = h / Math.max(1, rows.length + 1)
    const fittedFontSize = Math.max(5, Math.min(fs, rowH - 7))
    ctx.font = `600 ${fittedFontSize}px Arial`
    ctx.textBaseline = 'middle'
    const colW = w / cols.length
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 1.25
    ctx.strokeRect(0.75, 0.75, w - 1.5, h - 1.5)
    cols.forEach((c, i) => {
      ctx.fillStyle = '#0b172a'
      ctx.fillRect(i * colW, 0, colW, rowH)
      ctx.fillStyle = '#ffffff'
      ctx.save()
      ctx.beginPath()
      ctx.rect(i * colW + 1, 1, colW - 2, rowH - 2)
      ctx.clip()
      ctx.fillText(c, i * colW + 5, rowH / 2, Math.max(1, colW - 10))
      ctx.restore()
      ctx.strokeRect(i * colW, 0, colW, rowH)
    })
    ctx.font = `${fittedFontSize}px Arial`
    rows.forEach((row, ri) => {
      const y = rowH + ri * rowH
      row.forEach((cell, ci) => {
        ctx.fillStyle = ri % 2 === 0 ? '#ffffff' : '#f3f6f8'
        ctx.fillRect(ci * colW, y, colW, rowH)
        ctx.strokeStyle = '#0f172a'
        ctx.strokeRect(ci * colW, y, colW, rowH)
        ctx.fillStyle = '#0f172a'
        ctx.save()
        ctx.beginPath()
        ctx.rect(ci * colW + 1, y + 1, colW - 2, rowH - 2)
        ctx.clip()
        ctx.fillText(String(cell), ci * colW + 5, y + rowH / 2, Math.max(1, colW - 10))
        ctx.restore()
      })
    })
    return canvasTexture(canvas)
  }

  if (type === 'barcode') {
    const sources = field.source || ['Barcode', 'barcode']
    let val = resolveMappedPreview(field, data) || ''
    if (!val) {
      for (const s of sources) {
        if (data[s]) { val = String(data[s]); break }
      }
    }
    if (!val) val = field.fallbackValue || '000000000'
    try {
      const bc = document.createElement('canvas')
      JsBarcode(bc, val, {
        format: field.barcodeFormat || 'CODE128',
        displayValue: field.displayValue !== false,
        fontSize: Math.max(8, Math.min(14, h * 0.2)) * pr,
        margin: 2 * pr,
        width: Math.max(1, 2 * pr),
        height: Math.max(20, h - 16) * pr,
      })
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(bc, 0, 0, w, h)
      ctx.imageSmoothingEnabled = true
    } catch {
      ctx.fillStyle = '#666'
      ctx.font = '10px Arial'
      ctx.fillText('Barcode', 4, 14)
    }
    return canvasTexture(canvas, { crisp: true })
  }

  if (type === 'qrcode') {
    const sources = field.source || ['Barcode', 'barcode']
    let val = resolveMappedPreview(field, data) || ''
    if (!val) {
      for (const s of sources) {
        if (data[s]) { val = String(data[s]); break }
      }
    }
    if (!val) val = field.fallbackValue || 'sample'
    try {
      const qrCanvas = document.createElement('canvas')
      await QRCode.toCanvas(qrCanvas, val, {
        width: Math.round(Math.min(w, h) * pr),
        margin: 1,
        errorCorrectionLevel: field.qrEcc || 'M',
      })
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(qrCanvas, 0, 0, w, h)
      ctx.imageSmoothingEnabled = true
    } catch {
      ctx.strokeRect(1, 1, w - 2, h - 2)
    }
    return canvasTexture(canvas)
  }

  if (type === 'line') {
    ctx.strokeStyle = field.strokeColor || '#000'
    ctx.lineWidth = field.strokeWidth || 2
    if (field.dashStyle === 'dashed') ctx.setLineDash([6, 4])
    if (field.dashStyle === 'dotted') ctx.setLineDash([2, 3])
    ctx.beginPath()
    ctx.moveTo(0, h / 2)
    ctx.lineTo(w, h / 2)
    ctx.stroke()
    ctx.setLineDash([])
    if (field.arrowEnd) {
      ctx.beginPath()
      ctx.moveTo(w, h / 2)
      ctx.lineTo(w - 8, h / 2 - 4)
      ctx.lineTo(w - 8, h / 2 + 4)
      ctx.closePath()
      ctx.fillStyle = field.strokeColor || '#000'
      ctx.fill()
    }
    return canvasTexture(canvas)
  }

  if (type === 'shape') {
    const shape = (field.shapeType || 'rect').toLowerCase()
    ctx.strokeStyle = field.strokeColor || '#000'
    ctx.lineWidth = field.strokeWidth || 2
    if (field.fillEnabled) ctx.fillStyle = field.fillColor || '#ccc'

    if (shape === 'circle' || shape === 'ellipse') {
      ctx.beginPath()
      ctx.ellipse(w / 2, h / 2, w / 2 - 1, h / 2 - 1, 0, 0, Math.PI * 2)
      if (field.fillEnabled) ctx.fill()
      ctx.stroke()
    } else if (shape === 'roundrect') {
      drawRoundRect(ctx, 1, 1, w - 2, h - 2, field.cornerRadius || 8)
      if (field.fillEnabled) ctx.fill()
      ctx.stroke()
    } else if (shape === 'dxf') {
      drawDxfPreview(ctx, w, h, labelData, field)
    } else {
      if (field.fillEnabled) ctx.fillRect(1, 1, w - 2, h - 2)
      ctx.strokeRect(1, 1, w - 2, h - 2)
    }
    return canvasTexture(canvas)
  }

  if (type === 'image' && field.src) {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvasTexture(canvas))
      }
      img.onerror = () => {
        ctx.strokeRect(1, 1, w - 2, h - 2)
        resolve(canvasTexture(canvas))
      }
      img.src = field.src
    })
  }

  ctx.strokeStyle = '#ccc'
  ctx.strokeRect(1, 1, w - 2, h - 2)
  return canvasTexture(canvas)
}
