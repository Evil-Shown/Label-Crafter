import { useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import { SceneManager } from './SceneManager'
import { buildFieldCanvas } from './fieldTextures'
import { screenToLabelLocal, labelLocalToCanvasPx } from './coords'
import { useLabelStore } from '../store/labelStore'
import { mmToPx, snapPx } from '../utils/units'
import {
  hitTestHandle,
  applyResize,
  computeSnapGuides,
  snapPosition,
  rectsIntersect,
  fieldRect,
  ROTATE_HANDLE_OFFSET,
} from '../utils/geometry'
import AlignmentToolbar from '../ui/AlignmentToolbar'
import ContextMenu from '../ui/ContextMenu'
import StatusBar from '../ui/StatusBar'
import Minimap from '../ui/Minimap'

function clearGroup(group) {
  while (group.children.length) {
    const c = group.children[0]
    group.remove(c)
    c.geometry?.dispose()
    c.material?.dispose()
  }
}

function buildGrid(gridGroup, labelW, labelH, gridMm, showGrid, isDark) {
  clearGroup(gridGroup)
  if (!showGrid) return
  const step = mmToPx(gridMm)
  const lines = []
  for (let x = 0; x <= labelW; x += step) lines.push(x, 0, 0.5, x, -labelH, 0.5)
  for (let y = 0; y <= labelH; y += step) lines.push(0, -y, 0.5, labelW, -y, 0.5)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3))
  gridGroup.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
    color: isDark ? 0x334155 : 0xd1d5db, transparent: true, opacity: 0.6,
  })))
}

function buildPaper(contentGroup, overlayGroup, labelW, labelH, isDark) {
  let shadow = contentGroup.getObjectByName('__paper_shadow__')
  if (!shadow) {
    shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15 }))
    shadow.name = '__paper_shadow__'
    contentGroup.add(shadow)
  }
  shadow.scale.set(labelW + 12, labelH + 12, 1)
  shadow.position.set(labelW / 2, -labelH / 2, -2)
  shadow.material.opacity = isDark ? 0.4 : 0.12

  let paper = contentGroup.getObjectByName('__paper__')
  if (!paper) {
    paper = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }))
    paper.name = '__paper__'
    contentGroup.add(paper)
  }
  paper.scale.set(labelW, labelH, 1)
  paper.position.set(labelW / 2, -labelH / 2, -1)
  paper.material.color.set(isDark ? 0xf8fafc : 0xffffff)

  clearGroup(overlayGroup)
  const border = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(labelW, labelH)),
    new THREE.LineBasicMaterial({ color: isDark ? 0x475569 : 0x94a3b8, depthTest: false }),
  )
  border.position.set(labelW / 2, -labelH / 2, 0.6)
  overlayGroup.add(border)
}

function buildMargins(overlayGroup, labelW, labelH, margins) {
  const padL = mmToPx(margins?.left ?? 0)
  const padT = mmToPx(margins?.top ?? 0)
  const innerW = Math.max(1, labelW - padL - mmToPx(margins?.right ?? 0))
  const innerH = Math.max(1, labelH - padT - mmToPx(margins?.bottom ?? 0))
  const geo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(innerW, innerH))
  const line = new THREE.LineSegments(geo, new THREE.LineDashedMaterial({ color: 0x64748b, dashSize: 4, gapSize: 3, depthTest: false }))
  line.computeLineDistances()
  line.position.set(padL + innerW / 2, -(padT + innerH / 2), 1.2)
  overlayGroup.add(line)
}

function buildSelectionGizmo(overlayGroup, f, isPrimary) {
  const { x, y, width: w, height: h } = f
  const cx = x + w / 2
  const cy = -(y + h / 2)
  const color = isPrimary ? 0x4f46e5 : 0x818cf8

  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, depthTest: false }),
  )
  fill.position.set(cx, cy, 2)
  overlayGroup.add(fill)

  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)),
    new THREE.LineBasicMaterial({ color, depthTest: false }),
  )
  outline.position.set(cx, cy, 2.1)
  overlayGroup.add(outline)

  if (!isPrimary) return

  const hs = 5
  const coords = [
    [x, -y], [x + w / 2, -y], [x + w, -y],
    [x + w, -(y + h / 2)], [x + w, -(y + h)],
    [x + w / 2, -(y + h)], [x, -(y + h)], [x, -(y + h / 2)],
  ]
  coords.forEach(([hx, hy]) => {
    const handle = new THREE.Mesh(
      new THREE.PlaneGeometry(hs, hs),
      new THREE.MeshBasicMaterial({ color: 0x4f46e5, depthTest: false }),
    )
    handle.position.set(hx, hy, 3)
    overlayGroup.add(handle)
  })

  // Rotation handle
  const rotY = -(y - ROTATE_HANDLE_OFFSET)
  const rotLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(cx, -y, 3),
      new THREE.Vector3(cx, rotY, 3),
    ]),
    new THREE.LineBasicMaterial({ color: 0x4f46e5, depthTest: false }),
  )
  overlayGroup.add(rotLine)
  const rotHandle = new THREE.Mesh(
    new THREE.CircleGeometry(4, 12),
    new THREE.MeshBasicMaterial({ color: 0x4f46e5, depthTest: false }),
  )
  rotHandle.position.set(cx, rotY, 3.1)
  overlayGroup.add(rotHandle)
}

export default function LabelCanvas() {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const sceneRef = useRef(null)
  const interactionRef = useRef(null)
  const spaceRef = useRef(false)
  const [isPanning, setIsPanning] = useState(false)
  const [marquee, setMarquee] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)

  const fields = useLabelStore((s) => s.fields)
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)
  const margins = useLabelStore((s) => s.margins)
  const globalStyles = useLabelStore((s) => s.globalStyles)
  const labelData = useLabelStore((s) => s.labelData)
  const showLiveTokens = useLabelStore((s) => s.showLiveTokens)
  const zoom = useLabelStore((s) => s.zoom)
  const panX = useLabelStore((s) => s.panX)
  const panY = useLabelStore((s) => s.panY)
  const showGrid = useLabelStore((s) => s.showGrid)
  const gridMm = useLabelStore((s) => s.gridMm)
  const snapToGrid = useLabelStore((s) => s.snapToGrid)
  const snapToElements = useLabelStore((s) => s.snapToElements)
  const snapToEdges = useLabelStore((s) => s.snapToEdges)
  const activeTool = useLabelStore((s) => s.activeTool)
  const theme = useLabelStore((s) => s.theme)
  const thermalPreview = useLabelStore((s) => s.thermalPreview)
  const activeSnapGuides = useLabelStore((s) => s.activeSnapGuides)

  const isDark = theme === 'dark'
  const labelW = mmToPx(width)
  const labelH = mmToPx(height)

  const getLocal = (clientX, clientY) => {
    const sm = sceneRef.current
    if (!sm) return { x: 0, y: 0 }
    const s = useLabelStore.getState()
    return screenToLabelLocal(sm, clientX, clientY, s.zoom, s.panX, s.panY)
  }

  const syncMeshes = useCallback(async () => {
    const sm = sceneRef.current
    if (!sm) return
    sm.clearMeshes()
    const visible = fields.filter((f) => !f.hidden)
    const sorted = [...visible].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
    for (const field of sorted) {
      const tex = await buildFieldCanvas(field, labelData, globalStyles, showLiveTokens)
      const w = Math.max(1, field.width)
      const h = Math.max(1, field.height)
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }),
      )
      mesh.position.set(field.x + w / 2, -(field.y + h / 2), 0)
      if (field.rotation) mesh.rotation.z = (-field.rotation * Math.PI) / 180
      mesh.userData.zIndex = field.zIndex ?? 0
      sm.registerMesh(field.fieldKey, mesh)
    }
    buildGrid(sm.gridGroup, labelW, labelH, gridMm, showGrid, isDark)
    clearGroup(sm.overlayGroup)
    buildPaper(sm.contentGroup, sm.overlayGroup, labelW, labelH, isDark)
    buildMargins(sm.overlayGroup, labelW, labelH, margins)
    const primary = selectedKeys[0]
    for (const key of selectedKeys) {
      const f = fields.find((x) => x.fieldKey === key)
      if (f) buildSelectionGizmo(sm.overlayGroup, f, key === primary)
    }
    sm.setTransform(zoom, panX, panY)
    sm.render()
  }, [fields, labelData, globalStyles, showLiveTokens, selectedKeys, labelW, labelH, margins, gridMm, showGrid, zoom, panX, panY, isDark])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const sm = new SceneManager(canvas)
    sceneRef.current = sm
    const ro = new ResizeObserver(() => { sm.resize(); sm.render() })
    ro.observe(canvas.parentElement)
    return () => { ro.disconnect(); sm.dispose(); sceneRef.current = null }
  }, [])

  useEffect(() => { syncMeshes() }, [syncMeshes])
  useEffect(() => {
    const sm = sceneRef.current
    if (sm) { sm.setTransform(zoom, panX, panY); sm.render() }
  }, [zoom, panX, panY])

  const shouldPan = (e) =>
    e.button === 1 || e.ctrlKey || e.metaKey || spaceRef.current || activeTool === 'pan'

  const onPointerDown = (e) => {
    if (e.button === 2) return
    const sm = sceneRef.current
    if (!sm) return
    const store = useLabelStore.getState()
    const local = getLocal(e.clientX, e.clientY)
    store.setCursorPos(local)

    if (shouldPan(e)) {
      interactionRef.current = { mode: 'pan', pointerId: e.pointerId, x: e.clientX, y: e.clientY, panX, panY }
      setIsPanning(true)
      e.currentTarget.setPointerCapture(e.pointerId)
      return
    }

    const hitKey = sm.hitTest(e.clientX, e.clientY)
    const primaryField = hitKey ? store.fields.find((f) => f.fieldKey === hitKey) : null

    if (primaryField && !primaryField.locked) {
      const handle = selectedKeys.includes(hitKey)
        ? hitTestHandle(local.x, local.y, primaryField, 10 / store.zoom)
        : null

      if (handle === 'rotate' && selectedKeys.length === 1) {
        const cx = primaryField.x + primaryField.width / 2
        const cy = primaryField.y + primaryField.height / 2
        interactionRef.current = {
          mode: 'rotate', pointerId: e.pointerId, key: hitKey,
          cx, cy, startAngle: Math.atan2(local.y - cy, local.x - cx),
          origRot: primaryField.rotation || 0, historySaved: false,
        }
        e.currentTarget.setPointerCapture(e.pointerId)
        return
      }

      if (handle && handle !== 'rotate' && selectedKeys.length === 1) {
        interactionRef.current = {
          mode: 'resize', pointerId: e.pointerId, key: hitKey, handle,
          orig: { ...primaryField }, startLocal: local, historySaved: false,
        }
        e.currentTarget.setPointerCapture(e.pointerId)
        return
      }

      if (e.shiftKey) {
        const set = new Set(selectedKeys)
        set.has(hitKey) ? set.delete(hitKey) : set.add(hitKey)
        store.select([...set])
      } else if (!selectedKeys.includes(hitKey)) {
        store.select([hitKey])
      }

      const dragKeys = store.selectedKeys.includes(hitKey) ? store.selectedKeys : [hitKey]
      const origins = {}
      for (const k of dragKeys) {
        const f = store.fields.find((x) => x.fieldKey === k)
        if (f && !f.locked) origins[k] = { x: f.x, y: f.y }
      }
      interactionRef.current = {
        mode: 'move', pointerId: e.pointerId, origins, startLocal: local, historySaved: false,
      }
      e.currentTarget.setPointerCapture(e.pointerId)
      return
    }

    // Marquee select on empty canvas
    if (e.button === 0 && activeTool === 'select') {
      interactionRef.current = {
        mode: 'marquee', pointerId: e.pointerId,
        start: local, current: local, historySaved: false,
      }
      setMarquee({ x: local.x, y: local.y, w: 0, h: 0 })
      if (!e.shiftKey) store.clearSelection()
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }

  const onPointerMove = (e) => {
    const sm = sceneRef.current
    if (!sm) return
    const store = useLabelStore.getState()
    const local = getLocal(e.clientX, e.clientY)
    store.setCursorPos(local)
    const inter = interactionRef.current
    if (!inter || inter.pointerId !== e.pointerId) return

    if (inter.mode === 'pan') {
      const dx = e.clientX - inter.x
      const dy = e.clientY - inter.y
      store.setView({ panX: inter.panX + dx, panY: inter.panY - dy })
      return
    }

    if (!inter.historySaved) {
      store.pushHistory()
      inter.historySaved = true
    }

    if (inter.mode === 'marquee') {
      inter.current = local
      const x = Math.min(inter.start.x, local.x)
      const y = Math.min(inter.start.y, local.y)
      const w = Math.abs(local.x - inter.start.x)
      const h = Math.abs(local.y - inter.start.y)
      setMarquee({ x, y, w, h })
      return
    }

    if (inter.mode === 'rotate') {
      const angle = Math.atan2(local.y - inter.cy, local.x - inter.cx)
      const deg = inter.origRot + (angle - inter.startAngle) * (180 / Math.PI)
      store.updateFieldLive(inter.key, { rotation: Math.round(deg) })
      return
    }

    if (inter.mode === 'resize') {
      const dx = local.x - inter.startLocal.x
      const dy = local.y - inter.startLocal.y
      const patch = applyResize(inter.orig, inter.handle, dx, dy)
      store.updateFieldLive(inter.key, patch)
      return
    }

    if (inter.mode === 'move') {
      const dx = local.x - inter.startLocal.x
      const dy = local.y - inter.startLocal.y
      const keys = Object.keys(inter.origins)
      const primaryKey = keys[0]
      const primaryOrig = inter.origins[primaryKey]
      if (!primaryOrig) return

      let nx = primaryOrig.x + dx
      let ny = primaryOrig.y + dy
      const pf = store.fields.find((f) => f.fieldKey === primaryKey)

      if (snapToGrid) {
        nx = snapPx(nx, gridMm)
        ny = snapPx(ny, gridMm)
      }

      if ((snapToElements || snapToEdges) && pf) {
        const others = snapToElements
          ? store.fields.filter((f) => !keys.includes(f.fieldKey) && !f.hidden)
          : []
        let guides = computeSnapGuides(
          { x: nx, y: ny, width: pf.width, height: pf.height },
          others, labelW, labelH,
        )
        if (!snapToEdges) {
          guides = guides.filter((g) => {
            if (g.axis === 'v') return g.pos !== 0 && g.pos !== labelW
            return g.pos !== 0 && g.pos !== labelH
          })
        }
        store.setActiveSnapGuides(guides)
        const snapped = snapPosition(nx, ny, pf.width, pf.height, guides)
        nx = snapped.x
        ny = snapped.y
      } else {
        store.setActiveSnapGuides([])
      }

      const snapDx = nx - primaryOrig.x
      const snapDy = ny - primaryOrig.y
      for (const k of keys) {
        const o = inter.origins[k]
        store.updateFieldLive(k, { x: o.x + snapDx, y: o.y + snapDy })
      }
    }
  }

  const endPointer = (e) => {
    const inter = interactionRef.current
    if (!inter || inter.pointerId !== e.pointerId) return

    if (inter.mode === 'marquee' && inter.current) {
      const x = Math.min(inter.start.x, inter.current.x)
      const y = Math.min(inter.start.y, inter.current.y)
      const w = Math.abs(inter.current.x - inter.start.x)
      const h = Math.abs(inter.current.y - inter.start.y)
      const box = { x, y, w, h }
      if (w > 3 || h > 3) {
        const hits = useLabelStore.getState().fields
          .filter((f) => !f.hidden && rectsIntersect(box, fieldRect(f)))
          .map((f) => f.fieldKey)
        if (hits.length) useLabelStore.getState().select(hits)
      }
      setMarquee(null)
    }

    if (inter.mode === 'move') useLabelStore.getState().setActiveSnapGuides([])

    if (inter.mode === 'pan') setIsPanning(false)
    interactionRef.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  useEffect(() => {
    const down = (e) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault()
        spaceRef.current = true
      }
    }
    const up = (e) => { if (e.code === 'Space') spaceRef.current = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  const onContextMenu = (e) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const onWheel = (e) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    const s = useLabelStore.getState()
    s.setView({ zoom: Math.min(8, Math.max(0.15, s.zoom * factor)) })
  }

  const cursorClass = isPanning || spaceRef.current || activeTool === 'pan'
    ? isPanning ? 'cursor-grabbing' : 'cursor-grab'
    : 'cursor-default'

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className={`block h-full w-full select-none ${cursorClass}`}
        style={thermalPreview ? { filter: 'grayscale(1) contrast(1.4)' } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onContextMenu={onContextMenu}
        onWheel={onWheel}
      />

      <AlignmentToolbar />

      {/* Marquee overlay */}
      {marquee && sceneRef.current && (() => {
        const sm = sceneRef.current
        const tl = labelLocalToCanvasPx(sm, marquee.x, marquee.y, zoom, panX, panY)
        const br = labelLocalToCanvasPx(sm, marquee.x + marquee.w, marquee.y + marquee.h, zoom, panX, panY)
        return (
          <div
            className="pointer-events-none absolute border-2 border-indigo-500 bg-indigo-500/10"
            style={{
              left: Math.min(tl.x, br.x),
              top: Math.min(tl.y, br.y),
              width: Math.abs(br.x - tl.x),
              height: Math.abs(br.y - tl.y),
            }}
          />
        )
      })()}

      {/* Snap guides */}
      {activeSnapGuides.map((g, i) => {
        if (!sceneRef.current) return null
        const sm = sceneRef.current
        if (g.axis === 'v') {
          const p = labelLocalToCanvasPx(sm, g.pos, 0, zoom, panX, panY)
          return <div key={i} className="pointer-events-none absolute top-0 bottom-0 w-px bg-pink-500 opacity-80" style={{ left: p.x }} />
        }
        const p = labelLocalToCanvasPx(sm, 0, g.pos, zoom, panX, panY)
        return <div key={i} className="pointer-events-none absolute left-0 right-0 h-px bg-pink-500 opacity-80" style={{ top: p.y }} />
      })}

      <StatusBar />
      <Minimap />
      {contextMenu && <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} />}
    </div>
  )
}
