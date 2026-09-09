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

// THREE is imported by caller; re-export helper that accepts THREE
export async function buildFieldCanvas(field, labelData, globalStyles) {
  const w = Math.max(8, Math.round(field.width || 10))
  const h = Math.max(8, Math.round(field.height || 10))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, w, h)

  const type = (field.type || 'text').toLowerCase()

  if (type === 'text') {
    const raw = field.value || field.label || ''
    const text = interpolateTokens(raw, labelData)
    const fs = field.fontSize || globalStyles?.defaultFontSize || 12
    const ff = field.fontFamily || globalStyles?.fontFamily || 'Arial'
    const fw = field.fontWeight === 'bold' ? 'bold' : 'normal'
    ctx.fillStyle = field.color || globalStyles?.defaultColor || '#000'
    ctx.font = `${fw} ${fs}px ${ff}`
    ctx.textAlign = field.textAlign || 'left'
    ctx.textBaseline = 'top'
    const pad = 2
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

  if (type === 'barcode') {
    const sources = field.source || ['Barcode', 'barcode']
    let val = ''
    for (const s of sources) {
      if (labelData[s]) {
        val = String(labelData[s])
        break
      }
    }
    if (!val) val = field.fallbackValue || '000000000'
    try {
      const bc = document.createElement('canvas')
      JsBarcode(bc, val, {
        format: 'CODE128',
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
      if (labelData[s]) {
        val = String(labelData[s])
        break
      }
    }
    if (!val) val = field.fallbackValue || 'sample'
    try {
      const qrCanvas = document.createElement('canvas')
      await QRCode.toCanvas(qrCanvas, val, {
        width: Math.min(w, h),
        margin: 1,
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
    ctx.beginPath()
    ctx.moveTo(0, h / 2)
    ctx.lineTo(w, h / 2)
    ctx.stroke()
    return canvasTexture(canvas)
  }

  if (type === 'shape') {
    const shape = (field.shapeType || 'rect').toLowerCase()
    ctx.strokeStyle = field.strokeColor || '#000'
    ctx.lineWidth = field.strokeWidth || 2
    if (field.fillEnabled) {
      ctx.fillStyle = field.fillColor || '#ccc'
    }
    if (shape === 'circle') {
      const r = Math.min(w, h) / 2
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, r - 1, 0, Math.PI * 2)
      if (field.fillEnabled) ctx.fill()
      ctx.stroke()
    } else if (shape === 'dxf') {
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1.5
      ctx.strokeRect(4, 4, w - 8, h - 8)
      ctx.font = '9px Arial'
      ctx.fillStyle = '#666'
      ctx.fillText('DXF shape', 8, h / 2)
    } else {
      if (field.fillEnabled) {
        ctx.fillRect(1, 1, w - 2, h - 2)
      }
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
