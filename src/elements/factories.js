function uid(prefix) {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`
  return `${prefix}_${id}`
}

const FONT = 'Inter, sans-serif'

export function createTextField(overrides = {}) {
  const fieldKey = overrides.fieldKey || uid('text')
  return {
    fieldKey,
    editableField: fieldKey,
    type: 'text',
    label: 'Text',
    source: [fieldKey],
    fallbackValue: '',
    x: 10,
    y: 10,
    width: 150,
    height: 20,
    fontSize: 12,
    fontFamily: FONT,
    fontWeight: 'normal',
    textAlign: 'left',
    color: '#000000',
    blackBox: false,
    isBlackBox: false,
    noteField: 0,
    subField: 0,
    position: 'absolute',
    rotation: 0,
    zIndex: 0,
    locked: false,
    hidden: false,
    ...overrides,
    fieldKey: overrides.fieldKey || fieldKey,
  }
}

export function createHeaderField(overrides = {}) {
  const fieldKey = overrides.fieldKey || uid('header')
  return {
    fieldKey,
    editableField: fieldKey,
    type: 'header',
    label: 'Header',
    source: [fieldKey],
    fallbackValue: 'Header Text',
    x: 10,
    y: 10,
    width: 200,
    height: 28,
    fontSize: 16,
    fontFamily: FONT,
    color: '#000000',
    textAlign: 'center',
    fontWeight: 'bold',
    blackBox: false,
    isBlackBox: false,
    noteField: 0,
    subField: 0,
    position: 'absolute',
    rotation: 0,
    zIndex: 0,
    locked: false,
    hidden: false,
    ...overrides,
    fieldKey: overrides.fieldKey || fieldKey,
    type: 'header',
  }
}

export function createBlackBoxTextField(overrides = {}) {
  return createHeaderField({
    label: 'Black Box',
    value: '{{orderNumber}}',
    color: '#ffffff',
    blackBox: true,
    isBlackBox: true,
    fontWeight: 'bold',
    textAlign: 'center',
    ...overrides,
  })
}

export function createBarcodeField(overrides = {}) {
  const fieldKey = overrides.fieldKey || uid('barcode')
  return {
    fieldKey,
    editableField: fieldKey,
    type: 'barcode',
    label: 'Barcode',
    source: ['Barcode', 'barcode'],
    fallbackValue: '123456789012',
    x: 10,
    y: 10,
    width: 120,
    height: 26,
    fontSize: 8,
    fontWeight: 'normal',
    displayValue: true,
    barcodeFormat: 'CODE128',
    noteField: 0,
    subField: 0,
    position: 'absolute',
    rotation: 0,
    zIndex: 0,
    locked: false,
    hidden: false,
    ...overrides,
    fieldKey: overrides.fieldKey || fieldKey,
  }
}

export function createQrField(overrides = {}) {
  const fieldKey = overrides.fieldKey || uid('qrcode')
  return {
    fieldKey,
    editableField: fieldKey,
    type: 'qrcode',
    label: 'QR Code',
    x: 10,
    y: 10,
    width: 150,
    height: 150,
    value: 'https://example.com',
    fallbackValue: 'https://spil.labs',
    qrEcc: 'M',
    noteField: 0,
    subField: 0,
    position: 'absolute',
    rotation: 0,
    zIndex: 0,
    locked: false,
    hidden: false,
    ...overrides,
    fieldKey: overrides.fieldKey || fieldKey,
  }
}

export function createRectField(overrides = {}) {
  const fieldKey = overrides.fieldKey || uid('shape')
  return {
    fieldKey,
    editableField: fieldKey,
    type: 'shape',
    shapeType: 'rect',
    label: 'Shape',
    x: 10,
    y: 10,
    width: 150,
    height: 150,
    strokeColor: '#000000',
    strokeWidth: 2,
    fillEnabled: false,
    fillColor: '#ffffff',
    cornerRadius: 0,
    position: 'absolute',
    rotation: 0,
    zIndex: 0,
    locked: false,
    hidden: false,
    ...overrides,
    fieldKey: overrides.fieldKey || fieldKey,
  }
}

export function createRoundedRectField(overrides = {}) {
  return createRectField({
    shapeType: 'roundRect',
    label: 'Rounded Rect',
    cornerRadius: 8,
    ...overrides,
  })
}

export function createEllipseField(overrides = {}) {
  return createRectField({
    shapeType: 'ellipse',
    label: 'Ellipse',
    ...overrides,
  })
}

export function createLineField(overrides = {}) {
  const fieldKey = overrides.fieldKey || uid('line')
  return {
    fieldKey,
    editableField: fieldKey,
    type: 'line',
    label: 'Line',
    x: 10,
    y: 10,
    width: 150,
    height: 2,
    strokeColor: '#000000',
    strokeWidth: 2,
    dashStyle: 'solid',
    arrowEnd: false,
    position: 'absolute',
    rotation: 0,
    zIndex: 0,
    locked: false,
    hidden: false,
    ...overrides,
    fieldKey: overrides.fieldKey || fieldKey,
  }
}

export function createImageField(overrides = {}) {
  const fieldKey = overrides.fieldKey || uid('image')
  return {
    fieldKey,
    editableField: fieldKey,
    type: 'image',
    label: 'Image',
    src: '',
    x: 10,
    y: 10,
    width: 80,
    height: 60,
    keepAspectRatio: true,
    position: 'absolute',
    rotation: 0,
    zIndex: 0,
    locked: false,
    hidden: false,
    ...overrides,
    fieldKey: overrides.fieldKey || fieldKey,
  }
}

export function createDxfShapeField(overrides = {}) {
  const fieldKey = overrides.fieldKey || uid('shape')
  return {
    fieldKey,
    editableField: fieldKey,
    type: 'shape',
    shapeType: 'dxf',
    label: 'Shape',
    x: 10,
    y: 10,
    width: 200,
    height: 150,
    strokeColor: '#000000',
    strokeWidth: 2,
    fillEnabled: false,
    fillColor: '#ffffff',
    hideEdgeLabels: false,
    showOrientation: true,
    preserveAspectRatio: true,
    isDxfViewport: true,
    dxfShape: [],
    position: 'absolute',
    rotation: 0,
    zIndex: 0,
    locked: false,
    hidden: false,
    ...overrides,
    fieldKey: overrides.fieldKey || fieldKey,
    shapeType: 'dxf',
  }
}

export function createTableField(overrides = {}) {
  const fieldKey = overrides.fieldKey || uid('table')
  return {
    fieldKey,
    editableField: fieldKey,
    type: 'table',
    label: 'Process Table',
    x: 10,
    y: 10,
    width: 200,
    height: 80,
    columns: ['Step', 'Status'],
    rows: [['Cut', '✓'], ['Polish', '✓'], ['Temper', '']],
    fontSize: 9,
    rotation: 0,
    zIndex: 0,
    locked: false,
    hidden: false,
    ...overrides,
    fieldKey: overrides.fieldKey || fieldKey,
  }
}
