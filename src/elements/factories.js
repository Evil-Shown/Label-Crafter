let _id = 0
const uid = (prefix) => `${prefix}_${Date.now()}_${++_id}`

export function createTextField(overrides = {}) {
  return {
    fieldKey: uid('text'),
    type: 'text',
    label: 'Text Field',
    x: 20,
    y: 20,
    width: 140,
    height: 28,
    value: 'Sample text',
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'normal',
    textAlign: 'left',
    color: '#000000',
    rotation: 0,
    zIndex: 0,
    ...overrides,
  }
}

export function createHeaderField(overrides = {}) {
  return {
    fieldKey: uid('header'),
    type: 'text',
    label: 'Header',
    x: 20,
    y: 10,
    width: 220,
    height: 32,
    value: '{{orderNumber}}',
    fontSize: 18,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    textAlign: 'left',
    color: '#000000',
    rotation: 0,
    zIndex: 0,
    ...overrides,
  }
}

export function createBarcodeField(overrides = {}) {
  return {
    fieldKey: uid('barcode'),
    type: 'barcode',
    label: 'Barcode',
    x: 20,
    y: 55,
    width: 180,
    height: 48,
    source: ['Barcode', 'barcode'],
    fallbackValue: '000000000',
    displayValue: true,
    rotation: 0,
    zIndex: 0,
    ...overrides,
  }
}

export function createQrField(overrides = {}) {
  return {
    fieldKey: uid('qrcode'),
    type: 'qrcode',
    label: 'QR Code',
    x: 20,
    y: 110,
    width: 64,
    height: 64,
    source: ['Barcode', 'barcode'],
    fallbackValue: 'https://spil.labs',
    rotation: 0,
    zIndex: 0,
    ...overrides,
  }
}

export function createRectField(overrides = {}) {
  return {
    fieldKey: uid('shape'),
    type: 'shape',
    shapeType: 'rect',
    label: 'Rectangle',
    x: 50,
    y: 50,
    width: 100,
    height: 60,
    strokeColor: '#000000',
    strokeWidth: 2,
    fillEnabled: false,
    fillColor: '#000000',
    rotation: 0,
    zIndex: 0,
    ...overrides,
  }
}

export function createLineField(overrides = {}) {
  return {
    fieldKey: uid('line'),
    type: 'line',
    label: 'Line',
    x: 20,
    y: 45,
    width: 150,
    height: 2,
    strokeColor: '#000000',
    strokeWidth: 2,
    rotation: 0,
    zIndex: 0,
    ...overrides,
  }
}

export function createImageField(overrides = {}) {
  return {
    fieldKey: uid('image'),
    type: 'image',
    label: 'Logo/Image',
    x: 20,
    y: 20,
    width: 64,
    height: 64,
    src: '',
    rotation: 0,
    zIndex: 0,
    ...overrides,
  }
}

export function createDxfShapeField(overrides = {}) {
  return {
    fieldKey: uid('dxf'),
    type: 'shape',
    shapeType: 'dxf',
    label: 'DXF Viewport',
    x: 30,
    y: 30,
    width: 180,
    height: 120,
    strokeColor: '#000000',
    strokeWidth: 2,
    hideEdgeLabels: false,
    fillEnabled: false,
    rotation: 0,
    zIndex: 0,
    ...overrides,
  }
}
