/** Size presets — width/height are in the preset's own unit; convert with toMm() on apply. */
export const SIZE_PRESET_GROUPS = [
  {
    id: 'metric',
    label: 'Metric',
    presets: [
      { id: '100x60', name: '100 × 60 mm', width: 100, height: 60, unit: 'mm' },
      { id: '90x43', name: '90 × 43 mm (Opti standard)', width: 90, height: 43, unit: 'mm' },
      { id: '100x50', name: '100 × 50 mm', width: 100, height: 50, unit: 'mm' },
      { id: '100x150', name: '100 × 150 mm', width: 100, height: 150, unit: 'mm' },
      { id: '75x50', name: '75 × 50 mm', width: 75, height: 50, unit: 'mm' },
      { id: '50x50', name: '50 × 50 mm (square)', width: 50, height: 50, unit: 'mm' },
    ],
  },
  {
    id: 'imperial',
    label: 'Imperial',
    presets: [
      { id: '4x6', name: '4 × 6 in (shipping)', width: 4, height: 6, unit: 'inch' },
      { id: '6x4', name: '6 × 4 in (landscape)', width: 6, height: 4, unit: 'inch' },
      { id: '4x2', name: '4 × 2 in', width: 4, height: 2, unit: 'inch' },
      { id: '3x2', name: '3 × 2 in', width: 3, height: 2, unit: 'inch' },
      { id: '2x1', name: '2 × 1 in', width: 2, height: 1, unit: 'inch' },
      { id: '4x3', name: '4 × 3 in', width: 4, height: 3, unit: 'inch' },
    ],
  },
  {
    id: 'ratios',
    label: 'Common ratios',
    presets: [
      { id: 'ratio-4x6-p', name: '4:6 portrait (4×6 in)', width: 4, height: 6, unit: 'inch' },
      { id: 'ratio-4x6-l', name: '6:4 landscape (6×4 in)', width: 6, height: 4, unit: 'inch' },
      { id: 'ratio-3x2', name: '3:2 (3×2 in)', width: 3, height: 2, unit: 'inch' },
      { id: 'ratio-2x1', name: '2:1 (2×1 in)', width: 2, height: 1, unit: 'inch' },
      { id: 'ratio-1x1', name: '1:1 square (2×2 in)', width: 2, height: 2, unit: 'inch' },
    ],
  },
]

/** Flat list for backwards compatibility */
export const LABEL_SIZE_PRESETS = SIZE_PRESET_GROUPS.flatMap((g) => g.presets)

export const BUILTIN_TEMPLATES = [
  {
    id: 'TPL_PRODUCTION',
    name: 'Production Standard',
    labelType: 'production',
    width: 100,
    height: 60,
    unit: 'mm',
    description: 'Header + barcode layout',
  },
  {
    id: 'TPL_OFFCUT',
    name: 'Offcut Minimal',
    labelType: 'offcut',
    width: 90,
    height: 43,
    unit: 'mm',
    description: 'Compact offcut label',
  },
  {
    id: 'TPL_QR_ONLY',
    name: 'QR Only',
    labelType: 'production',
    width: 50,
    height: 50,
    unit: 'mm',
    description: 'Single QR code label',
  },
  {
    id: 'TPL_GLASS_DXF',
    name: 'Glass + DXF',
    labelType: 'production',
    width: 100,
    height: 150,
    unit: 'mm',
    description: 'Glass spec with shape viewport',
  },
]
