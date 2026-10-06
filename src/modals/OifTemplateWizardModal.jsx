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
  Palette,
  Layout,
  Grid,
  Columns,
  Minus,
} from 'lucide-react'
import { useLabelStore } from '../store/labelStore'
import { parseOifText, extractOifDataFields, pieceSummary } from '../utils/oifParser'
import {
  createTextField,
  createHeaderField,
  createBarcodeField,
  createQrField,
  createLineField,
  createRectField,
  createBlackBoxTextField,
} from '../elements/factories'
import { toMm } from '../utils/units'
import { StylePreviewCard } from './StylePreviewCard'

const SIZES = [
  { id: '100x150', w: 100, h: 150, label: '100 × 150 mm' },
  { id: '100x111', w: 100, h: 111, label: '100 × 111 mm' },
  { id: '100x60', w: 100, h: 60, label: '100 × 60 mm' },
  { id: '100x50', w: 100, h: 50, label: '100 × 50 mm' },
  { id: '90x43', w: 90, h: 43, label: '90 × 43 mm · Opti' },
  { id: '4x6in', w: 102, h: 152, label: '4 × 6 in' },
]

export const DESIGN_STYLES = [
  {
    id: 'industrial_pro',
    name: 'Industrial Executive',
    subtitle: 'High contrast headers, dark black-box badge, barcode & dividers',
    tag: 'Recommended',
    accent: '#0f172a',
    desc: 'Top route & order header, sleek black highlight box for urgent rack sequences, prominent central barcode, and neat 2-column piece specifications.',
  },
  {
    id: 'modern_card',
    name: 'Modern Framed',
    subtitle: 'Clean outer border, structured sections, dual barcodes & QR',
    tag: 'Clean & Crisp',
    accent: '#2563eb',
    desc: 'Encased in a clean rounded border frame with segmented note sections, dedicated order badges, and scan-ready barcode + QR code.',
  },
  {
    id: 'compact_dense',
    name: 'Production Dense',
    subtitle: 'Optimized 2-column layout for small labels & maximum data',
    tag: 'Space Saver',
    accent: '#059669',
    desc: 'Tight vertical rhythm, compact typography, horizontal dividers, ideal for 100×60mm and smaller labels with many note fields.',
  },
  {
    id: 'minimal_clean',
    name: 'Minimal Stack',
    subtitle: 'Single column sequential layout with generous whitespace',
    tag: 'Simple',
    accent: '#64748b',
    desc: 'Simple vertical flow without heavy decorative borders, easy to read for packaging, dispatch, and quality control.',
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    subtitle: 'Empty template with extracted OIF fields in sidebar',
    tag: 'Manual',
    accent: '#94a3b8',
    desc: 'Starts completely blank with your chosen dimensions, loading all OIF piece and note properties directly into your left components panel.',
  },
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
  const [layoutStyle, setLayoutStyle] = useState('industrial_pro') // 'industrial_pro' | 'modern_card' | 'compact_dense' | 'minimal_clean' | 'blank'

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
      if (layoutStyle === 'minimal_clean') {
        // Minimal Sequential 1-Column Stack
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
          } else if (type === 'barcode' || type === 'qrcode') {
            elementHeight = 46
          }

          if (curY + elementHeight > ph - marginY) {
            curY = marginY
          }

          if (type === 'barcode') {
            generatedFields.push(
              createBarcodeField({
                x: marginX,
                y: curY,
                width: Math.min(220, colWidth),
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
      } else if (layoutStyle === 'modern_card') {
        // Modern Framed style: Outer border + section headers + divider lines
        const contentW = pw - marginX * 2
        // Outer decorative boundary
        generatedFields.push(
          createRectField({
            x: marginX / 2,
            y: marginY / 2,
            width: pw - marginX,
            height: ph - marginY,
            strokeWidth: 2,
            strokeColor: '#0f172a',
            cornerRadius: 4,
            fillEnabled: false,
            label: 'Frame',
            zIndex: 0,
          }),
        )

        let curY = marginY + 4
        // Separate primary header/order fields from detail fields
        const headerFields = chosenList.filter(
          (f) =>
            fieldTypes[f.key] === 'header' ||
            ['ordernumber', 'customername'].includes(f.key.toLowerCase()),
        )
        const barcodeFields = chosenList.filter((f) => fieldTypes[f.key] === 'barcode')
        const detailFields = chosenList.filter(
          (f) => !headerFields.includes(f) && !barcodeFields.includes(f),
        )

        // 1. Header block
        if (headerFields.length > 0) {
          headerFields.forEach((f, idx) => {
            const isNote = f.category === 'note'
            const noteMatch = isNote ? f.key.match(/^note(\d+)\.field(\d+)$/i) : null
            generatedFields.push(
              createHeaderField({
                x: marginX + 4,
                y: curY,
                width: contentW - 8,
                height: 24,
                fontSize: 14,
                fontWeight: 'bold',
                label: f.label,
                value: isNote ? undefined : `{{${f.key}}}`,
                source: isNote ? [] : [f.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: idx + 1,
              }),
            )
            curY += 26
          })
          // Divider
          generatedFields.push(
            createLineField({
              x: marginX + 2,
              y: curY,
              width: contentW - 4,
              height: 2,
              strokeWidth: 1.5,
              strokeColor: '#0f172a',
              zIndex: 10,
            }),
          )
          curY += 6
        }

        // 2. Barcode section
        if (barcodeFields.length > 0) {
          barcodeFields.forEach((f, idx) => {
            const isNote = f.category === 'note'
            const noteMatch = isNote ? f.key.match(/^note(\d+)\.field(\d+)$/i) : null
            generatedFields.push(
              createBarcodeField({
                x: marginX + 4,
                y: curY,
                width: Math.min(220, contentW - 8),
                height: 48,
                label: f.label,
                source: isNote ? [] : [f.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: 20 + idx,
              }),
            )
            curY += 54
          })
          generatedFields.push(
            createLineField({
              x: marginX + 2,
              y: curY,
              width: contentW - 4,
              height: 1,
              strokeWidth: 1,
              strokeColor: '#cbd5e1',
              zIndex: 30,
            }),
          )
          curY += 6
        }

        // 3. Grid for detail / note fields
        const gap = 8
        const colW = (contentW - 8 - gap) / 2
        let col = 0
        detailFields.forEach((f, idx) => {
          const type = fieldTypes[f.key] || 'text'
          const isNote = f.category === 'note'
          const noteMatch = isNote ? f.key.match(/^note(\d+)\.field(\d+)$/i) : null
          const elemX = marginX + 4 + col * (colW + gap)

          if (type === 'qrcode') {
            generatedFields.push(
              createQrField({
                x: elemX,
                y: curY,
                width: 44,
                height: 44,
                label: f.label,
                source: isNote ? [] : [f.key],
                zIndex: 40 + idx,
              }),
            )
            col = (col + 1) % 2
            if (col === 0) curY += 48
          } else {
            generatedFields.push(
              createTextField({
                x: elemX,
                y: curY,
                width: colW,
                height: 20,
                fontSize: 10.5,
                label: f.label,
                value: isNote ? undefined : `{{${f.key}}}`,
                source: isNote ? [] : [f.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: 40 + idx,
              }),
            )
            col = (col + 1) % 2
            if (col === 0) curY += 24
          }
        })
      } else if (layoutStyle === 'compact_dense') {
        // Production Dense: small line heights, high efficiency 2-col packing
        let curY = marginY
        const gap = 6
        const colW = (pw - marginX * 2 - gap) / 2
        let col = 0

        chosenList.forEach((f, idx) => {
          const type = fieldTypes[f.key] || 'text'
          const isNote = f.category === 'note'
          const noteMatch = isNote ? f.key.match(/^note(\d+)\.field(\d+)$/i) : null
          const isFull = type === 'barcode' || type === 'header'

          if (isFull && col !== 0) {
            curY += 22
            col = 0
          }

          const elemX = isFull ? marginX : marginX + col * (colW + gap)
          const elemW = isFull ? pw - marginX * 2 : colW
          const elemH = type === 'barcode' ? 42 : type === 'qrcode' ? 38 : type === 'header' ? 22 : 18

          if (type === 'barcode') {
            generatedFields.push(
              createBarcodeField({
                x: elemX,
                y: curY,
                width: Math.min(190, elemW),
                height: elemH,
                label: f.label,
                source: isNote ? [] : [f.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: idx,
              }),
            )
            curY += elemH + 4
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
            if (col === 0) curY += elemH + 4
          } else if (type === 'header') {
            generatedFields.push(
              createHeaderField({
                x: elemX,
                y: curY,
                width: elemW,
                height: elemH,
                fontSize: 12.5,
                label: f.label,
                value: isNote ? undefined : `{{${f.key}}}`,
                source: isNote ? [] : [f.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: idx,
              }),
            )
            curY += elemH + 4
            col = 0
          } else {
            generatedFields.push(
              createTextField({
                x: elemX,
                y: curY,
                width: elemW,
                height: elemH,
                fontSize: 10,
                label: f.label,
                value: isNote ? undefined : `{{${f.key}}}`,
                source: isNote ? [] : [f.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: idx,
              }),
            )
            col = (col + 1) % 2
            if (col === 0) curY += elemH + 4
          }
        })
      } else {
        // Default: Industrial Executive (high contrast, black-box badge, barcode, and balanced split)
        const contentW = pw - marginX * 2
        let curY = marginY

        // 1. Top Order / Route Header
        const orderField = chosenList.find(
          (f) => f.key.toLowerCase().includes('order') || f.key.toLowerCase().includes('id'),
        )
        const customerField = chosenList.find((f) => f.key.toLowerCase().includes('customer'))

        if (orderField || customerField) {
          if (orderField) {
            const isNote = orderField.category === 'note'
            const noteMatch = isNote ? orderField.key.match(/^note(\d+)\.field(\d+)$/i) : null
            generatedFields.push(
              createHeaderField({
                x: marginX,
                y: curY,
                width: Math.floor(contentW * 0.55),
                height: 28,
                fontSize: 16,
                fontWeight: 'bold',
                label: orderField.label,
                value: isNote ? undefined : `{{${orderField.key}}}`,
                source: isNote ? [] : [orderField.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: 1,
              }),
            )
          }
          if (customerField) {
            const isNote = customerField.category === 'note'
            const noteMatch = isNote ? customerField.key.match(/^note(\d+)\.field(\d+)$/i) : null
            generatedFields.push(
              createHeaderField({
                x: marginX + Math.floor(contentW * 0.55) + 6,
                y: curY,
                width: Math.floor(contentW * 0.45) - 6,
                height: 28,
                fontSize: 13,
                fontWeight: 'bold',
                textAlign: 'right',
                label: customerField.label,
                value: isNote ? undefined : `{{${customerField.key}}}`,
                source: isNote ? [] : [customerField.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: 2,
              }),
            )
          }
          curY += 32
        }

        // 2. High-impact Black Box Badge (e.g. rack sequence or note2.field10)
        const badgeCandidate = chosenList.find(
          (f) =>
            f.key.toLowerCase().includes('rack') ||
            f.key.toLowerCase().includes('sequence') ||
            (f.category === 'note' && f.subField === 10),
        )
        if (badgeCandidate) {
          const isNote = badgeCandidate.category === 'note'
          const noteMatch = isNote ? badgeCandidate.key.match(/^note(\d+)\.field(\d+)$/i) : null
          generatedFields.push(
            createBlackBoxTextField({
              x: marginX,
              y: curY,
              width: contentW,
              height: 24,
              fontSize: 12,
              fontWeight: 'bold',
              textAlign: 'center',
              label: badgeCandidate.label,
              value: isNote ? undefined : `{{${badgeCandidate.key}}}`,
              fallbackValue: badgeCandidate.sample || 'PRODUCTION',
              source: isNote ? [] : [badgeCandidate.key],
              noteField: noteMatch ? Number(noteMatch[1]) : 0,
              subField: noteMatch ? Number(noteMatch[2]) : 0,
              zIndex: 3,
            }),
          )
          curY += 30
        }

        // 3. Central Barcode
        const barcodeField =
          chosenList.find((f) => fieldTypes[f.key] === 'barcode') ||
          chosenList.find((f) => f.key.toLowerCase().includes('barcode') || f.key === 'id')

        if (barcodeField) {
          const isNote = barcodeField.category === 'note'
          const noteMatch = isNote ? barcodeField.key.match(/^note(\d+)\.field(\d+)$/i) : null
          generatedFields.push(
            createBarcodeField({
              x: marginX,
              y: curY,
              width: Math.min(240, contentW),
              height: 48,
              label: barcodeField.label,
              source: isNote ? [] : [barcodeField.key],
              noteField: noteMatch ? Number(noteMatch[1]) : 0,
              subField: noteMatch ? Number(noteMatch[2]) : 0,
              zIndex: 4,
            }),
          )
          curY += 54
        }

        // 4. Horizontal crisp divider line
        generatedFields.push(
          createLineField({
            x: marginX,
            y: curY,
            width: contentW,
            height: 2,
            strokeWidth: 2,
            strokeColor: '#000000',
            zIndex: 5,
          }),
        )
        curY += 8

        // 5. Remaining specification fields in balanced 2-column layout
        const placedKeys = new Set(
          [orderField?.key, customerField?.key, badgeCandidate?.key, barcodeField?.key].filter(
            Boolean,
          ),
        )
        const remaining = chosenList.filter((f) => !placedKeys.has(f.key))
        const gap = 10
        const colW = (contentW - gap) / 2
        let col = 0

        remaining.forEach((f, idx) => {
          const type = fieldTypes[f.key] || 'text'
          const isNote = f.category === 'note'
          const noteMatch = isNote ? f.key.match(/^note(\d+)\.field(\d+)$/i) : null
          const elemX = marginX + col * (colW + gap)

          if (type === 'qrcode') {
            generatedFields.push(
              createQrField({
                x: elemX,
                y: curY,
                width: 44,
                height: 44,
                label: f.label,
                source: isNote ? [] : [f.key],
                zIndex: 10 + idx,
              }),
            )
            col = (col + 1) % 2
            if (col === 0) curY += 48
          } else {
            generatedFields.push(
              createTextField({
                x: elemX,
                y: curY,
                width: colW,
                height: 20,
                fontSize: 10.5,
                fontWeight: f.label.toLowerCase().includes('size') || f.label.toLowerCase().includes('dim') ? 'bold' : 'normal',
                label: f.label,
                value: isNote ? undefined : `{{${f.key}}}`,
                source: isNote ? [] : [f.key],
                noteField: noteMatch ? Number(noteMatch[1]) : 0,
                subField: noteMatch ? Number(noteMatch[2]) : 0,
                zIndex: 10 + idx,
              }),
            )
            col = (col + 1) % 2
            if (col === 0) curY += 24
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

              {/* 2. Template Info */}
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

              {/* 3. Professional Design Styles & Structure Drafts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="lc-label !mb-0 flex items-center gap-1.5">
                    <Palette size={14} className="text-[var(--pri)]" />
                    <span>3. Choose Design Style & Layout Structure</span>
                  </label>
                  <span className="text-[11.5px] text-[var(--mut)]">Select draft template style</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {DESIGN_STYLES.map((ds) => {
                    const isSelected = layoutStyle === ds.id
                    return (
                      <div
                        key={ds.id}
                        onClick={() => setLayoutStyle(ds.id)}
                        className={`group cursor-pointer rounded-xl border p-2.5 transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-[var(--pri)] bg-[var(--pri-s)] shadow-md ring-2 ring-[var(--pri)]/40'
                            : 'border-[var(--line)] bg-[var(--panel)] hover:border-[var(--pri)]/60 hover:bg-[var(--bg)] hover:shadow-xs'
                        }`}
                      >
                        <div>
                          {/* Title & Tag */}
                          <div className="flex items-center justify-between gap-1.5 pb-2">
                            <span className="text-[13px] font-bold text-[var(--tx)] flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full flex-none"
                                style={{ backgroundColor: ds.accent }}
                              />
                              {ds.name}
                            </span>
                            <span
                              className={`lc-badge !h-4.5 !px-2 !text-[9.5px] font-bold ${
                                isSelected ? 'lc-badge-opti !bg-[var(--pri)] !text-white' : 'lc-badge-erp'
                              }`}
                            >
                              {ds.tag}
                            </span>
                          </div>

                          {/* Visual Miniature Label Preview */}
                          <div className="my-1.5">
                            <StylePreviewCard styleId={ds.id} accent={ds.accent} />
                          </div>

                          {/* Concise 1-line summary */}
                          <p className="text-[11px] font-medium text-[var(--mut)] leading-tight mt-1 line-clamp-1">
                            {ds.subtitle}
                          </p>
                        </div>

                        {/* Card Footer Selection state */}
                        <div className="mt-2 pt-2 border-t border-[var(--line)] flex items-center justify-between text-[11px]">
                          <span className="text-[var(--mut)] font-medium">
                            {ds.id === 'blank'
                              ? 'Manual'
                              : ds.id === 'minimal_clean'
                              ? '1-Col Flow'
                              : 'Structured'}
                          </span>
                          <span
                            className={`font-bold flex items-center gap-1 ${
                              isSelected ? 'text-[var(--pri)]' : 'text-[var(--mut)] group-hover:text-[var(--tx)]'
                            }`}
                          >
                            {isSelected && <Check size={13} />}
                            {isSelected ? 'Selected' : 'Use style'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 4. Label Size & Type */}
              <div>
                <label className="lc-label mb-2 block">4. Label Size & Type</label>
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
                  <Palette size={16} className="text-[var(--pri)]" />
                  <span className="text-[13px] font-bold text-[var(--tx)]">Selected Style:</span>
                  <span className="text-[12.5px] font-semibold text-[var(--pri)]">
                    {DESIGN_STYLES.find((d) => d.id === layoutStyle)?.name || 'Custom'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[var(--mut)]">Switch layout:</span>
                  <div className="lc-segment !h-8">
                    {DESIGN_STYLES.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className={layoutStyle === d.id ? 'is-on' : ''}
                        onClick={() => setLayoutStyle(d.id)}
                        title={d.subtitle}
                      >
                        {d.name.split(' ')[0]}
                      </button>
                    ))}
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

