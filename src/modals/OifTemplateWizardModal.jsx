import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FileCode,
  FolderOpen,
  Check,
  X,
  TriangleAlert,
  ArrowRight,
  Layers,
  Settings2,
  Sparkles,
  Search,
  CheckSquare,
  Square,
  Type,
  Barcode,
  QrCode,
  Eye,
  Info,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { parseOifText, extractOifDataFields, pieceSummary } from '../utils/oifParser'
import { createTextField, createHeaderField, createBarcodeField, createQrField } from '../elements/factories'
import { toMm } from '../utils/units'

const SIZES = [
  { id: '100x150', w: 100, h: 150, label: '100 × 150 mm' },
  { id: '100x111', w: 100, h: 111, label: '100 × 111 mm' },
  { id: '100x60', w: 100, h: 60, label: '100 × 60 mm' },
  { id: '100x50', w: 100, h: 50, label: '100 × 50 mm' },
  { id: '90x43', w: 90, h: 43, label: '90 × 43 mm · Opti' },
  { id: '4x6in', w: 102, h: 152, label: '4 × 6 in' },
]

export default function OifTemplateWizardModal() {
  const isOpen = useLabelStore((s) => s.showOifImportModal)
  const setModal = useLabelStore((s) => s.setModal)
  const loadRealData = useLabelStore((s) => s.loadRealData)
  const addToast = useLabelStore((s) => s.addToast)

  // Step state: 1 = File & Details, 2 = Field Mapping & Preview
  const [step, setStep] = useState(1)
  const [oifFile, setOifFile] = useState(null)
  const [oifFileName, setOifFileName] = useState('')
  const [pieces, setPieces] = useState([])
  const [error, setError] = useState('')
  const [selectedPieceIndex, setSelectedPieceIndex] = useState(1)

  // Template config
  const [templateName, setTemplateName] = useState('')
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(150)
  const [selectedSizeId, setSelectedSizeId] = useState('100x150')
  const [labelType, setLabelType] = useState('production')
  const [layoutStyle, setLayoutStyle] = useState('grid') // 'grid' | 'column' | 'blank'

  // Field extraction & selection
  const [extractedData, setExtractedData] = useState({ pieceFields: [], noteFields: [] })
  const [fieldSearch, setFieldSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'piece' | 'note'
  const [selectedFieldKeys, setSelectedFieldKeys] = useState(new Set())
  const [fieldTypes, setFieldTypes] = useState({}) // fieldKey -> 'header' | 'text' | 'barcode' | 'qrcode'

  const close = () => {
    setModal('showOifImportModal', false)
  }

  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setOifFile(null)
      setOifFileName('')
      setPieces([])
      setError('')
      setTemplateName('')
      setSelectedFieldKeys(new Set())
      setFieldTypes({})
      setFieldSearch('')
    }
  }, [isOpen])

  const onSelectFile = async (file) => {
    if (!file) return
    setError('')
    try {
      const text = await file.text()
      const parsedPieces = parseOifText(text)
      const extracted = extractOifDataFields(parsedPieces)

      setOifFile(file)
      setOifFileName(file.name)
      setPieces(parsedPieces)
      setExtractedData(extracted)
      setSelectedPieceIndex(parsedPieces[0]?.index || 1)

      // Derive default template name from filename
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      setTemplateName(`Opti Label — ${baseName}`)

      // Auto-select common production fields with values
      const initialSelected = new Set()
      const initialTypes = {}

      // Suggest piece fields
      const priorityPieceKeys = ['orderNumber', 'customerName', 'Dimensions', 'width', 'height', 'pieceDescription', 'id']
      extracted.pieceFields.forEach((f) => {
        if (priorityPieceKeys.includes(f.key) || (f.sample && ['ordernumber', 'customername'].includes(f.key.toLowerCase()))) {
          initialSelected.add(f.key)
          if (f.key.toLowerCase().includes('order') || f.key.toLowerCase().includes('customer')) {
            initialTypes[f.key] = 'header'
          } else {
            initialTypes[f.key] = 'text'
          }
        }
      })

      // Suggest active note fields with samples (up to first 6 active notes)
      let activeNotesCount = 0
      extracted.noteFields.forEach((f) => {
        if (f.sample && activeNotesCount < 6) {
          initialSelected.add(f.key)
          // Barcode candidate if numeric / alphanumeric pattern
          if (f.subField === 1 && f.noteField === 1 && /^[A-Z0-9-]+$/i.test(f.sample)) {
            initialTypes[f.key] = 'barcode'
          } else {
            initialTypes[f.key] = 'text'
          }
          activeNotesCount++
        }
      })

      setSelectedFieldKeys(initialSelected)
      setFieldTypes(initialTypes)
    } catch (e) {
      setError(e.message || 'Could not parse that file as an Opti project file.')
    }
  }

  const handleSelectPreset = (p) => {
    setSelectedSizeId(p.id)
    setWidth(p.w)
    setHeight(p.h)
  }

  const toggleField = (key) => {
    setSelectedFieldKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const toggleSelectAll = (fieldList) => {
    setSelectedFieldKeys((prev) => {
      const next = new Set(prev)
      const allSelected = fieldList.every((f) => next.has(f.key))
      if (allSelected) {
        fieldList.forEach((f) => next.delete(f.key))
      } else {
        fieldList.forEach((f) => next.add(f.key))
      }
      return next
    })
  }

  const setTypeForField = (key, type) => {
    setFieldTypes((prev) => ({ ...prev, [key]: type }))
  }

  const allAvailableFields = useMemo(() => {
    return [...extractedData.pieceFields, ...extractedData.noteFields]
  }, [extractedData])

  const filteredFields = useMemo(() => {
    const q = fieldSearch.trim().toLowerCase()
    let list = []
    if (activeTab === 'all') list = allAvailableFields
    else if (activeTab === 'piece') list = extractedData.pieceFields
    else if (activeTab === 'note') list = extractedData.noteFields

    if (!q) return list
    return list.filter(
      (f) =>
        f.key.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q) ||
        (f.sample && f.sample.toLowerCase().includes(q)),
    )
  }, [allAvailableFields, extractedData, fieldSearch, activeTab])

  // Build and apply new template
  const handleGenerateTemplate = () => {
    if (!templateName.trim()) {
      addToast({ message: 'Template name is required', type: 'error' })
      return
    }

    const marginX = 12
    const marginY = 12
    const labelW = Number(width) || 100
    const labelH = Number(height) || 150
    // Canvas dimensions in mm to px
    const pw = (labelW * 96) / 25.4
    const ph = (labelH * 96) / 25.4

    const generatedFields = []
    const chosenList = allAvailableFields.filter((f) => selectedFieldKeys.has(f.key))

    if (layoutStyle !== 'blank' && chosenList.length > 0) {
      if (layoutStyle === 'column') {
        let curY = marginY
        const colWidth = Math.max(120, pw - marginX * 2)

        chosenList.forEach((f, idx) => {
          const type = fieldTypes[f.key] || 'text'
          const isNote = f.category === 'note'
          const noteMatch = isNote ? f.key.match(/^note(\d+)\.field(\d+)$/i) : null

          let elementHeight = 22
          let fontSize = 11

          if (type === 'header') {
            elementHeight = 26
            fontSize = 14
          } else if (type === 'barcode') {
            elementHeight = 44
          } else if (type === 'qrcode') {
            elementHeight = 44
          }

          if (curY + elementHeight > ph - marginY) {
            // wrap or stop if overflowing
            curY = marginY
          }

          if (type === 'barcode') {
            generatedFields.push(
              createBarcodeField({
                x: marginX,
                y: curY,
                width: Math.min(180, colWidth),
                height: elementHeight,
                label: f.label,
                source: isNote ? [] : [f.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: idx,
              }),
            )
          } else if (type === 'qrcode') {
            generatedFields.push(
              createQrField({
                x: marginX,
                y: curY,
                width: elementHeight,
                height: elementHeight,
                label: f.label,
                source: isNote ? [] : [f.key],
                zIndex: idx,
              }),
            )
          } else if (type === 'header') {
            generatedFields.push(
              createHeaderField({
                x: marginX,
                y: curY,
                width: colWidth,
                height: elementHeight,
                fontSize,
                label: f.label,
                value: isNote ? undefined : `{{${f.key}}}`,
                source: isNote ? [] : [f.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: idx,
              }),
            )
          } else {
            generatedFields.push(
              createTextField({
                x: marginX,
                y: curY,
                width: colWidth,
                height: elementHeight,
                fontSize,
                label: f.label,
                value: isNote ? undefined : `{{${f.key}}}`,
                source: isNote ? [] : [f.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: idx,
              }),
            )
          }
          curY += elementHeight + 6
        })
      } else {
        // Grid (2-column layout)
        const gap = 10
        const colW = (pw - marginX * 2 - gap) / 2
        let curY = marginY
        let col = 0

        chosenList.forEach((f, idx) => {
          const type = fieldTypes[f.key] || 'text'
          const isNote = f.category === 'note'
          const noteMatch = isNote ? f.key.match(/^note(\d+)\.field(\d+)$/i) : null

          // Barcodes span full width
          const isFull = type === 'barcode' || type === 'header'

          if (isFull && col !== 0) {
            curY += 30
            col = 0
          }

          const elemX = isFull ? marginX : marginX + col * (colW + gap)
          const elemW = isFull ? pw - marginX * 2 : colW
          const elemH = type === 'barcode' ? 46 : type === 'qrcode' ? 44 : type === 'header' ? 26 : 22

          if (type === 'barcode') {
            generatedFields.push(
              createBarcodeField({
                x: elemX,
                y: curY,
                width: Math.min(180, elemW),
                height: elemH,
                label: f.label,
                source: isNote ? [] : [f.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: idx,
              }),
            )
            curY += elemH + 8
            col = 0
          } else if (type === 'qrcode') {
            generatedFields.push(
              createQrField({
                x: elemX,
                y: curY,
                width: elemH,
                height: elemH,
                label: f.label,
                source: isNote ? [] : [f.key],
                zIndex: idx,
              }),
            )
            col = (col + 1) % 2
            if (col === 0) curY += elemH + 6
          } else if (type === 'header') {
            generatedFields.push(
              createHeaderField({
                x: elemX,
                y: curY,
                width: elemW,
                height: elemH,
                fontSize: 14,
                label: f.label,
                value: isNote ? undefined : `{{${f.key}}}`,
                source: isNote ? [] : [f.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: idx,
              }),
            )
            curY += elemH + 6
            col = 0
          } else {
            generatedFields.push(
              createTextField({
                x: elemX,
                y: curY,
                width: elemW,
                height: elemH,
                fontSize: 11,
                label: f.label,
                value: isNote ? undefined : `{{${f.key}}}`,
                source: isNote ? [] : [f.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: idx,
              }),
            )
            col = (col + 1) % 2
            if (col === 0) curY += elemH + 6
          }
        })
      }
    }

    // Build template object and import into store
    const newTemplate = {
      id: `LBL_${Date.now()}`,
      name: templateName.trim(),
      width: Number(width) || 100,
      height: Number(height) || 150,
      unit: 'mm',
      labelType,
      fields: generatedFields,
      sections: {
        main: {
          enabled: true,
          display: 'block',
          position: 'relative',
          fields: generatedFields,
        },
      },
    }

    const chosenPiece = pieces.find((p) => p.index === selectedPieceIndex) || pieces[0]

    // Apply template to store
    useLabelStore.getState().importTemplate(newTemplate, { markSaved: false })

    // Auto-load OIF data into canvas preview
    if (chosenPiece) {
      loadRealData({
        source: oifFileName,
        pieceIndex: chosenPiece.index,
        totalPieces: pieces.length,
        data: chosenPiece.values,
        pieces,
      })
    }

    addToast({
      message: `Created template "${templateName}" with ${chosenList.length} mapped fields`,
      type: 'success',
    })

    close()
  }

  if (!isOpen) return null

  const chosenPiece = pieces.find((p) => p.index === selectedPieceIndex)
  const pieceSum = chosenPiece ? pieceSummary(chosenPiece) : null

  return createPortal(
    <div className="lc-modal-overlay" onClick={close}>
      <div
        className="lc-modal !max-w-[840px] !h-[88vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Import OIF & Create Template"
      >
        {/* Header */}
        <div className="lc-modal-head">
          <span className="lc-modal-head-icon">
            <FileCode size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="lc-dialog-title">Import Opti Project (.oif) & Create Template</h2>
              <span className="lc-badge lc-badge-opti">Opti Workflow</span>
            </div>
            <p className="mt-0.5 text-[13px] text-[var(--mut)]">
              {step === 1
                ? 'Select an Opti project file to extract piece data, note fields, and configure label size.'
                : 'Choose and map extracted fields to automatically design your label template.'}
            </p>
          </div>
          <button type="button" className="lc-icon-btn" onClick={close} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="lc-modal-body min-h-0 flex-1 overflow-y-auto p-5">
          {step === 1 ? (
            <div className="space-y-6">
              {/* 1. File Upload */}
              <div>
                <label className="lc-label mb-2 block">1. Select Opti Project File (.oif)</label>
                <div className="lc-card flex items-center justify-between gap-3 p-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[8px] bg-[var(--pri-s)] text-[var(--pri)]">
                      <FileCode size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-bold text-[var(--tx)]">
                        {oifFileName || 'No .oif file selected'}
                      </p>
                      <p className="text-[12px] text-[var(--mut)]">
                        {pieces.length
                          ? `${pieces.length} pieces found · ${extractedData.pieceFields.length} piece fields · ${extractedData.noteFields.filter((n) => n.sample).length} active note slots`
                          : 'Compatible with all Opti .oif project files and JSON variants.'}
                      </p>
                    </div>
                  </div>

                  <label className="lc-btn lc-btn-secondary flex-none !h-9 cursor-pointer">
                    <FolderOpen size={14} />
                    <span>Browse OIF…</span>
                    <input
                      type="file"
                      accept=".oif,.json,application/json"
                      className="hidden"
                      onChange={(e) => {
                        onSelectFile(e.target.files?.[0])
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>

                {error && (
                  <div className="lc-msg lc-msg-err mt-3">
                    <TriangleAlert size={15} className="flex-none" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Piece preview summary if file loaded */}
              {pieces.length > 0 && (
                <div className="rounded-[10px] border border-[var(--line)] bg-[var(--bg)] p-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                    <div className="flex items-center gap-2">
                      <Eye size={15} className="text-[var(--pri)]" />
                      <span className="text-[12.5px] font-bold text-[var(--tx)]">
                        Previewing Sample Piece ({selectedPieceIndex} of {pieces.length})
                      </span>
                    </div>
                    <select
                      aria-label="Select piece preview"
                      value={selectedPieceIndex}
                      onChange={(e) => setSelectedPieceIndex(Number(e.target.value))}
                      className="lc-select !h-7 !py-0 !text-[11.5px] !w-[120px]"
                    >
                      {pieces.slice(0, 50).map((p) => (
                        <option key={p.index} value={p.index}>
                          Piece {p.index}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2.5 text-[12px]">
                    <div>
                      <span className="text-[var(--mut)] block">Dimensions:</span>
                      <strong className="text-[var(--tx)]">{pieceSum?.size || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[var(--mut)] block">Customer / PO:</span>
                      <strong className="text-[var(--tx)] truncate block" title={pieceSum?.custPo}>
                        {pieceSum?.custPo || chosenPiece?.values?.customerName || '—'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[var(--mut)] block">Order #:</span>
                      <strong className="text-[var(--tx)]">{chosenPiece?.values?.orderNumber || '—'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Template Info & Size */}
              <div>
                <label className="lc-label mb-1.5 block" htmlFor="oif-tpl-name">
                  2. Template Name
                </label>
                <input
                  id="oif-tpl-name"
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Production Label — Batch 1445"
                  className="lc-input !h-10"
                />
              </div>

              {/* Size preset selection */}
              <div>
                <label className="lc-label mb-2 block">3. Label Size & Type</label>
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {SIZES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectPreset(s)}
                      className={`flex flex-col items-center justify-center p-2 rounded-[8px] border text-center transition-colors ${
                        selectedSizeId === s.id
                          ? 'border-[var(--pri)] bg-[var(--pri-s)] text-[var(--pri)] font-bold'
                          : 'border-[var(--line)] bg-[var(--panel)] text-[var(--tx-2)] hover:border-[var(--mut)]'
                      }`}
                    >
                      <span className="text-[11.5px] leading-tight">{s.label}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="lc-label mb-1 block" htmlFor="oif-tpl-w">
                      Width (mm)
                    </label>
                    <input
                      id="oif-tpl-w"
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="lc-input !h-9"
                    />
                  </div>
                  <div>
                    <label className="lc-label mb-1 block" htmlFor="oif-tpl-h">
                      Height (mm)
                    </label>
                    <input
                      id="oif-tpl-h"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="lc-input !h-9"
                    />
                  </div>
                  <div>
                    <label className="lc-label mb-1 block">Label Type</label>
                    <div className="lc-segment !h-9">
                      <button
                        type="button"
                        className={labelType === 'production' ? 'is-on' : ''}
                        onClick={() => setLabelType('production')}
                      >
                        Production
                      </button>
                      <button
                        type="button"
                        className={labelType === 'offcut' ? 'is-on' : ''}
                        onClick={() => setLabelType('offcut')}
                      >
                        Offcut
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Step 2: Mapping configuration */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--line)] bg-[var(--panel-2)] p-3">
                <div className="flex items-center gap-2">
                  <Settings2 size={16} className="text-[var(--pri)]" />
                  <span className="text-[13px] font-bold text-[var(--tx)]">Layout Arrangement</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[var(--mut)]">Auto-arrange:</span>
                  <div className="lc-segment !w-[220px] !h-8">
                    <button
                      type="button"
                      className={layoutStyle === 'grid' ? 'is-on' : ''}
                      onClick={() => setLayoutStyle('grid')}
                      title="2-Column balanced grid"
                    >
                      2-Col Grid
                    </button>
                    <button
                      type="button"
                      className={layoutStyle === 'column' ? 'is-on' : ''}
                      onClick={() => setLayoutStyle('column')}
                      title="Single vertical stack"
                    >
                      Single Col
                    </button>
                    <button
                      type="button"
                      className={layoutStyle === 'blank' ? 'is-on' : ''}
                      onClick={() => setLayoutStyle('blank')}
                      title="Create blank canvas with fields in sidebar"
                    >
                      Blank
                    </button>
                  </div>
                </div>
              </div>

              {/* Field Filter and Tabs */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  {[
                    { id: 'all', label: `All (${allAvailableFields.length})` },
                    { id: 'piece', label: `Piece Fields (${extractedData.pieceFields.length})` },
                    {
                      id: 'note',
                      label: `Note Slots (${extractedData.noteFields.filter((n) => n.sample).length} active)`,
                    },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`rounded-[6px] px-2.5 py-1 text-[12px] font-semibold transition-colors ${
                        activeTab === t.id
                          ? 'bg-[var(--pri)] text-white'
                          : 'bg-[var(--bg)] text-[var(--tx-2)] hover:bg-[var(--line)]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-[220px]">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--mut)]"
                  />
                  <input
                    type="search"
                    placeholder="Search fields or sample…"
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    className="lc-input !h-8 !pl-8 !text-[12px]"
                  />
                </div>
              </div>

              {/* Bulk selection action bar */}
              <div className="flex items-center justify-between px-1 text-[12px] text-[var(--mut)]">
                <span>
                  <strong>{selectedFieldKeys.size}</strong> of {allAvailableFields.length} fields selected to place on
                  template
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(filteredFields)}
                    className="lc-link text-[12px] font-semibold"
                  >
                    {filteredFields.every((f) => selectedFieldKeys.has(f.key)) ? 'Deselect in view' : 'Select all in view'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFieldKeys(new Set())}
                    className="lc-link !text-[var(--mut)] text-[12px]"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {/* Fields Table */}
              <div className="lc-card max-h-[380px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-[var(--panel)] border-b border-[var(--line)] z-10">
                    <tr className="text-[11px] font-bold text-[var(--mut)] uppercase tracking-wider">
                      <th className="w-10 px-3 py-2 text-center">Include</th>
                      <th className="px-3 py-2">Field / Note</th>
                      <th className="px-3 py-2">OIF Key</th>
                      <th className="px-3 py-2">Sample Value</th>
                      <th className="w-36 px-3 py-2">Element Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {filteredFields.map((field) => {
                      const isSelected = selectedFieldKeys.has(field.key)
                      const isNote = field.category === 'note'
                      const currentType = fieldTypes[field.key] || 'text'

                      return (
                        <tr
                          key={field.key}
                          className={`text-[12.5px] transition-colors ${
                            isSelected ? 'bg-[var(--pri-s)]/40 hover:bg-[var(--pri-s)]/60' : 'hover:bg-[var(--bg)]'
                          }`}
                        >
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleField(field.key)}
                              className="text-[var(--pri)] inline-flex items-center justify-center"
                              title={isSelected ? 'Remove field' : 'Add field'}
                            >
                              {isSelected ? <CheckSquare size={16} /> : <Square size={16} className="text-[var(--mut)]" />}
                            </button>
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-semibold text-[var(--tx)] block">{field.label}</span>
                            <span className="text-[10.5px] text-[var(--mut)] flex items-center gap-1.5">
                              <span className={`lc-badge !h-4 !px-1.5 !text-[10px] ${isNote ? 'lc-badge-warn' : 'lc-badge-opti'}`}>
                                {isNote ? 'Note slot' : 'Piece'}
                              </span>
                              {field.totalSamples > 1 && `${field.totalSamples} distinct values in project`}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] text-[var(--mut)]">{field.key}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`truncate max-w-[200px] block ${
                                field.sample ? 'text-[var(--tx-2)]' : 'text-[var(--mut)] italic'
                              }`}
                              title={field.sample || 'No value in loaded pieces'}
                            >
                              {field.sample || '— empty slot —'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              aria-label={`Element type for ${field.label}`}
                              value={currentType}
                              disabled={!isSelected}
                              onChange={(e) => setTypeForField(field.key, e.target.value)}
                              className="lc-select !h-7 !py-0 !text-[11.5px] disabled:opacity-50"
                            >
                              <option value="text">Text label</option>
                              <option value="header">Large Header</option>
                              <option value="barcode">Barcode (Code 128)</option>
                              <option value="qrcode">QR Code</option>
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredFields.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[13px] text-[var(--mut)]">
                          No fields matching &quot;{fieldSearch}&quot;
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="lc-modal-foot">
          {step === 1 ? (
            <>
              <button type="button" onClick={close} className="lc-btn lc-btn-secondary !h-10">
                Cancel
              </button>
              <button
                type="button"
                disabled={pieces.length === 0 || !templateName.trim()}
                onClick={() => setStep(2)}
                className="lc-btn lc-btn-primary !h-10"
              >
                <span>Next: Map & Extract Fields</span>
                <ArrowRight size={15} />
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setStep(1)} className="lc-btn lc-btn-secondary !h-10">
                Back to Details
              </button>
              <button type="button" onClick={handleGenerateTemplate} className="lc-btn lc-btn-primary !h-10">
                <Sparkles size={15} />
                <span>Create Label Template ({selectedFieldKeys.size} fields)</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

