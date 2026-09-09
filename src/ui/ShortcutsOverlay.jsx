import { X } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

const SHORTCUTS = [
  ['V', 'Select tool'], ['H', 'Hand / pan'], ['T', 'Add text'], ['B', 'Add barcode'],
  ['Q', 'Add QR'], ['R', 'Add rectangle'], ['L', 'Add line'],
  ['Ctrl+C / V / X', 'Copy / paste / cut'], ['Ctrl+D', 'Duplicate'], ['Ctrl+G', 'Group'],
  ['Ctrl+Shift+G', 'Ungroup'], ['Ctrl+Z / Y', 'Undo / redo'],
  ['Delete', 'Delete selection'], ['Arrow keys', 'Nudge 1px'], ['Shift+Arrow', 'Nudge 10px'],
  ['Ctrl+drag', 'Pan canvas'], ['Space+drag', 'Pan canvas'], ['?', 'This help'],
]

export default function ShortcutsOverlay() {
  const open = useLabelStore((s) => s.showShortcuts)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  if (!open) return null

  return (
    <div className="lc-modal-overlay">
      <div className="lc-modal !max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">Keyboard Shortcuts</h2>
          <button type="button" onClick={() => setPrintConfig({ showShortcuts: false })} className="lc-icon-btn">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {SHORTCUTS.map(([key, desc]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <kbd className="rounded border border-[var(--lc-panel-border)] bg-[var(--lc-input-bg)] px-1.5 py-0.5 font-mono text-[10px]">{key}</kbd>
              <span className="text-[var(--lc-text-muted)]">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
