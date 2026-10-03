import { useEffect, useState } from 'react'
import {
  Database,
  ArrowRightLeft,
  Printer,
  Palette,
  Info,
  Zap,
  CircleCheck,
  TriangleAlert,
  History,
  Monitor,
  Sun,
  Moon,
  Save,
  RefreshCw,
  KeyRound,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { formatSize } from '../utils/units'

const NAV = [
  { id: 'database', label: 'Database', Icon: Database, hint: 'Where templates for Opti and ERP are stored.' },
  { id: 'clients', label: 'Opti & ERP', Icon: ArrowRightLeft, hint: 'Both clients share one table, tagged by client.' },
  { id: 'printing', label: 'Printing', Icon: Printer, hint: 'Print service, default printer and resolution.' },
  { id: 'appearance', label: 'Appearance', Icon: Palette, hint: 'Light or dark. The label itself always stays white.' },
  { id: 'about', label: 'About', Icon: Info, hint: 'Version and what each part of the system does.' },
]

const TITLES = {
  database: 'Database',
  clients: 'Opti & ERP',
  printing: 'Printing',
  appearance: 'Appearance',
  about: 'About',
}

function Card({ title, icon: Icon, action, children, className = '' }) {
  return (
    <section className={`lc-card p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={16} className="text-[var(--mut)]" />}
            <h2 className="lc-section-title !text-[14px]">{title}</h2>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="lc-label mb-1.5 block">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[12px] leading-snug text-[var(--mut)]">{hint}</p>}
    </div>
  )
}

export default function SettingsView() {
  const [activeNav, setActiveNav] = useState('database')

  const store = useLabelStore()
  const {
    dbServer,
    dbDatabase,
    dbPort,
    dbAuthType,
    dbStatus,
    dbLatencyMs,
    printServiceUrl,
    printServiceStatus,
    printerBrand,
    printerDpi,
    printerHost,
    printerPort,
    theme,
    templateLibrary,
    recentActivity,
    client,
  } = store

  const setPrintConfig = useLabelStore((s) => s.setPrintConfig)
  const checkServiceHealth = useLabelStore((s) => s.checkServiceHealth)
  const refreshTemplateLibrary = useLabelStore((s) => s.refreshTemplateLibrary)
  const setDbConfig = useLabelStore((s) => s.setDbConfig)
  const addToast = useLabelStore((s) => s.addToast)

  // Draft values: nothing is written until Save is pressed.
  const [draft, setDraft] = useState({
    server: dbServer,
    port: dbPort,
    database: dbDatabase,
    authType: dbAuthType,
    printServiceUrl,
    printerBrand,
    printerDpi,
    printerHost,
    printerPort,
  })
  const [erpMode, setErpMode] = useState('same')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    setDraft((d) => ({
      ...d,
      server: dbServer,
      port: dbPort,
      database: dbDatabase,
      authType: dbAuthType,
      printServiceUrl,
      printerBrand,
      printerDpi,
      printerHost,
      printerPort,
    }))
  }, [dbServer, dbPort, dbDatabase, dbAuthType, printServiceUrl, printerBrand, printerDpi, printerHost, printerPort])

  const patch = (k) => (e) => {
    const raw = e.target.value
    setDraft((d) => ({ ...d, [k]: e.target.type === 'number' ? Number(raw) : raw }))
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    await checkServiceHealth()
    const s = useLabelStore.getState()
    setTestResult({
      ok: s.dbStatus === 'connected',
      ms: s.dbLatencyMs,
      message:
        s.dbStatus === 'connected'
          ? `Connected in ${s.dbLatencyMs} ms · found ${countFor('opti')} Opti and ${countFor('erp')} ERP templates`
          : 'Could not reach the database. Check the server name and that SQL Server is running.',
    })
    setTesting(false)
  }

  const countFor = (c) => templateLibrary.filter((t) => (t.client || 'opti') === c).length

  const handleSave = () => {
    setDbConfig({
      dbServer: draft.server,
      dbPort: draft.port,
      dbDatabase: draft.database,
      dbAuthType: draft.authType,
    })
    setPrintConfig({
      printServiceUrl: draft.printServiceUrl,
      printerBrand: draft.printerBrand,
      printerDpi: draft.printerDpi,
      printerHost: draft.printerHost,
      printerPort: draft.printerPort,
    })
    refreshTemplateLibrary()
    addToast({ message: 'Settings saved', type: 'success' })
  }

  const meta = NAV.find((n) => n.id === activeNav)

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-[var(--bg)] text-[var(--tx)]">
      {/* Side navigation */}
      <aside className="w-[276px] shrink-0 overflow-y-auto border-r border-[var(--line)] bg-[var(--panel)] p-4">
        <nav className="space-y-2">
          {NAV.map(({ id, label, Icon }) => {
            const on = activeNav === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveNav(id)}
                aria-current={on ? 'page' : undefined}
                className={`flex w-full items-center gap-2.5 rounded-[7px] border px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                  on
                    ? 'border-[var(--line)] bg-[var(--panel)] text-[var(--tx)] shadow-[var(--sh-sm)]'
                    : 'border-transparent text-[var(--mut)] hover:bg-[var(--bg)] hover:text-[var(--tx)]'
                }`}
              >
                <Icon size={16} className={on ? 'text-[var(--pri)]' : ''} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Panel */}
      <main className="min-w-0 flex-1 overflow-y-auto px-8 py-7">
        <div className="mb-6 max-w-[1100px]">
          <h1 className="lc-page-title">{TITLES[activeNav]}</h1>
          <p className="mt-1 text-[13px] text-[var(--mut)]">{meta?.hint}</p>
        </div>

        <div className="max-w-[1100px] space-y-6 pb-10">
          {activeNav === 'database' && (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card
                  title="Connection"
                  icon={Database}
                  action={
                    <span className={`lc-connection-status ${dbStatus === 'connected' ? 'is-online' : 'is-offline'}`}>
                      {dbStatus === 'connected' ? (
                        <>
                          <CircleCheck size={13} />
                          Connected · {dbLatencyMs} ms
                        </>
                      ) : (
                        <>
                          <TriangleAlert size={13} />
                          Offline
                        </>
                      )}
                    </span>
                  }
                >
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Server">
                      <input type="text" value={draft.server} onChange={patch('server')} className="lc-input !h-10" />
                    </Field>
                    <Field label="Port">
                      <input type="number" value={draft.port} onChange={patch('port')} className="lc-input !h-10" />
                    </Field>
                    <Field label="Database">
                      <input type="text" value={draft.database} onChange={patch('database')} className="lc-input !h-10" />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field label="Sign in with">
                      <div className="lc-segment">
                        <button
                          type="button"
                          className={draft.authType === 'windows' ? 'is-on' : ''}
                          onClick={() => setDraft((d) => ({ ...d, authType: 'windows' }))}
                        >
                          <Monitor size={14} />
                          Windows account
                        </button>
                        <button
                          type="button"
                          className={draft.authType === 'sql' ? 'is-on' : ''}
                          onClick={() => setDraft((d) => ({ ...d, authType: 'sql' }))}
                        >
                          <KeyRound size={14} />
                          SQL user
                        </button>
                      </div>
                    </Field>
                    <p className="mt-2 text-[12px] leading-snug text-[var(--mut)]">
                      The password is kept in Windows Credential Manager, never in a plain text file.
                    </p>
                  </div>

                  {testResult && (
                    <div className={`lc-msg ${testResult.ok ? 'lc-msg-ok' : 'lc-msg-err'} mt-4`}>
                      {testResult.ok ? (
                        <CircleCheck size={15} className="flex-none" />
                      ) : (
                        <TriangleAlert size={15} className="flex-none" />
                      )}
                      <span className="text-[13px] font-medium">{testResult.message}</span>
                    </div>
                  )}

                  <div className="mt-5 flex items-center gap-2">
                    <button type="button" onClick={handleTest} disabled={testing} className="lc-btn lc-btn-secondary !h-10">
                      <Zap size={15} />
                      <span>{testing ? 'Testing…' : 'Test'}</span>
                    </button>
                    <button type="button" onClick={handleSave} className="lc-btn lc-btn-primary !h-10">
                      <Save size={15} />
                      <span>Save changes</span>
                    </button>
                  </div>
                </Card>

                <Card title="Where templates live" icon={ArrowRightLeft}>
                  <p className="text-[13px] leading-relaxed text-[var(--tx-2)]">
                    Opti and ERP share the table{' '}
                    <span className="lc-mono rounded-[4px] bg-[var(--bg)] px-1 py-0.5">SpilLabelTemplates</span>.
                    Each template is tagged <span className="lc-badge lc-badge-opti">OPTI</span> or{' '}
                    <span className="lc-badge lc-badge-erp">ERP</span>, so neither client sees the
                    other's designs.
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {['opti', 'erp'].map((c) => (
                      <div key={c} className="lc-card flex items-center justify-between px-4 py-3">
                        <span className={`lc-badge ${c === 'erp' ? 'lc-badge-erp' : 'lc-badge-opti'}`}>
                          {c === 'erp' ? 'ERP' : 'OPTI'}
                        </span>
                        <span className="text-[14px] font-bold text-[var(--tx)]">{countFor(c)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[12px] leading-snug text-[var(--mut)]">
                    Changing the database reloads the library. The switch in the top bar decides which
                    client you are designing for.
                  </p>
                </Card>
              </div>

              <Card title="Recent activity" icon={History}>
                {recentActivity.length === 0 ? (
                  <p className="py-6 text-center text-[13px] text-[var(--mut)]">Nothing has happened yet.</p>
                ) : (
                  <ul>
                    {recentActivity.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-3 border-b border-[var(--line)] py-2.5 last:border-b-0"
                      >
                        <span className="w-24 flex-none text-[12px] text-[var(--mut)]">{a.time}</span>
                        <span className={`lc-badge ${a.client === 'erp' ? 'lc-badge-erp' : 'lc-badge-opti'}`}>
                          {a.client === 'erp' ? 'ERP' : 'OPTI'}
                        </span>
                        <span className="text-[13px] text-[var(--tx-2)]">{a.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
          )}

          {activeNav === 'clients' && (
            <Card title="Opti and ERP" icon={ArrowRightLeft}>
              <Field label="Designing for">
                <div className="lc-segment !max-w-[420px]">
                  {['opti', 'erp'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={client === c ? 'is-on' : ''}
                      onClick={() => useLabelStore.getState().setClient(c)}
                    >
                      {c === 'erp' ? 'ERP' : 'Opti'}
                    </button>
                  ))}
                </div>
              </Field>

              <p className="mt-5 text-[13px] leading-relaxed text-[var(--tx-2)]">
                Switching reloads the field catalogue and the template list for that client and clears
                any loaded piece data, so Opti and ERP data never mix. The template is always saved for
                whichever client is active.
              </p>

              <div className="mt-6">
                <Field label="ERP database">
                  <div className="lc-segment !max-w-[420px]">
                    <button
                      type="button"
                      className={erpMode === 'same' ? 'is-on' : ''}
                      onClick={() => setErpMode('same')}
                    >
                      Same as Opti
                    </button>
                    <button
                      type="button"
                      className={erpMode === 'different' ? 'is-on' : ''}
                      onClick={() => setErpMode('different')}
                    >
                      Use a different database
                    </button>
                  </div>
                </Field>
              </div>

              {erpMode === 'different' && (
                <div className="mt-4 grid gap-4 rounded-[10px] border border-[var(--erp-line)] bg-[var(--erp-s)] p-4 sm:grid-cols-3">
                  <Field label="ERP server">
                    <input type="text" defaultValue={draft.server} className="lc-input !h-10" />
                  </Field>
                  <Field label="ERP port">
                    <input type="number" defaultValue={draft.port} className="lc-input !h-10" />
                  </Field>
                  <Field label="ERP database">
                    <input type="text" defaultValue="SpilErp" className="lc-input !h-10" />
                  </Field>
                </div>
              )}
            </Card>
          )}

          {activeNav === 'printing' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card
                title="Print service"
                icon={Printer}
                action={
                  <span className={`lc-connection-status ${printServiceStatus === 'connected' ? 'is-online' : 'is-offline'}`}>
                    {printServiceStatus === 'connected' ? 'Connected' : 'Unreachable'}
                  </span>
                }
              >
                <Field label="Service address" hint="Usually on this PC. The Designer never prints directly — the service does.">
                  <input
                    type="text"
                    value={draft.printServiceUrl}
                    onChange={patch('printServiceUrl')}
                    className="lc-input !h-10"
                  />
                </Field>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Field label="Default printer">
                    <input type="text" value={draft.printerHost} onChange={patch('printerHost')} className="lc-input !h-10" />
                  </Field>
                  <Field label="Port">
                    <input type="number" value={draft.printerPort} onChange={patch('printerPort')} className="lc-input !h-10" />
                  </Field>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing}
                    className="lc-btn lc-btn-secondary !h-10"
                  >
                    <RefreshCw size={15} className={testing ? 'animate-spin' : ''} />
                    <span>{testing ? 'Testing…' : 'Test connection'}</span>
                  </button>
                  <button type="button" onClick={handleSave} className="lc-btn lc-btn-primary !h-10">
                    <Save size={15} />
                    <span>Save changes</span>
                  </button>
                </div>
              </Card>

              <Card title="Printer defaults" icon={Printer}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Brand">
                    <select value={draft.printerBrand} onChange={patch('printerBrand')} className="lc-select !h-10">
                      <option value="zebra">Zebra · ZPL</option>
                      <option value="honeywell">Honeywell · ZPL</option>
                      <option value="citizen">Citizen · ZPL</option>
                      <option value="sato">SATO · ZPL</option>
                      <option value="sato-sbpl">SATO · SBPL</option>
                      <option value="tsc">TSC · TSPL</option>
                      <option value="godex">Godex · EZPL</option>
                      <option value="datamax">Datamax · DPL</option>
                      <option value="epl">Eltron · EPL2</option>
                    </select>
                  </Field>
                  <Field label="Resolution">
                    <select value={draft.printerDpi} onChange={patch('printerDpi')} className="lc-select !h-10">
                      <option value={203}>203 DPI</option>
                      <option value={300}>300 DPI</option>
                      <option value={600}>600 DPI</option>
                    </select>
                  </Field>
                </div>
                <p className="mt-4 text-[12px] leading-snug text-[var(--mut)]">
                  These become the defaults for new templates. Every label can still override them.
                </p>
              </Card>
            </div>
          )}

          {activeNav === 'appearance' && (
            <Card title="Theme" icon={Palette}>
              <div className="lc-segment !max-w-[360px]">
                <button
                  type="button"
                  className={theme === 'light' ? 'is-on' : ''}
                  onClick={() => theme !== 'light' && store.toggleTheme()}
                >
                  <Sun size={14} />
                  Light
                </button>
                <button
                  type="button"
                  className={theme === 'dark' ? 'is-on' : ''}
                  onClick={() => theme !== 'dark' && store.toggleTheme()}
                >
                  <Moon size={14} />
                  Dark
                </button>
              </div>
              <p className="mt-5 max-w-[560px] text-[13px] leading-relaxed text-[var(--tx-2)]">
                One set of design tokens drives both themes, so the layout never changes. The label on
                the canvas always stays white, exactly like the paper it will be printed on.
              </p>
              <p className="mt-2 max-w-[560px] text-[12px] text-[var(--mut)]">
                Your choice is remembered on this PC.
              </p>
            </Card>
          )}

          {activeNav === 'about' && (
            <div className="space-y-6">
              <Card title="Label Designer" icon={Info}>
                <dl className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Version', '1.0 · standalone'],
                    ['Database', `${dbServer} · ${dbDatabase}`],
                    ['Print service', printServiceUrl],
                    ['Active client', client === 'erp' ? 'ERP' : 'Opti'],
                    ['Label size', formatSize(useLabelStore.getState().width, useLabelStore.getState().height)],
                    ['Templates in library', `${templateLibrary.length}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2">
                      <dt className="text-[12px] text-[var(--mut)]">{k}</dt>
                      <dd className="lc-mono truncate text-[12px] text-[var(--tx)]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card title="Who does what" icon={ArrowRightLeft}>
                <ul className="space-y-2.5 text-[13px] text-[var(--tx-2)]">
                  {[
                    ['Label Designer', 'Creates, edits and deletes templates. It never prints labels.'],
                    ['Opti', 'Lists templates, picks one default, prints pieces.'],
                    ['ERP', 'Lists templates, picks one default, prints orders.'],
                    ['Print Service', 'Turns a template plus real data into printer code and sends it.'],
                    ['Database', 'Keeps every Opti and ERP template in one place.'],
                  ].map(([who, what]) => (
                    <li key={who} className="flex gap-3">
                      <span className="w-[104px] flex-none font-bold text-[var(--tx)]">{who}</span>
                      <span>{what}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}