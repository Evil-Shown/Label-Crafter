import { useState } from 'react'
import { X, Plus, Shapes } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function AddShapeModal() {
  const isOpen = useLabelStore((s) => s.showAddShapeModal)
  const setModal = useLabelStore((s) => s.setModal)
  const addRectField = useLabelStore((s) => s.addRectField)
  const addRoundedRectField = useLabelStore((s) => s.addRoundedRectField)
  const addEllipseField = useLabelStore((s) => s.addEllipseField)

  const [shapeType, setShapeType] = useState('rect')
  const [posX, setPosX] = useState(50)
  const [posY, setPosY] = useState(50)
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(60)
  const [borderColor, setBorderColor] = useState('#000000')
  const [borderThickness, setBorderThickness] = useState(2)
  const [fillShape, setFillShape] = useState(false)
  const [fillColor, setFillColor] = useState('#e2e8f0')

  if (!isOpen) return null

  const handleAdd = () => {
    const base = {
      shapeType,
      label: shapeType === 'circle' ? 'Circle' : shapeType === 'roundRect' ? 'Rounded Rect' : shapeType === 'ellipse' ? 'Ellipse' : 'Rectangle',
      x: Number(posX) || 0,
      y: Number(posY) || 0,
      width: Number(width) || 80,
      height: Number(height) || 40,
      strokeColor: borderColor,
      strokeWidth: Number(borderThickness) || 1,
      fillEnabled: fillShape,
      fillColor,
      cornerRadius: shapeType === 'roundRect' ? 8 : 0,
    }
    if (shapeType === 'roundRect') addRoundedRectField(base)
    else if (shapeType === 'ellipse' || shapeType === 'circle') addEllipseField({ ...base, shapeType: shapeType === 'circle' ? 'ellipse' : 'ellipse' })
    else addRectField(base)
    setModal('showAddShapeModal', false)
  }

  return (
    <div className="lc-modal-overlay">
      <div className="lc-modal !max-w-md">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--lc-accent-soft)]">
              <Shapes size={18} className="text-[var(--lc-accent)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--lc-text)]">Add Shape</h2>
              <p className="text-xs text-[var(--lc-text-muted)]">Rectangle or circle</p>
            </div>
          </div>
          <button type="button" onClick={() => setModal('showAddShapeModal', false)} className="lc-icon-btn">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div>
            <label className="mb-1.5 block text-xs font-semibold">Shape Type</label>
            <select value={shapeType} onChange={(e) => setShapeType(e.target.value)} className="lc-input w-full">
              <option value="rect">Rectangle</option>
              <option value="roundRect">Rounded rectangle</option>
              <option value="ellipse">Ellipse / oval</option>
              <option value="circle">Circle</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[var(--lc-text-muted)]">X (px)</label>
              <input type="number" value={posX} onChange={(e) => setPosX(Number(e.target.value))} className="lc-input w-full" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[var(--lc-text-muted)]">Y (px)</label>
              <input type="number" value={posY} onChange={(e) => setPosY(Number(e.target.value))} className="lc-input w-full" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[var(--lc-text-muted)]">Width (px)</label>
              <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} min={5} className="lc-input w-full" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[var(--lc-text-muted)]">Height (px)</label>
              <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} min={5} className="lc-input w-full" />
            </div>
          </div>

          <div className="lc-prop-group space-y-3">
            <p className="text-xs font-semibold text-[var(--lc-text)]">Border</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-[var(--lc-panel-border)]"
              />
              <input
                type="text"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="lc-input flex-1 font-mono text-xs uppercase"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[var(--lc-text-muted)]">Thickness (px)</label>
              <input type="number" value={borderThickness} onChange={(e) => setBorderThickness(Number(e.target.value))} min={0} className="lc-input w-full" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input type="checkbox" checked={fillShape} onChange={(e) => setFillShape(e.target.checked)} className="rounded" />
            Fill shape
          </label>
          {fillShape && (
            <div className="flex items-center gap-2 pl-5">
              <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="h-8 w-10 rounded-md border border-[var(--lc-panel-border)]" />
              <input type="text" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="lc-input flex-1 font-mono text-xs uppercase" />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => setModal('showAddShapeModal', false)} className="lc-btn lc-btn-outline !text-xs">
            Cancel
          </button>
          <button type="button" onClick={handleAdd} className="lc-btn lc-btn-primary !text-xs">
            <Plus size={14} />
            Add Shape
          </button>
        </div>
      </div>
    </div>
  )
}
