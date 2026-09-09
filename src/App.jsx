import TopBar from './ui/TopBar'
import Toolbar from './ui/Toolbar'
import LayersPanel from './ui/LayersPanel'
import PropertiesPanel from './ui/PropertiesPanel'
import LabelCanvas from './canvas/LabelCanvas'

export default function App() {
  return (
    <div className="relative flex h-full flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Toolbar />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 bg-[var(--lc-canvas-bg)]">
            <LabelCanvas />
          </div>
          <aside className="flex h-44 shrink-0 border-t border-[var(--lc-panel-border)] bg-[var(--lc-panel)]">
            <div className="flex w-56 shrink-0 flex-col border-r border-[var(--lc-panel-border)]">
              <LayersPanel />
            </div>
            <DataHints />
          </aside>
        </div>
        <PropertiesPanel />
      </div>
    </div>
  )
}

function DataHints() {
  return (
    <section className="flex flex-1 flex-col p-3 text-xs">
      <h3 className="mb-2 font-semibold uppercase tracking-wide text-[var(--lc-muted)]">
        Data tokens
      </h3>
      <p className="mb-2 text-[var(--lc-muted)]">
        Use <code className="rounded bg-black/30 px-1">{'{{fieldName}}'}</code>{' '}
        in text fields. Preview data switches when you change Client (Opti / ERP)
        in Properties.
      </p>
      <div className="flex flex-wrap gap-1">
        {[
          'orderNumber',
          'batchNumber',
          'Barcode',
          'customerName',
          'pieceDescription',
          'weight',
          'area',
          'OrderNo',
          'Dimensions',
          'GlassSpec',
        ].map((t) => (
          <span
            key={t}
            className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-[10px]"
          >
            {`{{${t}}}`}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[var(--lc-muted)]">
        Save templates as JSON → Opti / ERP load them →{' '}
        <strong className="text-white">Label Print Service</strong> compiles to
        ZPL/TSPL for the printer.
      </p>
    </section>
  )
}
