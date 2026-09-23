/** Same N{note}F{sub} placeholders Opti’s Labels editor uses on the canvas. */
export function buildSampleNotes(maxNotes = 10, maxFields = 15) {
  const notes = {}
  for (let n = 1; n <= maxNotes; n++) {
    notes[`note${n}`] = {}
    for (let f = 1; f <= maxFields; f++) {
      notes[`note${n}`][`field${f}`] = `N${n}F${f}`
    }
  }
  return notes
}

const SAMPLE_NOTES = buildSampleNotes()

/** Opti-shaped piece preview bag — named fields match Labels editor sample data. */
export const OPTI_SAMPLE = {
  customerName: 'Sample Customer',
  batchNumber: '120011200011',
  orderNumber: '20025-1',
  sheetCount: '3 / 12',
  pieceDescription: '6mm Clear Float',
  area: '6.00 m²',
  weight: '25.4 kg',
  services: 'SERVICE-A',
  id: 'PIECE-001',
  pickupDate: '2024-01-01',
  transportType: 'SITE',
  custPO: 'PO-12345',
  marks: 'FRONT',
  Barcode: '21487955956',
  barcode: '21487955956',
  salesID: 'SALE-20025',
  optiNo: 'OPT-001',
  BatchNo: 'BATCH-001',
  BatchNum: '74519',
  thickness: '6mm',
  glassCode: '6CFL',
  GlassFam: 'FLOAT',
  pieceSheet: '5->1',
  globalPieceNo: 5,
  printedAt: new Date().toLocaleString(),
  machines: 'CUT > EDG > TEM',
  Dimensions: '2000x3000',
  width: '2000',
  height: '3000',
  ...SAMPLE_NOTES,
}

/** Fill missing noteN.fieldM keys so mapped headers preview like Opti. Live piece notes win. */
export function mergeOptiPreviewData(data = {}) {
  const out = { ...OPTI_SAMPLE, ...data }
  for (const key of Object.keys(SAMPLE_NOTES)) {
    const incoming = data?.[key]
    if (incoming && typeof incoming === 'object' && !Array.isArray(incoming)) {
      out[key] = { ...SAMPLE_NOTES[key], ...incoming }
    } else if (incoming == null || incoming === '') {
      out[key] = { ...SAMPLE_NOTES[key] }
    }
  }
  return out
}

/** ERP metro-style preview bag */
export const ERP_SAMPLE = {
  OrderNo: 'ORD-99201',
  CustOrderNo: 'PO-4412',
  JobDescription: '6mm Toughened Clear',
  Dimensions: '1200 x 800',
  GlassSpec: '6mm TGH Clear',
  MarkAs: 'FRONT',
  DeliveryDate: '2026-09-15',
  Sqm: '0.96',
  LineRef: 'L-12',
  Route: 'R2',
  WeightKg: '14.4',
  Barcode: 'ORD-99201-12',
  barcode: 'ORD-99201-12',
  ProcessNotes: ['Cut', 'Polish', 'Temper'],
}
