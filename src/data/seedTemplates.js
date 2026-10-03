import {
  createBarcodeField,
  createBlackBoxTextField,
  createDxfShapeField,
  createHeaderField,
  createImageField,
  createLineField,
  createQrField,
  createRectField,
  createTextField,
} from '../elements/factories'

/**
 * Starting catalogue for the Templates tab.
 *
 * The shared database is not connected yet, so on a fresh PC these entries give
 * the designer something real to open and edit. They are ordinary templates —
 * once the database is reachable the library is replaced by
 * `list_templates(client)` and these are only used if the database is empty.
 */

export const MSG = (over = {}) => ({
  id: 'LBL_001',
  name: 'MSG — Premium Shower',
  width: 100,
  height: 150,
  unit: 'mm',
  labelType: 'production',
  printerDpi: 300,
  client: 'opti',
  margins: { left: 3, right: 3, top: 2, bottom: 2 },
  globalStyles: {
    fontFamily: 'Arial, sans-serif',
    defaultFontSize: 9,
    backgroundColor: '#ffffff',
    defaultColor: '#000000',
  },
  fields: [
    createHeaderField({
      fieldKey: 'route',
      label: 'Route',
      value: 'Rout N1F3',
      fallbackValue: 'Rout N1F3',
      x: 12, y: 12, width: 160, height: 32,
      fontSize: 24, textAlign: 'left', fontWeight: 'bold',
      noteField: 1, subField: 3,
    }),
    createHeaderField({
      fieldKey: 'tgh',
      label: 'TGH',
      value: 'TGH',
      fallbackValue: 'TGH',
      x: 250, y: 12, width: 110, height: 32,
      fontSize: 24, textAlign: 'right', fontWeight: 'bold',
    }),
    createBlackBoxTextField({
      fieldKey: 'blackBar',
      label: 'Black bar',
      value: 'N2F10',
      fallbackValue: 'N2F10',
      x: 12, y: 48, width: 356, height: 22,
      fontSize: 12, textAlign: 'center', fontWeight: 'bold',
      noteField: 2, subField: 10, blackBox: true, isBlackBox: true,
    }),
    createImageField({
      fieldKey: 'logo',
      label: 'MS GLASS',
      x: 12, y: 76, width: 140, height: 32,
    }),
    createRectField({
      fieldKey: 'accentBar',
      label: 'Accent Bar',
      x: 12, y: 114, width: 140, height: 24,
      fillEnabled: true,
      fillColor: '#000000',
      strokeWidth: 0,
    }),
    createBarcodeField({
      fieldKey: 'barcode',
      label: 'Barcode',
      value: '123456789012',
      fallbackValue: '123456789012',
      x: 160, y: 100, width: 208, height: 50,
      source: ['pieceId'], noteField: 1, subField: 1,
      barcodeFormat: 'CODE128', displayValue: true, barWidth: 2,
    }),
    createTextField({
      fieldKey: 'marks',
      label: 'Marks',
      value: 'Marks:',
      fallbackValue: 'Marks:',
      x: 100, y: 158, width: 120, height: 16,
      fontSize: 11, fontWeight: 'bold', source: ['marks'],
    }),
    createTextField({
      fieldKey: 'custPo',
      label: 'Cust PO',
      value: 'Cust PO:',
      fallbackValue: 'Cust PO:',
      x: 12, y: 176, width: 120, height: 16,
      fontSize: 11, fontWeight: 'bold', source: ['custPO'],
    }),
    createLineField({
      fieldKey: 'divider',
      label: 'Divider',
      x: 12, y: 198, width: 356, height: 2,
      strokeColor: '#000000', strokeWidth: 1.5,
    }),
    createTextField({
      fieldKey: 'finishedSize',
      label: 'Finished size',
      value: 'FinishedSize',
      fallbackValue: 'FinishedSize',
      x: 12, y: 234, width: 220, height: 18,
      fontSize: 11, fontWeight: 'bold',
    }),
    createTextField({
      fieldKey: 'service2',
      label: 'Service 2',
      value: 'Service2',
      fallbackValue: 'Service2',
      x: 12, y: 276, width: 200, height: 16,
      fontSize: 11, fontWeight: 'bold', noteField: 2, subField: 2,
    }),
    createTextField({
      fieldKey: 'service3',
      label: 'Service 3',
      value: 'Service3',
      fallbackValue: 'Service3',
      x: 12, y: 296, width: 200, height: 16,
      fontSize: 11, fontWeight: 'bold', noteField: 3, subField: 2,
    }),
    createDxfShapeField({
      fieldKey: 'glassShape',
      label: 'N1F4',
      x: 160, y: 310, width: 130, height: 80,
      noteField: 1, subField: 4,
    }),
    createHeaderField({
      fieldKey: 'delivery',
      label: 'DELIVERY',
      value: 'DELIVERY',
      fallbackValue: 'DELIVERY',
      x: 12, y: 440, width: 160, height: 22,
      fontSize: 12, fontWeight: 'bold',
    }),
  ],
  ...over,
})

export const SEED_TEMPLATES = [
  MSG(),

  MSG({
    id: 'LBL_002',
    name: 'MSG — Frameless Shower',
    updatedAt: daysAgo(3),
    fields: MSG().fields.map((f) => ({ ...f })),
  }),

  MSG({
    id: 'LBL_OFF_001',
    name: 'Offcut — MSG small',
    width: 100,
    height: 60,
    labelType: 'offcut',
    updatedAt: daysAgo(6),
    fields: MSG().fields.slice(0, 6).map((f) => ({ ...f, y: Math.max(4, f.y * 0.35) })),
  }),

  {
    id: 'ERP_001',
    name: 'Glass Order Label',
    width: 100,
    height: 100,
    unit: 'mm',
    labelType: 'production',
    printerDpi: 300,
    client: 'erp',
    margins: { left: 3, right: 3, top: 3, bottom: 3 },
    globalStyles: {
      fontFamily: 'Arial, sans-serif',
      defaultFontSize: 9,
      backgroundColor: '#ffffff',
      defaultColor: '#000000',
    },
    fields: [
      createHeaderField({
        fieldKey: 'orderNo',
        label: 'Order number',
        value: 'Order {{OrderNo}}',
        x: 12, y: 12, width: 300, height: 24,
        fontSize: 14, fontWeight: 'bold', textAlign: 'left',
      }),
      createBarcodeField({
        fieldKey: 'orderBarcode',
        label: 'Barcode',
        x: 12, y: 44, width: 340, height: 60,
        source: ['OrderNo'], barcodeFormat: 'CODE128', displayValue: true,
      }),
      createTextField({
        fieldKey: 'custOrderNo',
        label: 'Customer order',
        value: 'Customer order {{CustOrderNo}}',
        x: 12, y: 114, width: 300, height: 16, fontSize: 11,
      }),
      createTextField({
        fieldKey: 'jobDescription',
        label: 'Job description',
        value: '{{JobDescription}}',
        x: 12, y: 136, width: 340, height: 32, fontSize: 11,
      }),
      createTextField({
        fieldKey: 'deliveryDate',
        label: 'Delivery date',
        value: 'Delivery {{DeliveryDate}}',
        x: 12, y: 176, width: 300, height: 16, fontSize: 11,
      }),
      createQrField({
        fieldKey: 'orderQr',
        label: 'QR code',
        x: 300, y: 300, width: 64, height: 64,
        source: ['OrderNo'],
      }),
    ],
  },

  {
    id: 'ERP_002',
    name: 'ERP — Packing label',
    width: 100,
    height: 50,
    unit: 'mm',
    labelType: 'production',
    printerDpi: 203,
    client: 'erp',
    margins: { left: 2, right: 2, top: 2, bottom: 2 },
    globalStyles: {
      fontFamily: 'Arial, sans-serif',
      defaultFontSize: 8,
      backgroundColor: '#ffffff',
      defaultColor: '#000000',
    },
    fields: [
      createHeaderField({
        fieldKey: 'packOrder',
        label: 'Order',
        value: '{{OrderNo}}',
        x: 8, y: 8, width: 200, height: 18, fontSize: 12, fontWeight: 'bold', textAlign: 'left',
      }),
      createBarcodeField({
        fieldKey: 'packBarcode',
        label: 'Barcode',
        x: 8, y: 30, width: 360, height: 44,
        source: ['OrderNo'], barcodeFormat: 'CODE128', displayValue: true,
      }),
    ],
  },
]

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString()
}