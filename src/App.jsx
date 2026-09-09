import { useEffect } from 'react'
import TopHeader from './ui/TopHeader'
import CanvasSubBar from './ui/CanvasSubBar'
import ComponentsSidebar from './ui/ComponentsSidebar'
import PropertiesPanel from './ui/PropertiesPanel'
import BottomFooter from './ui/BottomFooter'
import LabelCanvas from './canvas/LabelCanvas'
import NewTemplateModal from './modals/NewTemplateModal'
import AddShapeModal from './modals/AddShapeModal'
import { useLabelStore } from './store/labelStore'

export default function App() {
  const theme = useLabelStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--lc-bg)]">
      <TopHeader />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ComponentsSidebar />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CanvasSubBar />
          <div className="lc-canvas-wrap relative min-h-0 flex-1 overflow-hidden">
            <LabelCanvas />
          </div>
        </div>

        <PropertiesPanel />
      </div>

      <BottomFooter />

      <NewTemplateModal />
      <AddShapeModal />
    </div>
  )
}
