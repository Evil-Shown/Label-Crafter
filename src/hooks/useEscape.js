import { useEffect } from 'react'

/** Close the top-most dialog with Escape. Every overlay registers this. */
export function useEscape(active, onClose) {
  useEffect(() => {
    if (!active) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, onClose])
}