import standardLabel from './builtinStandardLabel.json'

export const BUILTIN_IDS = {
  STANDARD: '__builtin_standard__',
  OFFCUT: '__builtin_offcut__',
}

export const isBuiltinId = (id) =>
  id === BUILTIN_IDS.STANDARD || id === BUILTIN_IDS.OFFCUT

/** Metadata for gallery cards. */
export const BUILTIN_TEMPLATES = [
  {
    id: BUILTIN_IDS.STANDARD,
    name: 'Standard Label (Built-in)',
    builtin: true,
    labelType: 'production',
    width: 90,
    height: 43,
    unit: 'mm',
    description: 'Opti standard — barcode rail, key-value fields, Polish & transport badges.',
  },
  {
    id: BUILTIN_IDS.OFFCUT,
    name: 'Offcut Label (Built-in)',
    builtin: true,
    labelType: 'offcut',
    width: 90,
    height: 43,
    unit: 'mm',
    description: 'Compact offcut — piece ID, description, vertical barcode.',
  },
]

const OFFCUT_CONFIG = {
  id: BUILTIN_IDS.OFFCUT,
  name: 'Offcut Label (Built-in)',
  builtin: true,
  width: 90,
  height: 43,
  unit: 'mm',
  labelType: 'offcut',
  globalStyles: {
    fontFamily: 'Arial, sans-serif',
    defaultFontSize: 9,
    backgroundColor: '#ffffff',
    defaultColor: '#000000',
  },
  sections: {
    main: {
      enabled: true,
      display: 'block',
      position: 'relative',
      fields: [
        {
          fieldKey: 'pieceId',
          type: 'text',
          label: 'Piece ID',
          value: '{{id}}',
          x: 12, y: 8, width: 200, height: 36,
          fontSize: 22, fontWeight: 'bold', textAlign: 'center',
        },
        {
          fieldKey: 'description',
          type: 'text',
          label: 'Description',
          value: '{{pieceDescription}}',
          x: 12, y: 50, width: 200, height: 48,
          fontSize: 10, textAlign: 'center', border: true,
        },
        {
          fieldKey: 'offcutBarcode',
          type: 'barcode',
          label: 'Barcode',
          source: ['Barcode', 'barcode'],
          x: 250, y: 20, width: 80, height: 120,
          rotation: 90,
          displayValue: false,
          fallbackValue: '000000000',
        },
      ],
    },
  },
}

export function getBuiltinTemplateConfig(id) {
  if (id === BUILTIN_IDS.STANDARD) {
    return {
      ...JSON.parse(JSON.stringify(standardLabel)),
      id: BUILTIN_IDS.STANDARD,
      builtin: true,
      labelType: 'production',
      name: 'Standard Label (Built-in)',
    }
  }
  if (id === BUILTIN_IDS.OFFCUT) {
    return JSON.parse(JSON.stringify(OFFCUT_CONFIG))
  }
  return null
}
