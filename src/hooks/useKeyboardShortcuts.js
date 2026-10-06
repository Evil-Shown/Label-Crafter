import { useEffect } from 'react'
import { useLabelStore } from '../store/labelStore'
import { mmToPx } from '../utils/units'

function isTyping(el) {
  const tag = el?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable
}

/** A dialog is open — single-letter tools must not fire behind it. */
function isModalOpen(store) {
  return Boolean(
    store.showShortcuts ||
    store.showNewModal ||
    store.showAddShapeModal ||
    store.showLoadDataModal ||
    store.showExportDialog ||
    store.showFieldPicker ||
    store.showImportModal ||
    store.showServerLibrary ||
    store.showBatchPreview ||
    store.showSampleDataEditor ||
    store.firstTimeSetupOpen ||
    store.confirmDialog,
  )
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

      if (e.key === 'Escape') {
        // Dialogs handle their own Escape; nothing to do at app level.
        return
      }

      // Ctrl+S saves — spec §4.1.
      if (mod && e.key === 's') {
        e.preventDefault()
        if (store.dbStatus === 'connected') {
          if (store.designSession) store.saveToDesignService()
          else store.saveToLibrary()
        } else {
          store.addToast({
            message: 'Read-only: the database is offline, so saving is paused.',
            type: 'warning',
          })
        }
        return
      }

      // Ctrl+0 fits the label to the window — spec §9.1.
      if (mod && e.key === '0') {
        e.preventDefault()
        const wrap = document.querySelector('.lc-canvas-wrap')
        const rect = wrap?.getBoundingClientRect()
        if (rect) store.fitToScreen(rect.width, rect.height)
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

      // Nudge in millimetres (0.1 mm fine, 1 mm coarse) — spec §9.1.
      const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      if (arrows.includes(e.key) && store.selectedKeys.length) {
        e.preventDefault()
        const step = mmToPx(e.shiftKey ? 1 : 0.1)
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        store.nudgeSelected(dx, dy)
        return
      }

      if (!mod && !isModalOpen(store)) {
        const tools = {
          v: () => store.setTool('select'),
          h: () => store.setTool('pan'),
          t: () => store.addTextField(),
          b: () => store.addBarcodeField(),
          q: () => store.addQrField(),
          r: () => store.addRoundedRectField(),
          l: () => store.addLineField(),
          c: () => store.addCheckboxField(),
        }
        const k = e.key.toLowerCase()
        if (k in tools) {
          e.preventDefault()
          tools[k]()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}