import { useEffect } from 'react'
import TopHeader from './ui/TopHeader'
import CanvasSubBar from './ui/CanvasSubBar'
import ComponentsSidebar from './ui/ComponentsSidebar'
import PropertiesPanel from './ui/PropertiesPanel'
import BottomFooter from './ui/BottomFooter'
import LabelCanvas from './canvas/LabelCanvas'
import NewTemplateModal from './modals/NewTemplateModal'
import AddShapeModal from './modals/AddShapeModal'
import ToastContainer from './ui/Toast'
import ConfirmationDialog from './ui/ConfirmationDialog'
import ZplPreviewPanel from './ui/ZplPreviewPanel'
import ShortcutsOverlay from './ui/ShortcutsOverlay'
import TemplateGallery from './ui/TemplateGallery'
import SampleDataEditor from './ui/SampleDataEditor'
import BatchPreview from './ui/BatchPreview'
import ImportTemplateModal from './modals/ImportTemplateModal'
import ServerLibraryModal from './ui/ServerLibraryModal'
import Rulers from './ui/Rulers'
import { useLabelStore } from './store/labelStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export default function App() {
  const theme = useLabelStore((s) => s.theme)
  const applyDesignSession = useLabelStore((s) => s.applyDesignSession)
  const applyHostTemplate = useLabelStore((s) => s.applyHostTemplate)
  const addToast = useLabelStore((s) => s.addToast)
  useKeyboardShortcuts()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session')
    if (!sessionId) return
    const service = params.get('service') || undefined
    applyDesignSession(sessionId, service).catch((err) => {
      addToast({ message: err.message || 'Could not open design session', type: 'error' })
    })
  }, [applyDesignSession, addToast])

  useEffect(() => {
    const onMessage = (event) => {
      const data = event.data
      if (!data || data.type !== 'spil-label-open-template') return
      applyHostTemplate(data)
    }
    window.addEventListener('message', onMessage)
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'spil-label-request-template' }, '*')
    }
    return () => window.removeEventListener('message', onMessage)
  }, [applyHostTemplate])

  return (
    <div className="lc-app-shell relative flex h-full w-full flex-col overflow-hidden bg-[var(--lc-bg)]">
      <TopHeader />

      <div className="lc-workspace flex min-h-0 flex-1 overflow-hidden">
        <ComponentsSidebar />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CanvasSubBar />
          <div className="lc-canvas-wrap relative min-h-0 flex-1 overflow-hidden">
            <Rulers>
              <LabelCanvas />
            </Rulers>
          </div>
          <ZplPreviewPanel />
        </div>

        <PropertiesPanel />
      </div>

      <BottomFooter />

      <NewTemplateModal />
      <AddShapeModal />
      <TemplateGallery />
      <SampleDataEditor />
      <BatchPreview />
      <ImportTemplateModal />
      <ServerLibraryModal />
      <ShortcutsOverlay />
      <ToastContainer />
      <ConfirmationDialog />
    </div>
  )
}
