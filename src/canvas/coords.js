import * as THREE from 'three'

/**
 * Label space: origin at the label's top-left, +x right, +y down.
 * One world unit equals one design pixel, so zoom 100 % draws a design pixel
 * as one CSS pixel.
 */
export function screenToLabelLocal(sm, clientX, clientY) {
  const world = sm.screenToWorld(clientX, clientY)
  return { x: world.x, y: -world.y }
}

/** Label-local px → canvas element pixel coords (for HTML overlays). */
export function labelLocalToCanvasPx(sm, lx, ly) {
  const v = new THREE.Vector3(lx, -ly, 0)
  v.project(sm.camera)
  const rect = sm.canvas.getBoundingClientRect()
  return {
    x: (v.x * 0.5 + 0.5) * rect.width,
    y: (-v.y * 0.5 + 0.5) * rect.height,
  }
}
