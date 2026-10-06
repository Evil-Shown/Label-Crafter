import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FileCode,
  FolderOpen,
  Database,
  X,
  Check,
  Info,
  RefreshCw,
  TriangleAlert,
  CircleCheck,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { parseOifText, pieceSummary } from '../utils/oifParser'
import { listErpOrders, getErpOrder } from '../services/designApi'

const LAST_FILE_KEY = 'lc-last-oif-name'

export default function LoadRealDataModal() {
  const isOpen = useLabelStore((s) => s.showLoadDataModal)
  const client = useLabelStore((s) => s.client)
  const printServiceUrl = useLabelStore((s) => s.printServiceUrl)
  const loadRealData = useLabelStore((s) => s.loadRealData)
  const addToast = useLabelStore((s) => s.addToast)

  const [tab, setTab] = useState('oif')
  const [pieces, setPieces] = useState([])
  const [sourceName, setSourceName] = useState('')
  const [selected, setSelected] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersError, setOrdersError] = useState('')

  const close = () => useLabelStore.setState({ showLoadDataModal: false })

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setOrdersError('')
    try {
      setOrders(await listErpOrders(printServiceUrl))
    } catch (e) {
      setOrders([])
      setOrdersError(
        e.message || 'Could not reach the database, so ERP orders cannot be listed.',
      )
    } finally {
      setLoading(false)
    }
  }, [printServiceUrl])

  useEffect(() => {
    if (!isOpen) return
    setError('')
    if (tab === 'erp' && orders.length === 0 && !loading) loadOrders()
    // Reset the remembered file name when the dialog is reopened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tab])

  const onFile = async (file) => {
    if (!file) return
    setError('')
    try {
      const text = await file.text()
      const parsed = parseOifText(text)
      setPieces(parsed)
      setSourceName(file.name)
      setSelected(parsed[0].index)
      localStorage.setItem(LAST_FILE_KEY, file.name)
    } catch (e) {
      setPieces([])
      setSourceName(file.name)
      setError(e.message)
    }
  }

  const openErpOrder = async (order) => {
    setError('')
    setLoading(true)
    try {
      const data = await getErpOrder(printServiceUrl, order.orderNo || order.OrderNo)
      const bag = data.values || data
      const list = Array.isArray(data.pieces) && data.pieces.length ? data.pieces : [bag]
      setPieces(list.map((p, i) => ({ index: i + 1, values: p.values || p })))
      setSourceName(`ERP order ${order.orderNo || order.OrderNo}`)
      setSelected(1)
      addToast({
        message: `Loaded ERP order ${order.orderNo || order.OrderNo}`,
        type: 'success',
      })
    } catch (e) {
      setError(e.message || 'That ERP order could not be read.')
    } finally {
      setLoading(false)
    }
  }

  const apply = () => {
    const piece = pieces.find((p) => p.index === selected)
    if (!piece) return
    loadRealData({
      source: sourceName,
      pieceIndex: selected,
      totalPieces: pieces.length,
      data: piece.values,
    })
    close()
  }

  if (!isOpen) return null

  const remembered = localStorage.getItem(LAST_FILE_KEY)
  const chosen = pieces.find((p) => p.index === selected)

  return createPortal(
    <div className="lc-modal-overlay" onClick={close}>
      <div
        className="lc-modal !max-w-[680px]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Load real data"
      >
        <div className="lc-modal-head">
          <span className="lc-modal-head-icon">
            <FileCode size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="lc-dialog-title">Load real data</h2>
            <p className="mt-0.5 text-[13px] text-[var(--mut)]">
              Bound fields show their key until a real piece or order is loaded. Nothing is ever
              filled in for you.
            </p>
          </div>
          <button type="button" className="lc-icon-btn" onClick={close} title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="lc-modal-body">
          <div className="lc-segment mb-5">
            <button type="button" className={tab === 'oif' ? 'is-on' : ''} onClick={() => setTab('oif')}>
              <FolderOpen size={14} />
              Opti project file (.oif)
            </button>
            <button type="button" className={tab === 'erp' ? 'is-on' : ''} onClick={() => setTab('erp')}>
              <Database size={14} />
              ERP order from database
            </button>
          </div>

          {tab === 'oif' ? (
            <>
              <div className="lc-card flex items-center gap-3 px-4 py-3">
                <FileCode size={16} className="flex-none text-[var(--mut)]" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--tx)]">
                  {sourceName || (remembered ? `Last used: ${remembered}` : 'No file chosen yet')}
                </span>
                <label className="lc-btn lc-btn-secondary flex-none !h-9">
                  <FolderOpen size={14} />
                  <span>Browse…</span>
                  <input
                    type="file"
                    accept=".oif,.json,application/json"
                    className="hidden"
                    onChange={(e) => {
                      onFile(e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>

              {error && (
                <div className="lc-msg lc-msg-err mt-4">
                  <TriangleAlert size={15} className="flex-none" />
                  <span className="text-[13px] font-medium">{error}</span>
                </div>
              )}

              {pieces.length > 0 && (
                <>
                  <p className="lc-label mb-2 mt-5 block">Choose a piece</p>
                  <div className="lc-card max-h-[280px] overflow-y-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[var(--line)]">
                          {['Piece', 'Size (mm)', 'Cust PO', 'Service 1'].map((h) => (
                            <th key={h} className="lc-label px-4 py-2.5 font-bold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pieces.map((p) => {
                          const s = pieceSummary(p)
                          const on = selected === p.index
                          return (
                            <tr
                              key={p.index}
                              onClick={() => setSelected(p.index)}
                              className={`cursor-pointer border-b border-[var(--line)] last:border-b-0 ${
                                on ? 'bg-[var(--pri-s)]' : 'hover:bg-[var(--bg)]'
                              }`}
                            >
                              <td className="px-4 py-2.5">
                                <span className="flex items-center gap-2 text-[13px] font-semibold text-[var(--tx)]">
                                  {on && <Check size={14} className="text-[var(--pri)]" />}
                                  {p.index}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-[13px] text-[var(--tx-2)]">{s.size || '—'}</td>
                              <td className="px-4 py-2.5 text-[13px] text-[var(--tx-2)]">{s.custPo || '—'}</td>
                              <td className="px-4 py-2.5 text-[13px] text-[var(--tx-2)]">{s.service || '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {pieces.length === 0 && !error && (
                <div className="lc-msg lc-msg-info mt-4">
                  <Info size={15} className="flex-none" />
                  <span className="flex-1 text-[13px] font-medium">
                    Choose the .oif file that Opti exported for this job. Note mappings from the
                    project are applied automatically.
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              {ordersError && (
                <div className="lc-msg lc-msg-warn">
                  <TriangleAlert size={15} className="flex-none" />
                  <span className="flex-1 text-[13px] font-medium">{ordersError}</span>
                  <button type="button" onClick={loadOrders} className="lc-btn lc-btn-sm lc-btn-secondary flex-none">
                    <RefreshCw size={13} />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              {orders.length > 0 && (
                <div className="lc-card divide-y divide-[var(--line)]">
                  {orders.map((o) => (
                    <button
                      key={o.orderNo || o.OrderNo}
                      type="button"
                      onClick={() => openErpOrder(o)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--bg)]"
                    >
                      <span className="min-w-0">
                        <span className="block text-[13px] font-bold text-[var(--tx)]">
                          {o.orderNo || o.OrderNo}
                        </span>
                        <span className="block truncate text-[12px] text-[var(--mut)]">
                          {[o.customerName, o.description].filter(Boolean).join(' · ') || 'No description'}
                        </span>
                      </span>
                      <span className="lc-badge flex-none lc-badge-erp">Read only</span>
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <p className="py-6 text-center text-[13px] text-[var(--mut)]">Loading orders…</p>
              )}

              {!loading && orders.length === 0 && !ordersError && (
                <p className="py-6 text-center text-[13px] text-[var(--mut)]">
                  No ERP orders were found for this client.
                </p>
              )}
            </>
          )}

          {chosen && tab === 'oif' && (
            <div className="lc-msg lc-msg-ok mt-5">
              <CircleCheck size={15} className="flex-none" />
              <span className="flex-1 text-[13px] font-medium">
                Piece {chosen.index} of {pieces.length} is ready to use.
              </span>
            </div>
          )}
        </div>

        <div className="lc-modal-foot">
          <button type="button" onClick={close} className="lc-btn lc-btn-secondary !h-10">
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={pieces.length === 0}
            className="lc-btn lc-btn-primary !h-10"
          >
            <Check size={15} />
            <span>{pieces.length ? `Use piece ${selected}` : 'Choose a piece'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}