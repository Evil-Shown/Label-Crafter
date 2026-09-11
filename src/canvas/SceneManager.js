import * as THREE from 'three'

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    this.scene.background = null

    const w = canvas.clientWidth || 800
    const h = canvas.clientHeight || 600
    const aspect = w / h
    const view = 300
    this.camera = new THREE.OrthographicCamera(
      -view * aspect,
      view * aspect,
      view,
      -view,
      0.1,
      5000,
    )
    this.camera.position.set(0, 0, 500)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    this._pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    this.renderer.setPixelRatio(this._pixelRatio)
    this.renderer.setSize(w, h, false)

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()

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
    const aspect = w / h
    const view = 300
    this.camera.left = -view * aspect
    this.camera.right = view * aspect
    this.camera.top = view
    this.camera.bottom = -view
    this.camera.updateProjectionMatrix()
    this._pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    this.renderer.setPixelRatio(this._pixelRatio)
    this.renderer.setSize(w, h, false)
  }

  screenToWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect()
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1
    const ny = -((clientY - rect.top) / rect.height) * 2 + 1
    this.pointer.set(nx, ny)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    const target = new THREE.Vector3()
    this.raycaster.ray.intersectPlane(plane, target)
    return target
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

  setTransform(zoom, panX, panY) {
    this.labelGroup.scale.set(zoom, zoom, 1)
    this.labelGroup.position.set(panX, panY, 0)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.clearMeshes()
    this.renderer.dispose()
  }
}
