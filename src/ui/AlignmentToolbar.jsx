import {
  AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  ArrowLeftRight, ArrowUpDown,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

const BTNS = [
  { mode: 'left', icon: AlignLeft, title: 'Align left' },
  { mode: 'centerH', icon: AlignCenter, title: 'Align center' },
  { mode: 'right', icon: AlignRight, title: 'Align right' },
  { mode: 'top', icon: AlignStartVertical, title: 'Align top' },
  { mode: 'centerV', icon: AlignCenterVertical, title: 'Align middle' },
  { mode: 'bottom', icon: AlignEndVertical, title: 'Align bottom' },
]

export default function AlignmentToolbar() {
  const selectedKeys = useLabelStore((s) => s.selectedKeys)
  const alignSelected = useLabelStore((s) => s.alignSelected)
  const distributeSelected = useLabelStore((s) => s.distributeSelected)

  if (selectedKeys.length < 1) return null

  return (
    <div className="pointer-events-auto absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--panel)]/95 px-2 py-1.5 shadow-[var(--sh-md)] backdrop-blur-md">
      {BTNS.map(({ mode, icon: Icon, title }) => (
        <button
          key={mode}
          type="button"
          title={title}
          onClick={() => alignSelected(mode)}
          className="lc-icon-btn !h-7 !w-7 hover:!bg-[var(--pri-s)] hover:!text-[var(--pri)]"
        >
          <Icon size={14} />
        </button>
      ))}
      <div className="mx-1 h-4 w-px bg-[var(--line)]" />
      <button
        type="button"
        title="Distribute horizontally"
        onClick={() => distributeSelected('h')}
        className="lc-icon-btn !h-7 !w-7 hover:!bg-[var(--pri-s)] hover:!text-[var(--pri)]"
      >
        <ArrowLeftRight size={14} />
      </button>
      <button
        type="button"
        title="Distribute vertically"
        onClick={() => distributeSelected('v')}
        className="lc-icon-btn !h-7 !w-7 hover:!bg-[var(--pri-s)] hover:!text-[var(--pri)]"
      >
        <ArrowUpDown size={14} />
      </button>
    </div>
  )
}
