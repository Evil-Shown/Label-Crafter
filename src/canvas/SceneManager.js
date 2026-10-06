import * as THREE from 'three'

/**
 * Orthographic viewport where one world unit equals one design pixel.
 * At zoom 1 a design pixel is exactly one CSS pixel, so the zoom percentage
 * shown in the status bar means what the designer expects (spec §1.6).
 */
export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    this.scene.background = null

    this.viewport = { w: canvas.clientWidth || 800, h: canvas.clientHeight || 600, zoom: 1 }

    this.camera = new THREE.OrthographicCamera(-400, 400, 300, -300, 0.1, 20000)
    this.camera.position.set(0, 0, 1000)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this._pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    this.renderer.setPixelRatio(this._pixelRatio)
    this.renderer.setSize(this.viewport.w, this.viewport.h, false)

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this._plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    this._target = new THREE.Vector3()

    this.labelGroup = new THREE.Group()
    this.scene.add(this.labelGroup)

    this.gridGroup = new THREE.Group()
    this.labelGroup.add(this.gridGroup)

    this.contentGroup = new THREE.Group()
    this.labelGroup.add(this.contentGroup)

    this.overlayGroup = new THREE.Group()
    this.labelGroup.add(this.overlayGroup)

    this._meshes = new Map()
  }

  resize() {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    if (!w || !h) return
    if (w === this.viewport.w && h === this.viewport.h) return
    this.viewport.w = w
    this.viewport.h = h
    this._pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    this.renderer.setPixelRatio(this._pixelRatio)
    this.renderer.setSize(w, h, false)
  }

  /** Fit the frustum to the viewport at the given zoom, centred on the pan offset. */
  setTransform(zoom, panX, panY) {
    const { w, h } = this.viewport
    const z = Math.max(0.05, zoom || 1)
    this.viewport.zoom = z
    this.camera.left = -w / (2 * z)
    this.camera.right = w / (2 * z)
    this.camera.top = h / (2 * z)
    this.camera.bottom = -h / (2 * z)
    // The camera position is the pan offset; label space is the label's own
    // coordinates with y pointing up.
    this.camera.position.set(panX, panY, 1000)
    this.camera.updateProjectionMatrix()
  }

  screenToWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect()
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1
    const ny = -((clientY - rect.top) / rect.height) * 2 + 1
    this.pointer.set(nx, ny)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    this.raycaster.ray.intersectPlane(this._plane, this._target)
    return this._target
  }

  hitTest(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect()
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1
    const ny = -((clientY - rect.top) / rect.height) * 2 + 1
    this.pointer.set(nx, ny)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const meshes = [...this._meshes.values()].sort(
      (a, b) => (b.userData.zIndex ?? 0) - (a.userData.zIndex ?? 0),
    )
    const hits = this.raycaster.intersectObjects(meshes, false)
    return hits[0]?.object?.userData?.fieldKey ?? null
  }

  registerMesh(key, mesh) {
    const old = this._meshes.get(key)
    if (old) {
      this.contentGroup.remove(old)
      old.geometry?.dispose()
      if (old.material?.map) old.material.map.dispose()
      old.material?.dispose()
    }
    mesh.userData.fieldKey = key
    this._meshes.set(key, mesh)
    this.contentGroup.add(mesh)
  }

  clearMeshes() {
    for (const [, mesh] of this._meshes) {
      this.contentGroup.remove(mesh)
      mesh.geometry?.dispose()
      if (mesh.material?.map) mesh.material.map.dispose()
      mesh.material?.dispose()
    }
    this._meshes.clear()
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.clearMeshes()
    this.renderer.dispose()
  }
}
