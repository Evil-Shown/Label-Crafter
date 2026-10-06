import { useState } from 'react'
import {
  Tag,
  Check,
  ArrowRight,
  ArrowLeft,
  Database,
  Printer,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import appIcon from '../assets/app_icon.png'

export default function FirstRunWizardModal() {
  const isOpen = useLabelStore((s) => s.firstTimeSetupOpen)
  const [step, setStep] = useState(1) // 1: Database, 2: Print service, 3: Done
  const [server, setServer] = useState('SPIL-SQL01')
  const [port, setPort] = useState(1433)
  const [dbName, setDbName] = useState('SpilProduction')
  const [authType, setAuthType] = useState('windows')
  const [printUrl, setPrintUrl] = useState('http://localhost:5088')
  const [testedDb, setTestedDb] = useState(true)
  const [testedService, setTestedService] = useState(true)

  if (!isOpen) return null

  const handleFinish = () => {
    useLabelStore.setState({ firstTimeSetupOpen: false })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#061122] via-[#0B1E38] to-[#122E54] p-6 select-none">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl bg-transparent">
        {/* Left Hero Welcome */}
        <div className="flex w-5/12 flex-col justify-center p-8 text-white">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20">
            <img src={appIcon} alt="App Icon" className="h-full w-full object-cover scale-105" />
          </div>

          <h1 className="text-3xl font-black leading-tight tracking-tight">
            Welcome to<br />Label Designer
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-slate-300">
            Connect once to the shared database. Opti and ERP templates will be ready in under a minute.
          </p>

          <div className="mt-8 space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Templates shared by Opti and ERP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Password kept in Windows Credential Manager</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Change any time in Settings</span>
            </div>
          </div>
        </div>

        {/* Right Step Card */}
        <div className="flex w-7/12 flex-col rounded-3xl bg-white p-8 text-slate-900 shadow-2xl">
          {/* Step Breadcrumbs */}
          <div className="mb-6 flex items-center gap-6 border-b border-slate-100 pb-4 text-xs font-semibold text-slate-400">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : ''}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                1
              </span>
              <span>Database</span>
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : ''}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                2
              </span>
              <span>Print service</span>
            </div>
            <div className={`flex items-center gap-2 ${step === 3 ? 'text-blue-600' : ''}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                3
              </span>
              <span>Done</span>
            </div>
          </div>

          {/* Step 1: Database (screen 9.2 / setup1.png) */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Connect to the database</h2>
                <p className="text-xs text-slate-500">Ask IT for the server name if you don't know it.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600">Server</label>
                  <input
                    type="text"
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Database</label>
                <input
                  type="text"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Sign in with</label>
                <div className="mt-1 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setAuthType('windows')}
                    className={`rounded-md py-1.5 text-xs font-semibold ${authType === 'windows' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                  >
                    Windows account
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthType('sql')}
                    className={`rounded-md py-1.5 text-xs font-semibold ${authType === 'sql' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                  >
                    SQL user & password
                  </button>
                </div>
              </div>

              {testedDb && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <Check size={15} className="text-emerald-600" />
                  <span>Connected in 18 ms · found <strong>12 Opti</strong> and <strong>4 ERP</strong> templates</span>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setTestedDb(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Zap size={13} />
                  <span>Test connection</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  <span>Continue</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Print service (screen 9.3 / setup2.png) */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Connect the print service</h2>
                <p className="text-xs text-slate-500">The service that sends labels to the printers. Usually on this PC.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Print service address</label>
                <input
                  type="text"
                  value={printUrl}
                  onChange={(e) => setPrintUrl(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {testedService && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <Check size={15} className="text-emerald-600" />
                  <span>Print service running · Zebra, TSC, Datamax supported</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Default printer</label>
                  <select className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-900 focus:outline-none">
                    <option>Zebra · ZPL</option>
                    <option>TSC · TSPL</option>
                    <option>Datamax · DPL</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Resolution</label>
                  <select className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-900 focus:outline-none">
                    <option>300 DPI</option>
                    <option>203 DPI</option>
                    <option>600 DPI</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTestedService(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Zap size={13} />
                    <span>Test connection</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                  >
                    <span>Get started</span>
                    <Sparkles size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
