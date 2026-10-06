function uid(prefix) {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`
  return `${prefix}_${id}`
}

const FONT = 'Segoe UI, sans-serif'

export function createTextField(overrides = {}) {
  const fieldKey = overrides.fieldKey || uid('text')
  return {
    fieldKey,
    editableField: fieldKey,
    type: 'text',
    label: 'Text',
    source: [fieldKey],
    value: overrides.value !== undefined ? overrides.value : 'Sample Text',
    fallbackValue: overrides.fallbackValue !== undefined ? overrides.fallbackValue : 'Sample Text',
    x: 10,
    y: 10,
    width: 150,
    height: 20,
    fontSize: 11,
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
    value: overrides.value !== undefined ? overrides.value : 'Header Text',
    fallbackValue: overrides.fallbackValue !== undefined ? overrides.fallbackValue : 'Header Text',
    x: 10,
    y: 10,
    width: 160,
    height: 28,
    fontSize: 16,
    fontFamily: FONT,
    color: '#000000',
    textAlign: 'left',
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

export function createCheckboxField(overrides = {}) {
  const fieldKey = overrides.fieldKey || uid('checkbox')
  return {
    fieldKey,
    editableField: fieldKey,
    type: 'checkbox',
    label: 'Checkbox',
    x: 10,
    y: 10,
    width: 24,
    height: 16,
    noteField: 0,
    subField: 0,
    position: 'absolute',
    rotation: 0,
    zIndex: 0,
    locked: false,
    hidden: false,
    ...overrides,
    fieldKey: overrides.fieldKey || fieldKey,
    type: 'checkbox',
  }
}

export function createBlackBoxTextField(overrides = {}) {
  return createHeaderField({
    label: 'Black Box',
    value: overrides.value || 'N2F10',
    fallbackValue: overrides.fallbackValue || 'N2F10',
    color: '#ffffff',
    blackBox: true,
    isBlackBox: true,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 160,
    height: 22,
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
    value: overrides.value || '123456789012',
    fallbackValue: overrides.fallbackValue || '123456789012',
    source: ['Barcode', 'barcode'],
    x: 10,
    y: 10,
    width: 140,
    height: 48,
    fontSize: 10,
    fontWeight: 'normal',
    displayValue: true,
    barcodeFormat: 'CODE128',
    barWidth: 2,
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
    width: 48,
    height: 48,
    value: overrides.value || 'https://spil-labs.com',
    fallbackValue: overrides.fallbackValue || 'https://spil-labs.com',
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
    label: overrides.label || 'MS GLASS',
    src: overrides.src || '',
    x: 10,
    y: 10,
    width: 120,
    height: 36,
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
    label: overrides.label || 'Shape',
    x: 10,
    y: 10,
    width: 130,
    height: 80,
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
