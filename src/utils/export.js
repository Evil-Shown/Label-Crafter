import { buildFieldCanvas, getTexturePixelRatio } from '../canvas/fieldTextures'
import { mmToPx } from './units'

/** Render label fields to a 2D canvas at design resolution (px @ 96 DPI). */
export async function renderLabelToCanvas(state, { thermal = false } = {}) {
  const labelW = mmToPx(state.width)
  const labelH = mmToPx(state.height)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(labelW))
  canvas.height = Math.max(1, Math.round(labelH))
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = state.globalStyles?.backgroundColor || '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const fields = [...(state.fields || [])]
    .filter((f) => !f.hidden)
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))

  const exportPr = Math.max(2, getTexturePixelRatio(1))
  for (const field of fields) {
    const tex = await buildFieldCanvas(
      field,
      state.labelData,
      state.globalStyles,
      state.showLiveTokens,
      exportPr,
    )
    const img = tex.image
    const x = field.x ?? 0
    const y = field.y ?? 0
    const w = field.width ?? img.width
    const h = field.height ?? img.height
    const rot = ((field.rotation ?? 0) * Math.PI) / 180

    ctx.save()
    if (rot) {
      ctx.translate(x + w / 2, y + h / 2)
      ctx.rotate(rot)
      ctx.drawImage(img, -w / 2, -h / 2, w, h)
    } else {
      ctx.drawImage(img, x, y, w, h)
    }
    ctx.restore()
    tex.dispose?.()
  }

  if (thermal) {
    const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = id.data
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      const bit = gray > 160 ? 255 : 0
      d[i] = d[i + 1] = d[i + 2] = bit
    }
    ctx.putImageData(id, 0, 0)
  }

  return canvas
}

export async function exportPng(state, filename) {
  const canvas = await renderLabelToCanvas(state, { thermal: state.thermalPreview })
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(false)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename || `${state.name || 'label'}.png`
      a.click()
      URL.revokeObjectURL(a.href)
      resolve(true)
    }, 'image/png')
  })
}

export async function exportPdf(state, filename) {
  const canvas = await renderLabelToCanvas(state)
  const imgData = canvas.toDataURL('image/png')
  const w = state.width
  const h = state.height
  const win = window.open('', '_blank')
  if (!win) return false
  win.document.write(`<!DOCTYPE html><html><head><title>${state.name || 'Label'}</title>
<style>@page{size:${w}mm ${h}mm;margin:0}body{margin:0}img{width:${w}mm;height:${h}mm;display:block}</style></head>
<body><img src="${imgData}" onload="window.print();setTimeout(()=>window.close(),300)"/></body></html>`)
  win.document.close()
  return true
}
