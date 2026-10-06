import { useState } from 'react'
import {
  Database,
  ArrowRightLeft,
  Printer,
  Palette,
  Info,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'

export default function SettingsView() {
  const [activeNav, setActiveNav] = useState('database') // 'database' | 'erp' | 'printing' | 'appearance' | 'about'
  const [server, setServer] = useState('SPIL-SQL01')
  const [port, setPort] = useState(1433)
  const [dbName, setDbName] = useState('SpilProduction')
  const [authType, setAuthType] = useState('windows') // 'windows' | 'sql'
  const [erpDbMode, setErpDbMode] = useState('same') // 'same' | 'different'

  const printServiceUrl = useLabelStore((s) => s.printServiceUrl)
  const printerBrand = useLabelStore((s) => s.printerBrand)
  const printerDpi = useLabelStore((s) => s.printerDpi)
  const theme = useLabelStore((s) => s.theme)
  const toggleTheme = useLabelStore((s) => s.toggleTheme)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const recentActivity = useLabelStore((s) => s.recentActivity)
  const addToast = useLabelStore((s) => s.addToast)

  const handleTestConnection = () => {
    addToast({ message: 'Connected in 18 ms · found 12 Opti and 4 ERP templates', type: 'success' })
  }

  const handleSaveChanges = () => {
    addToast({ message: 'Settings saved successfully', type: 'success' })
  }

  return (
    <div className="flex h-full flex-1 overflow-hidden bg-[var(--bg)] text-[var(--tx)] select-none">
      {/* Side Navigation */}
      <aside className="w-56 shrink-0 border-r border-[var(--line)] bg-[var(--panel)] p-4">
        <h2 className="mb-4 px-2 text-xs font-bold uppercase tracking-wider text-[var(--mut)]">
          Settings
        </h2>
        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => setActiveNav('database')}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeNav === 'database'
                ? 'bg-blue-50 text-[var(--pri)] dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-[var(--mut)] hover:bg-[var(--line-subtle)] hover:text-[var(--tx)]'
            }`}
          >
            <Database size={15} />
            <span>Database</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveNav('erp')}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeNav === 'erp'
                ? 'bg-blue-50 text-[var(--pri)] dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-[var(--mut)] hover:bg-[var(--line-subtle)] hover:text-[var(--tx)]'
            }`}
          >
            <ArrowRightLeft size={15} />
            <span>Opti & ERP</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveNav('printing')}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeNav === 'printing'
                ? 'bg-blue-50 text-[var(--pri)] dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-[var(--mut)] hover:bg-[var(--line-subtle)] hover:text-[var(--tx)]'
            }`}
          >
            <Printer size={15} />
            <span>Printing</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveNav('appearance')}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeNav === 'appearance'
                ? 'bg-blue-50 text-[var(--pri)] dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-[var(--mut)] hover:bg-[var(--line-subtle)] hover:text-[var(--tx)]'
            }`}
          >
            <Palette size={15} />
            <span>Appearance</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveNav('about')}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeNav === 'about'
                ? 'bg-blue-50 text-[var(--pri)] dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-[var(--mut)] hover:bg-[var(--line-subtle)] hover:text-[var(--tx)]'
            }`}
          >
            <Info size={15} />
            <span>About</span>
          </button>
        </nav>
      </aside>

      {/* Main Settings Panel */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-[var(--tx)]">Database</h1>
          <p className="mt-1 text-xs text-[var(--mut)]">
            Where templates for Opti and ERP are stored.
          </p>
        </div>

        {/* 2-Column Cards Layout (screen 9.4 / settings.png) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card 1: Connection */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-[var(--pri)]" />
                <h3 className="font-bold text-sm text-[var(--tx)]">Connection</h3>
              </div>
              <span className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                ✓ Connected · 18 ms
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--mut)]">Server</label>
                  <input
                    type="text"
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--pri)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--mut)]">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="mt-1 h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--pri)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--mut)]">Database</label>
                <input
                  type="text"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--input-bg)] px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--pri)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--mut)]">Sign in with</label>
                <div className="mt-1 grid grid-cols-2 rounded-lg bg-[var(--bg)] p-1 border border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => setAuthType('windows')}
                    className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                      authType === 'windows'
                        ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs'
                        : 'text-[var(--mut)]'
                    }`}
                  >
                    Windows account
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthType('sql')}
                    className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                      authType === 'sql'
                        ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs'
                        : 'text-[var(--mut)]'
                    }`}
                  >
                    SQL user
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-xs font-semibold text-[var(--tx)] hover:bg-[var(--line-subtle)]"
                >
                  <Zap size={13} />
                  <span>Test</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="rounded-lg bg-[var(--pri)] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: ERP database */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--line)]">
              <ArrowRightLeft size={16} className="text-purple-600" />
              <h3 className="font-bold text-sm text-[var(--tx)]">ERP database</h3>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 rounded-lg bg-[var(--bg)] p-1 border border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setErpDbMode('same')}
                  className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                    erpDbMode === 'same'
                      ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs'
                      : 'text-[var(--mut)]'
                  }`}
                >
                  Same as Opti
                </button>
                <button
                  type="button"
                  onClick={() => setErpDbMode('different')}
                  className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                    erpDbMode === 'different'
                      ? 'bg-[var(--panel)] text-[var(--pri)] shadow-xs'
                      : 'text-[var(--mut)]'
                  }`}
                >
                  Use a different database
                </button>
              </div>

              <p className="text-xs text-[var(--mut)] leading-relaxed">
                Both clients share the table <code className="rounded bg-[var(--bg)] px-1 py-0.5 font-mono text-[11px] text-[var(--tx)]">SpilLabelTemplates</code>. Each template is tagged <span className="rounded bg-blue-100 px-1 py-0.5 text-[9px] font-bold text-blue-800">OPTI</span> or <span className="rounded bg-purple-100 px-1 py-0.5 text-[9px] font-bold text-purple-800">ERP</span>.
              </p>

              <div>
                <span className="block text-xs font-semibold text-[var(--mut)] mb-2">Templates found</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--bg)] p-3">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">OPTI</span>
                    <span className="font-bold text-base text-[var(--tx)]">12</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--bg)] p-3">
                    <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">ERP</span>
                    <span className="font-bold text-base text-[var(--tx)]">4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Recent Activity (audit log) */}
        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--line)]">
            <span className="text-base">🕒</span>
            <h3 className="font-bold text-sm text-[var(--tx)]">Recent activity</h3>
          </div>

          <div className="mt-3 divide-y divide-[var(--line)]">
            {recentActivity.map((act) => (
              <div key={act.id} className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-20 text-[var(--mut)]">{act.time}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      act.client === 'erp'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {act.client}
                  </span>
                  <span className="font-medium text-[var(--tx)]">{act.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
