import { useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import { SceneManager } from './SceneManager'
import { buildFieldCanvas, getTexturePixelRatio } from './fieldTextures'
import { screenToLabelLocal, labelLocalToCanvasPx } from './coords'
import { useLabelStore } from '../store/labelStore'
import { mmToPx, snapPx, computeFitView } from '../utils/units'
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

function clearGroup(group) {
  while (group.children.length) {
    const c = group.children[0]
    group.remove(c)
    c.geometry?.dispose()
    c.material?.dispose()
  }
}

/**
 * Two-tier grid: a very faint 1 mm guide for fine placement plus a slightly
 * stronger line every 5 mm. A single dense tier reads as dither on screen.
 *
 * The paper is always white — even in dark mode (spec §1.8) — so the grid is
 * always drawn in light greys. Using theme-dark grid colours on white paper
 * turns the label into a checkerboard.
 */
function buildGrid(gridGroup, labelW, labelH, gridMm, showGrid) {
  clearGroup(gridGroup)
  if (!showGrid) return
  const step = mmToPx(gridMm) || 1
  const major = step * 5

  const addLines = (spacing, color, z) => {
    const verts = []
    for (let x = 0; x <= labelW + 0.5; x += spacing) verts.push(x, 0, z, x, -labelH, z)
    for (let y = 0; y <= labelH + 0.5; y += spacing) verts.push(0, -y, z, labelW, -y, z)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    gridGroup.add(
      new THREE.LineSegments(
        geo,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }),
      ),
    )
  }

  addLines(step, 0xf4f7fa, 0)
  addLines(major, 0xe4e9f0, 0.1)
  // The grid sits between the paper (-1) and the content (0) so it never
  // draws over the printed elements.
  gridGroup.position.z = -0.5
}

/** One blurred plate gives a soft paper shadow without post-processing. */
function shadowTexture(labelW, labelH, isDark) {
  const pad = 48
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(labelW + pad * 2))
  canvas.height = Math.max(1, Math.round(labelH + pad * 2))
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.shadowColor = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(15,23,42,0.30)'
  ctx.shadowBlur = 22
  ctx.shadowOffsetY = 8
  ctx.fillStyle = '#000'
  ctx.fillRect(pad, pad, canvas.width - pad * 2, canvas.height - pad * 2)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

function buildPaper(contentGroup, labelW, labelH, isDark) {
  const key = '__paper_shadow__'
  let shadow = contentGroup.getObjectByName(key)
  if (!shadow) {
    shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }),
    )
    shadow.name = key
    contentGroup.add(shadow)
  }
  const pad = 48
  if (shadow.userData.w !== labelW || shadow.userData.h !== labelH || shadow.userData.dark !== isDark) {
    shadow.material.map?.dispose()
    shadow.material.map = shadowTexture(labelW, labelH, isDark)
    shadow.scale.set(labelW + pad * 2, labelH + pad * 2, 1)
    shadow.userData = { w: labelW, h: labelH, dark: isDark }
  }
  shadow.position.set(labelW / 2, -labelH / 2, -3)

  let paper = contentGroup.getObjectByName('__paper__')
  if (!paper) {
    paper = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }))
    paper.name = '__paper__'
    contentGroup.add(paper)
  }
  paper.scale.set(labelW, labelH, 1)
  paper.position.set(labelW / 2, -labelH / 2, -1)
  // The label is always white — like real paper — in both themes (spec §1.8).
  paper.material.color.set(0xffffff)
}

function buildLabelBorder(overlayGroup, labelW, labelH, isDark) {
  const pts = [
    new THREE.Vector3(0, 0, 0.5),
    new THREE.Vector3(labelW, 0, 0.5),
    new THREE.Vector3(labelW, -labelH, 0.5),
    new THREE.Vector3(0, -labelH, 0.5),
  ]
  const border = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({
      color: isDark ? 0x3b4a63 : 0xcbd5e1,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
    }),
  )
  overlayGroup.add(border)
}

function buildSelectionGizmo(overlayGroup, f, isPrimary) {
  const { x, y, width: w, height: h } = f
  const cx = x + w / 2
  const cy = -(y + h / 2)
  // Spec §4.1: 2 px --pri outline plus 4 corner handles.
  const color = isPrimary ? 0x2563eb : 0x93c5fd

  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.07, depthTest: false }),
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

  // Four corner handles only (spec §4.1).
  const hs = 7
  ;[
    [x, -y],
    [x + w, -y],
    [x + w, -(y + h)],
    [x, -(y + h)],
  ].forEach(([hx, hy]) => {
    const handle = new THREE.Mesh(
      new THREE.PlaneGeometry(hs, hs),
      new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }),
    )
    handle.position.set(hx, hy, 3)
    overlayGroup.add(handle)
    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(hs, hs)),
      new THREE.LineBasicMaterial({ color, depthTest: false }),
    )
    border.position.set(hx, hy, 3.1)
    overlayGroup.add(border)
  })

  // Rotation handle
  const rotY = -(y - ROTATE_HANDLE_OFFSET)
  const rotLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(cx, -y, 3),
      new THREE.Vector3(cx, rotY, 3),
    ]),
    new THREE.LineBasicMaterial({ color, depthTest: false }),
  )
  overlayGroup.add(rotLine)
  const rotHandle = new THREE.Mesh(
    new THREE.CircleGeometry(5, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }),
  )
  rotHandle.position.set(cx, rotY, 3.1)
  overlayGroup.add(rotHandle)
  const rotRing = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(
      new THREE.EllipseCurve(0, 0, 5, 5, 0, Math.PI * 2, false, 0)
        .getPoints(16)
        .map((p) => new THREE.Vector3(p.x, p.y, 0)),
    ),
    new THREE.LineBasicMaterial({ color, depthTest: false }),
  )
  rotRing.position.set(cx, rotY, 3.2)
  overlayGroup.add(rotRing)
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
  const [hoverCursor, setHoverCursor] = useState('default')

  const fields = useLabelStore((s) => s.fields)
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)
  const globalStyles = useLabelStore((s) => s.globalStyles)
  const labelData = useLabelStore((s) => s.labelData)
  const showLiveTokens = useLabelStore((s) => s.showLiveTokens)
  const showKeysOnCanvas = useLabelStore((s) => s.showKeysOnCanvas)
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
    return screenToLabelLocal(sm, clientX, clientY)
  }

  const syncMeshes = useCallback(async () => {
    const sm = sceneRef.current
    if (!sm) return
    sm.clearMeshes()
    const visible = fields.filter((f) => !f.hidden)
    const sorted = [...visible].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
    const seenTexts = new Set()
    const pr = getTexturePixelRatio(useLabelStore.getState().zoom)
    for (const field of sorted) {
      const tex = await buildFieldCanvas(field, labelData, globalStyles, showLiveTokens, pr, { showKeysOnCanvas, seenTexts })
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
    buildGrid(sm.gridGroup, labelW, labelH, gridMm, showGrid)
    buildPaper(sm.contentGroup, labelW, labelH, isDark)
    clearGroup(sm.overlayGroup)
    buildLabelBorder(sm.overlayGroup, labelW, labelH, isDark)
    const primary = selectedKeys[0]
    for (const key of selectedKeys) {
      const f = fields.find((x) => x.fieldKey === key)
      if (f) buildSelectionGizmo(sm.overlayGroup, f, key === primary)
    }
    sm.setTransform(zoom, panX, panY)
    sm.render()
  }, [fields, labelData, globalStyles, showLiveTokens, showKeysOnCanvas, selectedKeys, labelW, labelH, gridMm, showGrid, zoom, panX, panY, isDark])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const sm = new SceneManager(canvas)
    sceneRef.current = sm

    // Re-fit on window resize so the label always sits centred and fully visible.
    const fit = () => {
      sm.resize()
      const parent = canvas.parentElement
      const rect = parent?.getBoundingClientRect()
      if (rect?.width && rect?.height) {
        const s = useLabelStore.getState()
        const view = computeFitView(mmToPx(s.width), mmToPx(s.height), rect.width, rect.height)
        useLabelStore.getState().setView(view)
      }
      sm.setTransform(
        useLabelStore.getState().zoom,
        useLabelStore.getState().panX,
        useLabelStore.getState().panY,
      )
      sm.render()
    }

    fit()
    const ro = new ResizeObserver(fit)
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

  const cursorForHandle = (handle) => ({
    nw: 'nwse-resize', se: 'nwse-resize',
    ne: 'nesw-resize', sw: 'nesw-resize',
    n: 'ns-resize', s: 'ns-resize',
    e: 'ew-resize', w: 'ew-resize',
    rotate: 'crosshair',
  }[handle] || 'default')

  const startTransform = (handle, field, local, event) => {
    if (!field || field.locked || selectedKeys.length !== 1) return false
    if (handle === 'rotate') {
      const cx = field.x + field.width / 2
      const cy = field.y + field.height / 2
      interactionRef.current = {
        mode: 'rotate', pointerId: event.pointerId, key: field.fieldKey,
        cx, cy, startAngle: Math.atan2(local.y - cy, local.x - cx),
        origRot: field.rotation || 0, historySaved: false,
      }
    } else if (handle) {
      interactionRef.current = {
        mode: 'resize', pointerId: event.pointerId, key: field.fieldKey, handle,
        orig: { ...field }, startLocal: local, historySaved: false,
      }
    } else {
      return false
    }
    setHoverCursor(cursorForHandle(handle))
    event.currentTarget.setPointerCapture(event.pointerId)
    return true
  }

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

    // Handles sit above the field texture, so test the active selection first.
    // This makes corner/edge handles draggable even where they extend outside it.
    if (selectedKeys.length === 1) {
      const selectedField = store.fields.find((f) => f.fieldKey === selectedKeys[0])
      const selectedHandle = selectedField && !selectedField.locked
        ? hitTestHandle(local.x, local.y, selectedField, 10 / store.zoom)
        : null
      if (startTransform(selectedHandle, selectedField, local, e)) return
    }

    const hitKey = sm.hitTest(e.clientX, e.clientY)
    const primaryField = hitKey ? store.fields.find((f) => f.fieldKey === hitKey) : null

    if (primaryField && !primaryField.locked) {
      const handle = selectedKeys.includes(hitKey)
        ? hitTestHandle(local.x, local.y, primaryField, 10 / store.zoom)
        : null

      if (startTransform(handle, primaryField, local, e)) return

      if (e.shiftKey) {
        const set = new Set(selectedKeys)
        if (set.has(hitKey)) set.delete(hitKey)
        else set.add(hitKey)
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
    if (!inter || inter.pointerId !== e.pointerId) {
      const selectedField = store.selectedKeys.length === 1
        ? store.fields.find((f) => f.fieldKey === store.selectedKeys[0])
        : null
      const handle = selectedField && !selectedField.locked
        ? hitTestHandle(local.x, local.y, selectedField, 10 / store.zoom)
        : null
      setHoverCursor(cursorForHandle(handle))
      return
    }

    if (inter.mode === 'pan') {
      const dx = e.clientX - inter.x
      const dy = e.clientY - inter.y
      store.setView({ panX: inter.panX - dx, panY: inter.panY + dy })
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
    setHoverCursor('default')
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 0.92 : 1.08
      const s = useLabelStore.getState()
      s.setView({ zoom: Math.min(8, Math.max(0.15, s.zoom * factor)) })
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [])

  const onContextMenu = (e) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const cursorClass = isPanning || spaceRef.current || activeTool === 'pan'
    ? isPanning ? 'cursor-grabbing' : 'cursor-grab'
    : hoverCursor === 'default' ? 'cursor-default' : ''

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className={`block h-full w-full select-none ${cursorClass}`}
        style={{
          ...(thermalPreview ? { filter: 'grayscale(1) contrast(1.4)' } : {}),
          cursor: isPanning || spaceRef.current || activeTool === 'pan' ? undefined : hoverCursor,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={() => { if (!interactionRef.current) setHoverCursor('default') }}
        onContextMenu={onContextMenu}
      />

      <AlignmentToolbar />

      {/* Marquee overlay */}
      {marquee && sceneRef.current && (() => {
        const sm = sceneRef.current
        const tl = labelLocalToCanvasPx(sm, marquee.x, marquee.y)
        const br = labelLocalToCanvasPx(sm, marquee.x + marquee.w, marquee.y + marquee.h)
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
          const p = labelLocalToCanvasPx(sm, g.pos, 0)
          return <div key={i} className="pointer-events-none absolute top-0 bottom-0 w-px bg-pink-500 opacity-80" style={{ left: p.x }} />
        }
        const p = labelLocalToCanvasPx(sm, 0, g.pos)
        return <div key={i} className="pointer-events-none absolute left-0 right-0 h-px bg-pink-500 opacity-80" style={{ top: p.y }} />
      })}

      {contextMenu && <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} />}
    </div>
  )
}
