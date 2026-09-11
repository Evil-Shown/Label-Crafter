import { useEffect } from 'react'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

const ICONS = { success: CheckCircle, error: AlertCircle, info: Info }

export default function ToastContainer() {
  const toasts = useLabelStore((s) => s.toasts)
  const removeToast = useLabelStore((s) => s.removeToast)

  return (
    <div className="pointer-events-none fixed bottom-16 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info
        return (
          <ToastItem key={t.id} toast={t} Icon={Icon} onDone={() => removeToast(t.id)} />
        )
      })}
    </div>
  )
}

function ToastItem({ toast, Icon, onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, toast.duration ?? 3200)
    return () => clearTimeout(id)
  }, [onDone, toast.duration])

  return (
    <div
      className={`lc-toast lc-toast-${toast.type || 'info'} pointer-events-auto flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold shadow-lg backdrop-blur-sm`}
    >
      <Icon size={14} />
      {toast.message}
    </div>
  )
}

export function toast(message, type = 'info', duration = 3200) {
  useLabelStore.getState().addToast({ message, type, duration })
}
