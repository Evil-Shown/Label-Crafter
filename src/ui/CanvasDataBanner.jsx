import {
  Info,
  CircleCheck,
  Lock,
  Printer,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FolderOpen,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { printServiceHost } from '../services/printService'

/**
 * Area 10 — data and status banners (spec §4.4, §8.1, §8.2, errors.png, offline.png).
 * Full-bleed strips stacked under the canvas toolbar so they never cover the label.
 */
export default function CanvasDataBanner() {
  const hasHostPreviewData = useLabelStore((s) => s.hasHostPreviewData)
  const realDataInfo = useLabelStore((s) => s.realDataInfo)
  const client = useLabelStore((s) => s.client)
  const dbStatus = useLabelStore((s) => s.dbStatus)
  const dbServer = useLabelStore((s) => s.dbServer)
  const dbRetryIn = useLabelStore((s) => s.dbRetryIn)
  const printServiceStatus = useLabelStore((s) => s.printServiceStatus)
  const printServiceUrl = useLabelStore((s) => s.printServiceUrl)
  const stepPiece = useLabelStore((s) => s.stepPiece)
  const retryDatabase = useLabelStore((s) => s.retryDatabase)
  const checkServiceHealth = useLabelStore((s) => s.checkServiceHealth)

  return (
    <>
      {/* Database offline — read-only, with back-off countdown (offline.png) */}
      {dbStatus === 'offline' && Boolean(dbServer) && (
        <div className="lc-strip lc-strip-warn">
          <Lock size={15} className="flex-none" />
          <span className="min-w-0 flex-1">
            <strong>Read-only: database offline.</strong> You can keep designing, but saving is
            paused until it reconnects.
          </span>
          <span className="flex-none font-semibold">
            {dbRetryIn > 0 ? `Retrying in ${dbRetryIn} s` : 'Retrying…'}
          </span>
          <button
            type="button"
            onClick={() => retryDatabase()}
            className="lc-btn lc-btn-sm flex-none !border-[var(--warn)] !bg-[var(--panel)] !text-[var(--warn)]"
          >
            <RefreshCw size={13} />
            <span>Retry now</span>
          </button>
        </div>
      )}

      {/* Print service unreachable (errors.png) */}
      {printServiceStatus !== 'connected' && (
        <div className="lc-strip lc-strip-err">
          <Printer size={15} className="flex-none" />
          <span className="min-w-0 flex-1">
            <strong>Print service is not reachable</strong> at {printServiceHost(printServiceUrl)}.
            Designing and saving still work; printer code and export are paused.
          </span>
          <button
            type="button"
            onClick={() => checkServiceHealth()}
            className="lc-btn lc-btn-sm flex-none !border-[var(--err)] !bg-[var(--panel)] !text-[var(--err)]"
          >
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Real data loaded — step through pieces (main_real.png) */}
      {hasHostPreviewData && realDataInfo && (
        <div className="flex items-center gap-3 border-b border-[var(--ok-line)] bg-[var(--ok-s)] px-4 py-2 text-[13px] font-semibold text-[var(--ok)]">
          <CircleCheck size={15} className="flex-none" />
          <span className="min-w-0 flex-1 truncate">
            <strong>Real data:</strong> {realDataInfo.source} · piece {realDataInfo.pieceIndex} of{' '}
            {realDataInfo.totalPieces}
          </span>
          <div className="flex flex-none items-center gap-1">
            <button
              type="button"
              onClick={() => stepPiece(-1)}
              className="lc-icon-btn !h-7 !w-7 !border-[var(--ok-line)] !bg-[var(--panel)] !text-[var(--ok)]"
              title="Previous piece"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => stepPiece(1)}
              className="lc-icon-btn !h-7 !w-7 !border-[var(--ok-line)] !bg-[var(--panel)] !text-[var(--ok)]"
              title="Next piece"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* No real data loaded — the everyday state (main_light.png) */}
      {!hasHostPreviewData && (
        <div className="pointer-events-none absolute top-3 left-0 right-0 z-10 flex items-center justify-center px-4">
          <div className="pointer-events-auto lc-card flex max-w-[720px] items-center gap-2.5 !rounded-full px-4 py-1.5 shadow-[var(--sh-md)] backdrop-blur-md bg-[var(--panel)]/95">
            <Info size={15} className="flex-none text-[var(--mut)]" />
            <span className="text-[12.5px] text-[var(--tx-2)]">
              <strong className="font-bold text-[var(--tx)]">No real data loaded.</strong>{' '}
              Bound fields show their key, e.g. N1F3.
            </span>
            <button
              type="button"
              onClick={() => useLabelStore.setState({ showLoadDataModal: true })}
              className="lc-btn lc-btn-primary lc-btn-sm ml-1 flex-none !rounded-full"
            >
              <FolderOpen size={13} />
              <span>{client === 'erp' ? 'Load real ERP data' : 'Load real Opti data'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
