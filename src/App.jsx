import { useEffect, useMemo } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { getMuiTheme } from './theme/muiTheme'
import TopHeader from './ui/TopHeader'
import CanvasSubBar from './ui/CanvasSubBar'
import ComponentsSidebar from './ui/ComponentsSidebar'
import PropertiesPanel from './ui/PropertiesPanel'
import BottomFooter from './ui/BottomFooter'
import CanvasDataBanner from './ui/CanvasDataBanner'
import LabelCanvas from './canvas/LabelCanvas'
import ZplPreviewPanel from './ui/ZplPreviewPanel'

// Views
import TemplateLibraryView from './views/TemplateLibraryView'
import SettingsView from './views/SettingsView'
import OptiLabelsSettingsView from './views/OptiLabelsSettingsView'

// Modals
import NewTemplateModal from './modals/NewTemplateModal'
import AddShapeModal from './modals/AddShapeModal'
import LoadRealDataModal from './modals/LoadRealDataModal'
import OifTemplateWizardModal from './modals/OifTemplateWizardModal'
import ExportDialog from './modals/ExportDialog'
import FieldPickerModal from './modals/FieldPickerModal'
import FirstRunWizardModal from './modals/FirstRunWizardModal'
import ShortcutsOverlay from './ui/ShortcutsOverlay'
import BatchPreview from './ui/BatchPreview'
import ServerLibraryModal from './ui/ServerLibraryModal'
import ToastContainer from './ui/Toast'
import ConfirmationDialog from './ui/ConfirmationDialog'
import StartupSplashScreen from './ui/StartupSplashScreen'

import { useLabelStore } from './store/labelStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export default function App() {
  const showSplashScreen = useLabelStore((s) => s.showSplashScreen)
  const theme = useLabelStore((s) => s.theme)
  const activeTab = useLabelStore((s) => s.activeTab)
  const muiTheme = useMemo(() => getMuiTheme(theme), [theme])
  const applyDesignSession = useLabelStore((s) => s.applyDesignSession)
  const applyHostTemplate = useLabelStore((s) => s.applyHostTemplate)
  const addToast = useLabelStore((s) => s.addToast)
  const checkServiceHealth = useLabelStore((s) => s.checkServiceHealth)
  const tickRetryCountdown = useLabelStore((s) => s.tickRetryCountdown)

  useKeyboardShortcuts()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Spec §8.1/§8.2: health check every 15 s; countdown drives the auto-retry.
  useEffect(() => {
    const health = setInterval(() => checkServiceHealth(), 15000)
    const countdown = setInterval(() => tickRetryCountdown(), 1000)
    return () => {
      clearInterval(health)
      clearInterval(countdown)
    }
  }, [checkServiceHealth, tickRetryCountdown])

  // Warn before closing with unsaved work while the database is offline (§8.2).
  useEffect(() => {
    const onBeforeUnload = (e) => {
      const s = useLabelStore.getState()
      if (s.dbStatus !== 'connected') {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
      return undefined
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // `?view=opti` opens the Opti-side default template picker (screen 10.1).
    // Opti never gets the designer — it only lists and picks a default.
    const view = params.get('view')
    if (view === 'opti' || view === 'templates' || view === 'settings' || view === 'design') {
      useLabelStore.getState().setActiveTab(view)
    }
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
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: 'spil-label-template-received', templateId: data.template?.id || null },
          '*',
        )
      }
    }
    window.addEventListener('message', onMessage)
    if (window.parent && window.parent !== window) {
      const requestTemplate = () => {
        window.parent.postMessage({ type: 'spil-label-request-template' }, '*')
      }
      requestTemplate()
      const retry100 = window.setTimeout(requestTemplate, 100)
      const retry500 = window.setTimeout(requestTemplate, 500)
      return () => {
        window.removeEventListener('message', onMessage)
        window.clearTimeout(retry100)
        window.clearTimeout(retry500)
      }
    }
    return () => window.removeEventListener('message', onMessage)
  }, [applyHostTemplate])

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div className="lc-app-shell relative flex h-full w-full flex-col overflow-hidden font-sans">
        {/* 1-5: Top header — title, tabs, Opti/ERP switch, status dots, Export, Save */}
        <TopHeader />

        {activeTab === 'design' && (
          <>
            <div className="flex min-h-0 flex-1 overflow-hidden">
              {/* 6-8: Add element, fields, layers */}
              <ComponentsSidebar />

              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* 9: Canvas toolbar */}
                <CanvasSubBar />
                {/* 10: Data and status banners */}
                <CanvasDataBanner />

                <div className="lc-canvas-wrap relative min-h-0 flex-1 overflow-hidden">
                  <LabelCanvas />
                </div>

                {/* 6.1 / 6.2: docked printer code */}
                <ZplPreviewPanel />
              </div>

              {/* 11: Properties */}
              <PropertiesPanel />
            </div>

            {/* 12: Status bar */}
            <BottomFooter />
          </>
        )}

        {activeTab === 'templates' && <TemplateLibraryView />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'opti' && <OptiLabelsSettingsView />}

        <NewTemplateModal />
        <AddShapeModal />
        <LoadRealDataModal />
        <OifTemplateWizardModal />
        <ExportDialog />
        <FieldPickerModal />
        <FirstRunWizardModal />
        <ShortcutsOverlay />
        <BatchPreview />
        <ServerLibraryModal />
        <ToastContainer />
        <ConfirmationDialog />

        {/* Windows App Startup Opening Animation Window */}
        {showSplashScreen && (
          <StartupSplashScreen onComplete={() => useLabelStore.setState({ showSplashScreen: false })} />
        )}
      </div>
    </ThemeProvider>
  )
}
