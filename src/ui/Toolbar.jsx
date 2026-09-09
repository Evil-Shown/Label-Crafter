import {
  MousePointer2,
  Hand,
  Type,
  Barcode,
  QrCode,
  Square,
  Minus,
  Image,
  Shapes,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

const TOOLS = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)' },
  { id: 'pan', icon: Hand, label: 'Pan (Space)' },
  { id: 'text', icon: Type, label: 'Text', action: 'addText' },
  { id: 'barcode', icon: Barcode, label: 'Barcode', action: 'addBarcode' },
  { id: 'qrcode', icon: QrCode, label: 'QR Code', action: 'addQr' },
  { id: 'rect', icon: Square, label: 'Rectangle', action: 'addRect' },
  { id: 'line', icon: Minus, label: 'Line', action: 'addLine' },
  { id: 'image', icon: Image, label: 'Image', action: 'addImage' },
  { id: 'dxf', icon: Shapes, label: 'Glass shape', action: 'addDxf' },
]

export default function Toolbar() {
  const activeTool = useLabelStore((s) => s.activeTool)
  const setTool = useLabelStore((s) => s.setTool)

  const onClick = (tool) => {
    if (tool.action) {
      useLabelStore.getState()[tool.action]()
      setTool('select')
    } else {
      setTool(tool.id)
    }
  }

  return (
    <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-[var(--lc-panel-border)] bg-[var(--lc-panel)] py-2">
      {TOOLS.map((tool) => {
        const Icon = tool.icon
        const active = activeTool === tool.id
        return (
          <button
            key={tool.id}
            type="button"
            title={tool.label}
            onClick={() => onClick(tool)}
            className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
              active
                ? 'bg-[var(--lc-accent)] text-white'
                : 'text-[var(--lc-muted)] hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon size={18} />
          </button>
        )
      })}
    </aside>
  )
}
