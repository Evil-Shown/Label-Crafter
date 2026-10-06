import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Monitor,
  KeyRound,
  Zap,
  CircleCheck,
  Printer,
  Database,
  Tag,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { useEscape } from '../hooks/useEscape'
import BrandMark from '../ui/BrandMark'

const STEPS = [
  { n: 1, label: 'Database' },
  { n: 2, label: 'Print service' },
  { n: 3, label: 'Finish' },
]

const HERO_POINTS = [
  'Templates shared by Opti and ERP',
  'Password kept in Windows Credential Manager',
  'Change any time in Settings',
]

/**
 * Screen 9.2 / 9.3 — first-run setup. Shown only on a new PC or when no valid
 * connection exists (R3). Three steps, so the designer is designing in under a
 * minute.
 */
export default function FirstRunWizardModal() {
  const isOpen = useLabelStore((s) => s.firstTimeSetupOpen)
  const dbServer = useLabelStore((s) => s.dbServer)
  const dbPort = useLabelStore((s) => s.dbPort)
  const dbDatabase = useLabelStore((s) => s.dbDatabase)
  const dbAuthType = useLabelStore((s) => s.dbAuthType)
  const printServiceUrl = useLabelStore((s) => s.printServiceUrl)
  const printerBrand = useLabelStore((s) => s.printerBrand)
  const printerDpi = useLabelStore((s) => s.printerDpi)
  const setDbConfig = useLabelStore((s) => s.setDbConfig)
  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const runHealthCheck = useLabelStore((s) => s.checkServiceHealth)
  const setSetupDone = useLabelStore((s) => s.setSetupDone)

  const [step, setStep] = useState(1)
  const [server, setServer] = useState(dbServer)
  const [port, setPort] = useState(dbPort)
  const [dbName, setDbName] = useState(dbDatabase)
  const [authType, setAuthType] = useState(dbAuthType)
  const [printUrl, setPrintUrl] = useState(printServiceUrl)
  const [brand, setBrand] = useState(printerBrand)
  const [dpi, setDpi] = useState(printerDpi)
  const [dbOk, setDbOk] = useState(null)
  const [svcOk, setSvcOk] = useState(null)
  const [busy, setBusy] = useState(false)
  const [counts, setCounts] = useState({ opti: 0, erp: 0 })

  // Reset to step 1 whenever the wizard opens.
  useEffect(() => {
    if (!isOpen) return
    setStep(1)
    setServer(dbServer)
    setPort(dbPort)
    setDbName(dbDatabase)
    setAuthType(dbAuthType)
    setPrintUrl(printServiceUrl)
    setBrand(printerBrand)
    setDpi(printerDpi)
    setDbOk(null)
    setSvcOk(null)
    setBusy(false)
  }, [isOpen, dbServer, dbPort, dbDatabase, dbAuthType, printServiceUrl, printerBrand, printerDpi])

  const close = () => {
    if (typeof setSetupDone === 'function') setSetupDone(true)
    else useLabelStore.setState({ firstTimeSetupOpen: false })
  }
  useEscape(isOpen, close)

  if (!isOpen) return null

  /** Writes the typed values, then really talks to both services. */
  const test = async () => {
    setBusy(true)
    setDbConfig({ dbServer: server, dbPort: port, dbDatabase: dbName, dbAuthType: authType })
    setPrintConfig({ printServiceUrl: printUrl, printerBrand: brand, printerDpi: dpi })
    await runHealthCheck()
    const s = useLabelStore.getState()
    setDbOk(s.dbStatus === 'connected')
    setSvcOk(s.printServiceStatus === 'connected')
    setCounts({
      opti: s.templateLibrary.filter((t) => (t.client || 'opti') === 'opti').length,
      erp: s.templateLibrary.filter((t) => t.client === 'erp').length,
    })
    setBusy(false)
  }

  const testService = async () => {
    setBusy(true)
    setPrintConfig({ printServiceUrl: printUrl, printerBrand: brand, printerDpi: dpi })
    await runHealthCheck()
    setSvcOk(useLabelStore.getState().printServiceStatus === 'connected')
    setBusy(false)
  }

  const canContinue1 = server.trim() !== '' && dbName.trim() !== '' && dbOk === true

  return createPortal(
    <div className="lc-modal-overlay !items-stretch !justify-stretch !p-0">
      <div className="m-auto flex w-full max-w-[1080px] overflow-hidden rounded-[16px] bg-[var(--panel)] shadow-[var(--sh-pop)]">
        {/* Hero — flat navy, no gradient (spec §2) */}
        <div
          className="hidden w-5/12 flex-col justify-center p-8 text-white md:flex"
          style={{ background: 'linear-gradient(160deg, var(--nav) 0%, var(--nav-end) 100%)' }}
        >
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[10px] bg-white p-2 ring-1 ring-white/25">
            <BrandMark size={44} className="h-full w-full" />
          </div>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-white">
            Welcome to
            <br />
            Label Designer
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-[#C6D6E8]">
            Connect once to the shared database. Opti and ERP templates will be ready in under a minute.
          </p>
          <ul className="mt-8 space-y-2.5">
            {HERO_POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2 text-[13px] text-[#C6D6E8]">
                <Check size={15} className="flex-none text-[#4ADE80]" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-6 border-b border-[var(--line)] px-8 py-4">
            {STEPS.map((s) => (
              <div key={s.n} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    step > s.n
                      ? 'bg-[var(--ok)] text-white'
                      : step === s.n
                        ? 'bg-[var(--pri)] text-white'
                        : 'border border-[var(--line)] bg-[var(--panel)] text-[var(--mut)]'
                  }`}
                >
                  {step > s.n ? <Check size={13} /> : s.n}
                </span>
                <span
                  className={`text-[13px] ${
                    step === s.n ? 'font-bold text-[var(--tx)]' : 'text-[var(--mut)]'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
            {step === 1 && (
              <div>
                <h2 className="lc-dialog-title">Where are your templates stored?</h2>
                <p className="mt-1 text-[13px] text-[var(--mut)]">
                  Ask IT for the server name if you do not know it.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div>
                    <label className="lc-label mb-1.5 block" htmlFor="fw-server">
                      Server
                    </label>
                    <input
                      id="fw-server"
                      type="text"
                      value={server}
                      onChange={(e) => setServer(e.target.value)}
                      className="lc-input !h-10"
                    />
                  </div>
                  <div>
                    <label className="lc-label mb-1.5 block" htmlFor="fw-port">
                      Port
                    </label>
                    <input
                      id="fw-port"
                      type="number"
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      className="lc-input !h-10"
                    />
                  </div>
                  <div>
                    <label className="lc-label mb-1.5 block" htmlFor="fw-db">
                      Database
                    </label>
                    <input
                      id="fw-db"
                      type="text"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      className="lc-input !h-10"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="lc-label mb-1.5 block">Sign in with</label>
                  <div className="lc-segment !max-w-[420px]">
                    <button
                      type="button"
                      className={authType === 'windows' ? 'is-on' : ''}
                      onClick={() => setAuthType('windows')}
                    >
                      <Monitor size={14} />
                      Windows account
                    </button>
                    <button
                      type="button"
                      className={authType === 'sql' ? 'is-on' : ''}
                      onClick={() => setAuthType('sql')}
                    >
                      <KeyRound size={14} />
                      SQL user
                    </button>
                  </div>
                  <p className="mt-2 text-[12px] text-[var(--mut)]">
                    The password is stored in Windows Credential Manager, never in a plain text file.
                  </p>
                </div>

                {dbOk === true && (
                  <div className="lc-msg lc-msg-ok mt-5">
                    <CircleCheck size={15} className="flex-none" />
                    <span className="text-[13px] font-medium">
                      Connected. Found {counts.opti} Opti and {counts.erp} ERP templates.
                    </span>
                  </div>
                )}
                {dbOk === false && (
                  <div className="lc-msg lc-msg-err mt-5">
                    <Database size={15} className="flex-none" />
                    <span className="text-[13px] font-medium">
                      Could not connect. Check the server name, then test again.
                    </span>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="lc-dialog-title">Print service</h2>
                <p className="mt-1 text-[13px] text-[var(--mut)]">
                  The service that sends labels to the printers. Usually on this PC.
                </p>

                <div className="mt-6">
                  <label className="lc-label mb-1.5 block" htmlFor="fw-svc">
                    Service address
                  </label>
                  <input
                    id="fw-svc"
                    type="text"
                    value={printUrl}
                    onChange={(e) => setPrintUrl(e.target.value)}
                    className="lc-input !h-10 !max-w-[420px]"
                  />
                </div>

                {svcOk === true && (
                  <div className="lc-msg lc-msg-ok mt-4">
                    <CircleCheck size={15} className="flex-none" />
                    <span className="text-[13px] font-medium">
                      Service is running. Printer code and export will work.
                    </span>
                  </div>
                )}
                {svcOk === false && (
                  <div className="lc-msg lc-msg-warn mt-4">
                    <Printer size={15} className="flex-none" />
                    <span className="text-[13px] font-medium">
                      Not reachable. You can still design and save — only printer code and export are
                      paused.
                    </span>
                  </div>
                )}

                <div className="mt-5 grid max-w-[520px] grid-cols-2 gap-4">
                  <div>
                    <label className="lc-label mb-1.5 block" htmlFor="fw-brand">
                      Default printer
                    </label>
                    <select
                      id="fw-brand"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="lc-select !h-10"
                    >
                      {[
                        ['zebra', 'Zebra · ZPL'],
                        ['honeywell', 'Honeywell · ZPL'],
                        ['citizen', 'Citizen · ZPL'],
                        ['sato', 'SATO · ZPL'],
                        ['sato-sbpl', 'SATO · SBPL'],
                        ['tsc', 'TSC · TSPL'],
                        ['godex', 'Godex · EZPL'],
                        ['datamax', 'Datamax · DPL'],
                        ['epl', 'Eltron · EPL2'],
                      ].map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="lc-label mb-1.5 block" htmlFor="fw-dpi">
                      Resolution
                    </label>
                    <select
                      id="fw-dpi"
                      value={dpi}
                      onChange={(e) => setDpi(Number(e.target.value))}
                      className="lc-select !h-10"
                    >
                      <option value={203}>203 DPI</option>
                      <option value={300}>300 DPI</option>
                      <option value={600}>600 DPI</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="lc-dialog-title">You are ready</h2>
                <p className="mt-1 text-[13px] text-[var(--mut)]">
                  Everything below can be changed later in Settings.
                </p>

                <div className="mt-6 space-y-3">
                  <SummaryRow
                    icon={Database}
                    label="Database"
                    value={`${server}:${port} · ${dbName}`}
                    ok={dbOk === true}
                  />
                  <SummaryRow
                    icon={Printer}
                    label="Print service"
                    value={printUrl}
                    ok={svcOk === true}
                  />
                  <SummaryRow
                    icon={Tag}
                    label="Saved for"
                    value="Opti · switch in the top bar"
                    ok
                  />
                </div>

                <div className="lc-msg lc-msg-info mt-6">
                  <CircleCheck size={15} className="flex-none" />
                  <span className="text-[13px] font-medium">
                    Open a template from the Templates tab, or press New to start one.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--panel-2)] px-8 py-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="lc-btn lc-btn-secondary !h-10"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              {(step === 1 || step === 2) && (
                <button type="button" onClick={test} disabled={busy} className="lc-btn lc-btn-secondary !h-10">
                  <Zap size={15} />
                  <span>{busy ? 'Checking…' : 'Test connection'}</span>
                </button>
              )}

              {step === 1 && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canContinue1}
                  className="lc-btn lc-btn-primary !h-10"
                  title={canContinue1 ? undefined : 'Test the connection first'}
                >
                  <span>Continue</span>
                  <ArrowRight size={15} />
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    testService()
                    setStep(3)
                  }}
                  className="lc-btn lc-btn-primary !h-10"
                >
                  <span>Continue</span>
                  <ArrowRight size={15} />
                </button>
              )}

              {step === 3 && (
                <button type="button" onClick={close} className="lc-btn lc-btn-primary !h-10">
                  <Check size={15} />
                  <span>Start designing</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function SummaryRow({ icon: Icon, label, value, ok }) {
  return (
    <div className="lc-card flex items-center gap-3 px-4 py-3">
      <Icon size={16} className="flex-none text-[var(--mut)]" />
      <span className="w-[110px] flex-none text-[13px] font-semibold text-[var(--tx)]">{label}</span>
      <span className="lc-mono min-w-0 flex-1 truncate text-[12px] text-[var(--mut)]">{value}</span>
      <span className={`lc-badge flex-none ${ok ? 'lc-badge-ok' : 'lc-badge-warn'}`}>
        {ok ? 'Ready' : 'Not connected'}
      </span>
    </div>
  )
}