import * as THREE from 'three'

/** Convert screen/client coords to label-local design px (y-down). */
export function screenToLabelLocal(sm, clientX, clientY, zoom, panX, panY) {
  const world = sm.screenToWorld(clientX, clientY)
  return {
    x: (world.x - panX) / zoom,
    y: -(world.y - panY) / zoom,
  }
}

/** Label-local px → canvas element pixel coords (for HTML overlays). */
export function labelLocalToCanvasPx(sm, lx, ly, zoom, panX, panY) {
  const wx = panX + lx * zoom
  const wy = panY - ly * zoom
  const v = new THREE.Vector3(wx, wy, 0)
  v.project(sm.camera)
  const rect = sm.canvas.getBoundingClientRect()
  return {
    x: (v.x * 0.5 + 0.5) * rect.width,
    y: (-v.y * 0.5 + 0.5) * rect.height,
  }
}
