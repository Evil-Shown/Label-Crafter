/** Design DPI — matches Opti Labels editor and Label Print Service compiler. */
export const DESIGN_DPI = 96

export const mmToPx = (mm) => (Number(mm || 0) * DESIGN_DPI) / 25.4
export const pxToMm = (px) => (Number(px || 0) * 25.4) / DESIGN_DPI

export const mmToDots = (mm, dpmm) => Math.round(Number(mm || 0) * dpmm)
export const pxToDots = (px, dpmm) =>
  Math.round((Number(px || 0) * dpmm * 25.4) / DESIGN_DPI)

export const snapPx = (px, gridMm = 1) => {
  const gridPx = mmToPx(gridMm)
  return Math.round(px / gridPx) * gridPx
}
