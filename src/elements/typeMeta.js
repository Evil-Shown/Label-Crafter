import {
  Type,
  Heading,
  Square,
  Barcode,
  QrCode,
  SquareCheck,
  Minus,
  Shapes,
  Image as ImageIcon,
  Frame,
  Table2,
} from 'lucide-react'

/**
 * Single source of truth for how an element type is named and drawn.
 * Spec §1.4: words, not mystery icons — the label is what users read.
 */
export const ELEMENT_TYPES = {
  text: { label: 'Text', Icon: Type },
  header: { label: 'Header', Icon: Heading },
  blackbox: { label: 'Black box', Icon: Square },
  barcode: { label: 'Barcode', Icon: Barcode },
  qrcode: { label: 'QR code', Icon: QrCode },
  checkbox: { label: 'Checkbox', Icon: SquareCheck },
  line: { label: 'Line', Icon: Minus },
  shape: { label: 'Shape', Icon: Shapes },
  image: { label: 'Image', Icon: ImageIcon },
  dxf: { label: 'DXF', Icon: Frame },
  table: { label: 'Table', Icon: Table2 },
}

/** Resolve a field to its display name, preferring its own label. */
export function elementDisplayName(field) {
  if (!field) return 'Element'
  const meta = ELEMENT_TYPES[String(field.type || 'text').toLowerCase()]
  const explicit = typeof field.label === 'string' ? field.label.trim() : ''
  if (explicit) return explicit
  return meta?.label || 'Element'
}

export function elementIcon(field) {
  const meta = ELEMENT_TYPES[String(field?.type || 'text').toLowerCase()]
  return meta?.Icon || Type
}

/** Tool grid (spec §3 area 6): ten tools, Table removed, Shape merged. */
export const TOOL_GRID = [
  { id: 'text', label: 'Text' },
  { id: 'header', label: 'Header' },
  { id: 'blackbox', label: 'Black box' },
  { id: 'barcode', label: 'Barcode' },
  { id: 'qrcode', label: 'QR' },
  { id: 'checkbox', label: 'Checkbox' },
  { id: 'line', label: 'Line' },
  { id: 'shape', label: 'Shape' },
  { id: 'image', label: 'Image' },
  { id: 'dxf', label: 'DXF' },
]
