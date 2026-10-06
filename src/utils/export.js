import { buildFieldCanvas, getTexturePixelRatio } from '../canvas/fieldTextures'
import { mmToPx, DESIGN_DPI } from './units'

/**
 * Render at a chosen DPI so the PNG/PDF carries the printer's real resolution
 * rather than the 96 DPI design size.
 */
export async function renderLabelToCanvas(state, { thermal = false, dpi } = {}) {
  const targetDpi = Number(dpi) || state.printerDpi || 96
  const scale = targetDpi / DESIGN_DPI
  const labelW = mmToPx(state.width)
  const labelH = mmToPx(state.height)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(labelW * scale))
  canvas.height = Math.max(1, Math.round(labelH * scale))
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = state.globalStyles?.backgroundColor || '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.scale(scale, scale)

  const fields = [...(state.fields || [])]
    .filter((f) => !f.hidden)
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))

  const exportPr = Math.max(2, getTexturePixelRatio(scale))
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

  if (state.showCutOutline) {
    ctx.strokeStyle = '#DC2626'
    ctx.lineWidth = 1 / scale
    ctx.setLineDash([4 / scale, 3 / scale])
    ctx.strokeRect(0, 0, labelW, labelH)
    ctx.setLineDash([])
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
  const canvas = await renderLabelToCanvas(state, { thermal: state.thermalPreview, dpi: state.printerDpi })
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

/**
 * Exact-size PDF: one page in millimetres with no page margins. Uses the print
 * dialog so the user can also choose "Save as PDF".
 */
export async function exportPdf(state, filename) {
  const canvas = await renderLabelToCanvas(state, { dpi: state.printerDpi })
  const imgData = canvas.toDataURL('image/png')
  const w = Number(state.width) || 90
  const h = Number(state.height) || 43
  const win = window.open('', '_blank')
  if (!win) return false
  const title = (filename || state.name || 'Label').replace(/</g, '&lt;')
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>
  @page { size: ${w}mm ${h}mm; margin: 0; }
  html, body { margin: 0; padding: 0; }
  img { width: ${w}mm; height: ${h}mm; display: block; }
</style></head>
<body><img src="${imgData}" onload="window.print();" /></body></html>`)
  win.document.close()
  return true
}

export function downloadTextFile(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
