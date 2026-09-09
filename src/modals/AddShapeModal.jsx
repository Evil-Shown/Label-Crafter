import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function AddShapeModal() {
  const isOpen = useLabelStore((s) => s.showAddShapeModal)
  const setModal = useLabelStore((s) => s.setModal)
  const addRectField = useLabelStore((s) => s.addRectField)

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
    addRectField({
      shapeType,
      label: shapeType === 'circle' ? 'Circle' : 'Rectangle',
      x: Number(posX) || 0,
      y: Number(posY) || 0,
      width: Number(width) || 80,
      height: Number(height) || 40,
      strokeColor: borderColor,
      strokeWidth: Number(borderThickness) || 1,
      fillEnabled: fillShape,
      fillColor: fillColor || '#000000',
    })
    setModal('showAddShapeModal', false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="flex w-full max-w-md flex-col rounded-xl border border-[var(--lc-panel-border)] bg-[var(--lc-panel)] p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--lc-text)]">Add Shape</h2>
          <button
            type="button"
            onClick={() => setModal('showAddShapeModal', false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--lc-text-muted)] hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
          {/* Shape Type */}
          <div>
            <label className="mb-1 block font-medium text-[var(--lc-text)]">Shape Type</label>
            <select
              value={shapeType}
              onChange={(e) => setShapeType(e.target.value)}
              className="lc-input w-full"
            >
              <option value="rect">Rectangle</option>
              <option value="circle">Circle</option>
            </select>
            <span className="mt-1 block text-xs text-[var(--lc-text-muted)]">
              Selected: {shapeType === 'circle' ? '⭕ Circle' : '▭ Rectangle'}
            </span>
          </div>

          {/* Position */}
          <div>
            <span className="mb-1 block font-medium text-[var(--lc-text)]">Position</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-[var(--lc-text-muted)]">X Position (px)</label>
                <input
                  type="number"
                  value={posX}
                  onChange={(e) => setPosX(Number(e.target.value))}
                  className="lc-input w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--lc-text-muted)]">Y Position (px)</label>
                <input
                  type="number"
                  value={posY}
                  onChange={(e) => setPosY(Number(e.target.value))}
                  className="lc-input w-full"
                />
              </div>
            </div>
          </div>

          {/* Size */}
          <div>
            <span className="mb-1 block font-medium text-[var(--lc-text)]">Size</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-[var(--lc-text-muted)]">Width (px)</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min={5}
                  className="lc-input w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--lc-text-muted)]">Height (px)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min={5}
                  className="lc-input w-full"
                />
              </div>
            </div>
          </div>

          {/* Border */}
          <div className="space-y-3">
            <span className="block font-medium text-[var(--lc-text)]">Border</span>
            <div>
              <label className="mb-1 block text-xs text-[var(--lc-text-muted)]">Border Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-[var(--lc-panel-border)] p-0.5"
                />
                <input
                  type="text"
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  className="lc-input flex-1 font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-[var(--lc-text-muted)]">Border Thickness (px)</label>
              <input
                type="number"
                value={borderThickness}
                onChange={(e) => setBorderThickness(Number(e.target.value))}
                min={0}
                className="lc-input w-full"
              />
            </div>
          </div>

          {/* Fill */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fillShape}
                onChange={(e) => setFillShape(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600"
              />
              <span className="font-medium text-[var(--lc-text)]">Fill Shape</span>
            </label>
            {fillShape && (
              <div className="flex items-center gap-2 pl-6">
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-[var(--lc-panel-border)] p-0.5"
                />
                <input
                  type="text"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="lc-input flex-1 font-mono uppercase text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setModal('showAddShapeModal', false)}
            className="lc-btn lc-btn-outline"
          >
            <X size={15} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="lc-btn lc-btn-primary"
          >
            <Plus size={15} />
            Add Shape
          </button>
        </div>
      </div>
    </div>
  )
}
