import { useEffect } from 'react'
import { useLabelStore } from '../store/labelStore'

function isTyping(el) {
  const tag = el?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTyping(e.target)) return
      const store = useLabelStore.getState()
      const mod = e.ctrlKey || e.metaKey

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        store.setPrintConfig({ showShortcuts: !store.showShortcuts })
        return
      }

      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); store.undo(); return }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); store.redo(); return }
      if (mod && e.key === 'c') { e.preventDefault(); store.copySelected(); return }
      if (mod && e.key === 'v') { e.preventDefault(); store.pasteClipboard(); return }
      if (mod && e.key === 'x') { e.preventDefault(); store.cutSelected(); return }
      if (mod && e.key === 'd') { e.preventDefault(); store.duplicateSelected(); return }
      if (mod && e.key === 'g' && !e.shiftKey) { e.preventDefault(); store.groupSelected(); return }
      if (mod && e.key === 'g' && e.shiftKey) { e.preventDefault(); store.ungroupSelected(); return }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedKeys.length) { e.preventDefault(); store.deleteSelected() }
        return
      }

      const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      if (arrows.includes(e.key) && store.selectedKeys.length) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        store.nudgeSelected(dx, dy)
        return
      }

      if (!mod) {
        const tools = { v: 'select', h: 'pan', t: () => store.addTextField(), b: () => store.addBarcodeField(), q: () => store.addQrField(), r: () => store.addRectField(), l: () => store.addLineField() }
        const k = e.key.toLowerCase()
        if (k in tools) {
          const action = tools[k]
          if (typeof action === 'string') store.setTool(action)
          else action()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
