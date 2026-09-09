import { ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function LayersPanel() {
  const fields = useLabelStore((s) => s.fields)
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const select = useLabelStore((s) => s.select)
  const reorderField = useLabelStore((s) => s.reorderField)

  const sorted = [...fields].sort(
    (a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0),
  )

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <h3 className="border-b border-[var(--lc-panel-border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--lc-muted)]">
        Layers
      </h3>
      <ul className="flex-1 overflow-y-auto p-1">
        {sorted.length === 0 && (
          <li className="px-2 py-4 text-center text-xs text-[var(--lc-muted)]">
            No elements yet — use the toolbar to add fields.
          </li>
        )}
        {sorted.map((f) => {
          const sel = selectedKeys.includes(f.fieldKey)
          return (
            <li
              key={f.fieldKey}
              className={`mb-0.5 flex cursor-pointer items-center gap-1 rounded px-2 py-1.5 text-xs ${
                sel ? 'bg-[var(--lc-accent)]/25 text-white' : 'hover:bg-white/5'
              }`}
              onClick={() => select([f.fieldKey])}
            >
              <Eye size={12} className="shrink-0 opacity-50" />
              <span className="min-w-0 flex-1 truncate">
                {f.label || f.fieldKey}
              </span>
              <span className="text-[10px] text-[var(--lc-muted)]">{f.type}</span>
              <button
                type="button"
                className="rounded p-0.5 hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation()
                  reorderField(f.fieldKey, 'up')
                }}
                title="Bring forward"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                className="rounded p-0.5 hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation()
                  reorderField(f.fieldKey, 'down')
                }}
                title="Send backward"
              >
                <ChevronDown size={12} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
