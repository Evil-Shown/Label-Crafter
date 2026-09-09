import { Copy, Scissors, Clipboard, Trash2, CopyPlus, Layers, Ungroup } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function ContextMenu({ x, y, onClose }) {
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const copySelected = useLabelStore((s) => s.copySelected)
  const cutSelected = useLabelStore((s) => s.cutSelected)
  const pasteClipboard = useLabelStore((s) => s.pasteClipboard)
  const duplicateSelected = useLabelStore((s) => s.duplicateSelected)
  const deleteSelected = useLabelStore((s) => s.deleteSelected)
  const groupSelected = useLabelStore((s) => s.groupSelected)
  const ungroupSelected = useLabelStore((s) => s.ungroupSelected)

  const items = [
    { label: 'Copy', icon: Copy, action: copySelected, shortcut: 'Ctrl+C' },
    { label: 'Cut', icon: Scissors, action: cutSelected, shortcut: 'Ctrl+X' },
    { label: 'Paste', icon: Clipboard, action: pasteClipboard, shortcut: 'Ctrl+V' },
    { label: 'Duplicate', icon: CopyPlus, action: duplicateSelected, shortcut: 'Ctrl+D' },
    { label: 'Group', icon: Layers, action: groupSelected, shortcut: 'Ctrl+G', show: selectedKeys.length > 1 },
    { label: 'Ungroup', icon: Ungroup, action: ungroupSelected, shortcut: 'Ctrl+Shift+G' },
    { label: 'Delete', icon: Trash2, action: deleteSelected, shortcut: 'Del', danger: true },
  ]

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose() }} />
      <div
        className="fixed z-50 min-w-[180px] overflow-hidden rounded-lg border border-[var(--lc-panel-border)] bg-[var(--lc-panel)] py-1 shadow-xl"
        style={{ left: x, top: y }}
      >
        {items.filter((i) => i.show !== false).map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => { item.action(); onClose() }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-[var(--lc-accent-soft)] ${item.danger ? 'text-red-500' : 'text-[var(--lc-text)]'}`}
            >
              <Icon size={13} />
              <span className="flex-1">{item.label}</span>
              <span className="text-[10px] text-[var(--lc-text-muted)]">{item.shortcut}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
