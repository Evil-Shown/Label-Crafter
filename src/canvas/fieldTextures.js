import * as THREE from 'three'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import { interpolateTokens } from '../utils/template'

function canvasTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
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

function parseDimensions(dims) {
  const m = String(dims || '').match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i)
  if (!m) return { w: 4, h: 3 }
  const a = Number(m[1])
  const b = Number(m[2])
  const max = Math.max(a, b)
  return { w: a / max, h: b / max }
}

function drawDxfPreview(ctx, w, h, labelData, field) {
  const pad = 8
  const iw = w - pad * 2
  const ih = h - pad * 2
  const cx = w / 2
  const cy = h / 2

  ctx.strokeStyle = field.strokeColor || '#111'
  ctx.lineWidth = field.strokeWidth || 1.5

  const contour = labelData?.contour || labelData?.shapeContour
  if (Array.isArray(contour) && contour.length >= 3) {
    const xs = contour.map((p) => p.x ?? p[0])
    const ys = contour.map((p) => p.y ?? p[1])
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
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

    if (field.showBevel) {
      ctx.setLineDash([3, 2])
      ctx.strokeStyle = '#3b82f6'
      ctx.stroke()
      ctx.setLineDash([])
    }
  } else {
    const ratio = parseDimensions(labelData?.Dimensions || labelData?.dimensions)
    const gw = iw * ratio.w
    const gh = ih * ratio.h
    const gx = pad + (iw - gw) / 2
    const gy = pad + (ih - gh) / 2

    ctx.beginPath()
    ctx.moveTo(gx, gy)
    ctx.lineTo(gx + gw * 0.75, gy)
    ctx.lineTo(gx + gw, gy + gh * 0.2)
    ctx.lineTo(gx + gw, gy + gh)
    ctx.lineTo(gx, gy + gh)
    ctx.closePath()
    if (field.fillEnabled) {
      ctx.fillStyle = field.fillColor || '#f1f5f9'
      ctx.fill()
    }
    ctx.stroke()
  }

  if (!field.hideEdgeLabels) {
    const dims = String(labelData?.Dimensions || labelData?.dimensions || '1200×800')
    ctx.font = '8px Arial'
    ctx.fillStyle = '#475569'
    ctx.textAlign = 'center'
    ctx.fillText(dims, cx, pad + ih + 2)
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

export async function buildFieldCanvas(field, labelData, globalStyles, showLiveTokens = true) {
  const w = Math.max(8, Math.round(field.width || 10))
  const h = Math.max(8, Math.round(field.height || 10))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, w, h)

  const type = (field.type || 'text').toLowerCase()
  const data = showLiveTokens ? labelData : {}

  if (type === 'text') {
    const raw = field.value || field.label || ''
    const text = interpolateTokens(raw, data)
    const fs = field.fontSize || globalStyles?.defaultFontSize || 12
    const ff = field.fontFamily || globalStyles?.fontFamily || 'Arial'
    const fw = field.fontWeight === 'bold' ? 'bold' : 'normal'

    if (field.blackBox) {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = field.color || '#ffffff'
    } else {
      ctx.fillStyle = field.color || globalStyles?.defaultColor || '#000'
    }

    ctx.font = `${fw} ${fs}px ${ff}`
    ctx.textAlign = field.textAlign || 'left'
    ctx.textBaseline = 'top'
    const pad = field.blackBox ? 4 : 2
    const lines = String(text).split('\n')
    let y = pad
    for (const line of lines) {
      let x = pad
      if (ctx.textAlign === 'center') x = w / 2
      if (ctx.textAlign === 'right') x = w - pad
      ctx.fillText(line, x, y)
      y += fs * 1.2
    }
    if (field.border) {
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 1
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
    }
    return canvasTexture(canvas)
  }

  if (type === 'table') {
    const cols = field.columns || ['Col1', 'Col2']
    const rows = field.rows || [['A', 'B']]
    const fs = field.fontSize || 9
    ctx.font = `${fs}px Arial`
    const rowH = Math.max(fs + 6, h / (rows.length + 1))
    const colW = w / cols.length
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, w, h)
    cols.forEach((c, i) => {
      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(i * colW, 0, colW, rowH)
      ctx.fillStyle = '#000'
      ctx.fillText(c, i * colW + 4, 4)
      ctx.strokeRect(i * colW, 0, colW, rowH)
    })
    rows.forEach((row, ri) => {
      const y = rowH + ri * rowH
      row.forEach((cell, ci) => {
        ctx.strokeRect(ci * colW, y, colW, rowH)
        ctx.fillStyle = '#000'
        ctx.fillText(String(cell), ci * colW + 4, y + 4)
      })
    })
    return canvasTexture(canvas)
  }

  if (type === 'barcode') {
    const sources = field.source || ['Barcode', 'barcode']
    let val = ''
    for (const s of sources) {
      if (labelData[s]) { val = String(labelData[s]); break }
    }
    if (!val) val = field.fallbackValue || '000000000'
    try {
      const bc = document.createElement('canvas')
      JsBarcode(bc, val, {
        format: field.barcodeFormat || 'CODE128',
        displayValue: field.displayValue !== false,
        fontSize: Math.max(8, Math.min(14, h * 0.2)),
        margin: 2,
        width: 2,
        height: Math.max(20, h - 16),
      })
      ctx.drawImage(bc, 0, 0, w, h)
    } catch {
      ctx.fillStyle = '#666'
      ctx.font = '10px Arial'
      ctx.fillText('Barcode', 4, 14)
    }
    return canvasTexture(canvas)
  }

  if (type === 'qrcode') {
    const sources = field.source || ['Barcode', 'barcode']
    let val = ''
    for (const s of sources) {
      if (labelData[s]) { val = String(labelData[s]); break }
    }
    if (!val) val = field.fallbackValue || 'sample'
    try {
      const qrCanvas = document.createElement('canvas')
      await QRCode.toCanvas(qrCanvas, val, {
        width: Math.min(w, h),
        margin: 1,
        errorCorrectionLevel: field.qrEcc || 'M',
      })
      ctx.drawImage(qrCanvas, 0, 0, w, h)
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
