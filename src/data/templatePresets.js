export const LABEL_SIZE_PRESETS = [
  { id: '100x60', name: '100 × 60 mm', width: 100, height: 60 },
  { id: '90x43', name: '90 × 43 mm (standard)', width: 90, height: 43 },
  { id: '100x50', name: '100 × 50 mm', width: 100, height: 50 },
  { id: '100x150', name: '100 × 150 mm', width: 100, height: 150 },
  { id: '4x6', name: '4 × 6 inch', width: 101.6, height: 152.4, unit: 'inch' },
  { id: '75x50', name: '75 × 50 mm', width: 75, height: 50 },
]

export const BUILTIN_TEMPLATES = [
  {
    id: 'TPL_PRODUCTION',
    name: 'Production Standard',
    labelType: 'production',
    width: 100,
    height: 60,
    description: 'Header + barcode layout',
  },
  {
    id: 'TPL_OFFCUT',
    name: 'Offcut Minimal',
    labelType: 'offcut',
    width: 90,
    height: 43,
    description: 'Compact offcut label',
  },
  {
    id: 'TPL_QR_ONLY',
    name: 'QR Only',
    labelType: 'production',
    width: 50,
    height: 50,
    description: 'Single QR code label',
  },
  {
    id: 'TPL_GLASS_DXF',
    name: 'Glass + DXF',
    labelType: 'production',
    width: 100,
    height: 150,
    description: 'Glass spec with shape viewport',
  },
]
