import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { SceneManager } from './SceneManager'
import { buildFieldCanvas } from './fieldTextures'
import { useLabelStore } from '../store/labelStore'
import { mmToPx, snapPx } from '../utils/units'

// Clean up group
function clearGroup(group) {
  while (group.children.length) {
    const c = group.children[0]
    group.remove(c)
    c.geometry?.dispose()
    c.material?.dispose()
  }
}

// Background Grid
function buildGrid(gridGroup, labelW, labelH, gridMm, showGrid, isDark) {
  clearGroup(gridGroup)
  if (!showGrid) return
  const step = mmToPx(gridMm * 2) // 2mm grid steps
  const lines = []
  for (let x = 0; x <= labelW; x += step) {
    lines.push(x, 0, 0.5, x, -labelH, 0.5)
  }
  for (let y = 0; y <= labelH; y += step) {
    lines.push(0, -y, 0.5, labelW, -y, 0.5)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3))
  const mat = new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({
      color: isDark ? 0x334155 : 0xe2e8f0,
      transparent: true,
      opacity: 0.8,
    }),
  )
  gridGroup.add(mat)
}

// Paper Canvas & Outer Green Handles matching Screenshot 2
function buildPaper(contentGroup, overlayGroup, labelW, labelH, isDark) {
  let paper = contentGroup.getObjectByName('__paper__')
  if (!paper) {
    const geo = new THREE.PlaneGeometry(1, 1)
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    paper = new THREE.Mesh(geo, mat)
    paper.name = '__paper__'
    contentGroup.add(paper)
  }
  paper.scale.set(labelW, labelH, 1)
  paper.position.set(labelW / 2, -labelH / 2, -1)
  paper.material.color.set(isDark ? 0x0f172a : 0xffffff)

  // Outer paper border
  let paperBorder = overlayGroup.getObjectByName('__paper_border__')
  if (paperBorder) {
    overlayGroup.remove(paperBorder)
    paperBorder.geometry?.dispose()
  }
  const borderGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(labelW, labelH))
  paperBorder = new THREE.LineSegments(
    borderGeo,
    new THREE.LineBasicMaterial({ color: isDark ? 0x475569 : 0x94a3b8, depthTest: false }),
  )
  paperBorder.name = '__paper_border__'
  paperBorder.position.set(labelW / 2, -labelH / 2, 0.6)
  overlayGroup.add(paperBorder)

  // 8 Outer Green Rounded Handles matching Screenshot 2
  const handleRadius = 4
  const outerCoords = [
    [0, 0], // Top Left
    [labelW / 2, 0], // Top Mid
    [labelW, 0], // Top Right
    [labelW, -labelH / 2], // Mid Right
    [labelW, -labelH], // Bottom Right
    [labelW / 2, -labelH], // Bottom Mid
    [0, -labelH], // Bottom Left
    [0, -labelH / 2], // Mid Left
  ]

  outerCoords.forEach(([hx, hy]) => {
    const dotGeo = new THREE.CircleGeometry(handleRadius, 16)
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      depthTest: false,
    })
    const dot = new THREE.Mesh(dotGeo, dotMat)
    dot.position.set(hx, hy, 1)
    overlayGroup.add(dot)

    // Handle white ring
    const ringGeo = new THREE.RingGeometry(handleRadius - 0.7, handleRadius, 16)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthTest: false,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.set(hx, hy, 1.1)
    overlayGroup.add(ring)
  })
}

// Inner Printable Margin Dashed Box matching Screenshot 2
function buildMargins(overlayGroup, labelW, labelH, margins) {
  const padL = mmToPx(margins?.left ?? 0)
  const padR = mmToPx(margins?.right ?? 0)
  const padT = mmToPx(margins?.top ?? 0)
  const padB = mmToPx(margins?.bottom ?? 0)

  const innerW = Math.max(1, labelW - padL - padR)
  const innerH = Math.max(1, labelH - padT - padB)

  const marginGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(innerW, innerH))
  const marginMat = new THREE.LineDashedMaterial({
    color: 0x0f172a,
    dashSize: 4,
    gapSize: 3,
    depthTest: false,
  })
  const marginLine = new THREE.LineSegments(marginGeo, marginMat)
  marginLine.computeLineDistances()
  marginLine.position.set(padL + innerW / 2, -(padT + innerH / 2), 1.2)
  overlayGroup.add(marginLine)
}

// 8 Resize Handles on selected element
function buildSelectedHandles(overlayGroup, f) {
  const x = f.x
  const y = f.y
  const w = f.width
  const h = f.height
  const cx = x + w / 2
  const cy = -(y + h / 2)

  // Selection light blue tint
  const fillGeo = new THREE.PlaneGeometry(w, h)
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0x2563eb,
    transparent: true,
    opacity: 0.1,
    depthTest: false,
  })
  const fill = new THREE.Mesh(fillGeo, fillMat)
  fill.position.set(cx, cy, 2)
  overlayGroup.add(fill)

  // Dashed or solid selection outline
  const outlineGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h))
  const outlineMat = new THREE.LineBasicMaterial({
    color: 0x2563eb,
    depthTest: false,
  })
  const outline = new THREE.LineSegments(outlineGeo, outlineMat)
  outline.position.set(cx, cy, 2.1)
  overlayGroup.add(outline)

  // 8 Blue Handles (matching Screenshot 3 / 4)
  const handleSize = 5
  const coords = [
    [x, -y], // Top Left
    [x + w / 2, -y], // Top Mid
    [x + w, -y], // Top Right
    [x + w, -(y + h / 2)], // Mid Right
    [x + w, -(y + h)], // Bottom Right
    [x + w / 2, -(y + h)], // Bottom Mid
    [x, -(y + h)], // Bottom Left
    [x, -(y + h / 2)], // Mid Left
  ]

  coords.forEach(([hx, hy]) => {
    const hGeo = new THREE.PlaneGeometry(handleSize, handleSize)
    const hMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      depthTest: false,
    })
    const handleMesh = new THREE.Mesh(hGeo, hMat)
    handleMesh.position.set(hx, hy, 3)
    overlayGroup.add(handleMesh)

    // Inner white square
    const inGeo = new THREE.PlaneGeometry(handleSize - 2, handleSize - 2)
    const inMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthTest: false,
    })
    const inMesh = new THREE.Mesh(inGeo, inMat)
    inMesh.position.set(hx, hy, 3.1)
    overlayGroup.add(inMesh)
  })
}

export default function LabelCanvas() {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const dragRef = useRef(null)
  const panRef = useRef(null)
  const spaceRef = useRef(false)

  const fields = useLabelStore((s) => s.fields)
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const width = useLabelStore((s) => s.width)
  const height = useLabelStore((s) => s.height)
  const margins = useLabelStore((s) => s.margins)
  const globalStyles = useLabelStore((s) => s.globalStyles)
  const labelData = useLabelStore((s) => s.labelData)
  const zoom = useLabelStore((s) => s.zoom)
  const panX = useLabelStore((s) => s.panX)
  const panY = useLabelStore((s) => s.panY)
  const showGrid = useLabelStore((s) => s.showGrid)
  const gridMm = useLabelStore((s) => s.gridMm)
  const snapToGrid = useLabelStore((s) => s.snapToGrid)
  const activeTool = useLabelStore((s) => s.activeTool)
  const theme = useLabelStore((s) => s.theme)

  const isDark = theme === 'dark'
  const labelW = mmToPx(width)
  const labelH = mmToPx(height)

  const syncMeshes = useCallback(async () => {
    const sm = sceneRef.current
    if (!sm) return
    sm.updateBackground(isDark)
    sm.clearMeshes()

    const sorted = [...fields].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
    for (const field of sorted) {
      const tex = await buildFieldCanvas(field, labelData, globalStyles)
      const w = Math.max(1, field.width)
      const h = Math.max(1, field.height)
      const geo = new THREE.PlaneGeometry(w, h)
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(field.x + w / 2, -(field.y + h / 2), 0)
      if (field.rotation) {
        mesh.rotation.z = (-field.rotation * Math.PI) / 180
      }
      mesh.userData.zIndex = field.zIndex ?? 0
      sm.registerMesh(field.fieldKey, mesh)
    }

    buildGrid(sm.gridGroup, labelW, labelH, gridMm, showGrid, isDark)
    clearGroup(sm.overlayGroup)
    buildPaper(sm.contentGroup, sm.overlayGroup, labelW, labelH, isDark)
    buildMargins(sm.overlayGroup, labelW, labelH, margins)

    for (const key of selectedKeys) {
      const f = fields.find((x) => x.fieldKey === key)
      if (f) buildSelectedHandles(sm.overlayGroup, f)
    }

    sm.setTransform(zoom, panX, panY)
    sm.render()
  }, [
    fields,
    labelData,
    globalStyles,
    selectedKeys,
    labelW,
    labelH,
    margins,
    gridMm,
    showGrid,
    zoom,
    panX,
    panY,
    isDark,
  ])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const sm = new SceneManager(canvas)
    sceneRef.current = sm

    const ro = new ResizeObserver(() => {
      sm.resize()
      sm.render()
    })
    ro.observe(canvas.parentElement)

    return () => {
      ro.disconnect()
      sm.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    syncMeshes()
  }, [syncMeshes])

  useEffect(() => {
    const sm = sceneRef.current
    if (sm) {
      sm.setTransform(zoom, panX, panY)
      sm.render()
    }
  }, [zoom, panX, panY])

  const onPointerDown = (e) => {
    const sm = sceneRef.current
    if (!sm) return
    const store = useLabelStore.getState()

    if (e.button === 1 || spaceRef.current || activeTool === 'pan') {
      panRef.current = { x: e.clientX, y: e.clientY, panX, panY }
      return
    }

    const key = sm.hitTest(e.clientX, e.clientY)
    if (key) {
      if (e.shiftKey) {
        const set = new Set(selectedKeys)
        if (set.has(key)) set.delete(key)
        else set.add(key)
        store.select([...set])
      } else if (!selectedKeys.includes(key)) {
        store.select([key])
      }
      dragRef.current = {
        key,
        startX: e.clientX,
        startY: e.clientY,
        orig: store.fields.find((f) => f.fieldKey === key),
        historySaved: false,
      }
    } else {
      store.clearSelection()
    }
  }

  const onPointerMove = (e) => {
    const sm = sceneRef.current
    if (!sm) return

    if (panRef.current) {
      const dx = e.clientX - panRef.current.x
      const dy = e.clientY - panRef.current.y
      const scale = zoom
      useLabelStore.getState().setView({
        panX: panRef.current.panX + dx / scale,
        panY: panRef.current.panY - dy / scale,
      })
      return
    }

    if (!dragRef.current) return
    if (!dragRef.current.historySaved) {
      useLabelStore.getState().pushHistory()
      dragRef.current.historySaved = true
    }
    const world0 = sm.screenToWorld(dragRef.current.startX, dragRef.current.startY)
    const world1 = sm.screenToWorld(e.clientX, e.clientY)
    let dx = (world1.x - world0.x) / zoom
    let dy = -(world1.y - world0.y) / zoom
    const orig = dragRef.current.orig
    if (!orig) return
    let nx = orig.x + dx
    let ny = orig.y + dy
    if (snapToGrid) {
      nx = snapPx(nx, gridMm)
      ny = snapPx(ny, gridMm)
    }
    useLabelStore.getState().updateFieldLive(dragRef.current.key, { x: nx, y: ny })
  }

  const onPointerUp = () => {
    dragRef.current = null
    panRef.current = null
  }

  const onWheel = (e) => {
    e.preventDefault()
    const store = useLabelStore.getState()
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    const nz = Math.min(8, Math.max(0.15, store.zoom * factor))
    store.setView({ zoom: nz })
  }

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full cursor-crosshair select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
    />
  )
}
