/** Offline catalogs used when the design service is not reachable. */
export const OPTI_FIELD_CATALOG = [
  { key: 'customerName', label: 'Customer name', type: 'text', source: 'piece' },
  { key: 'orderNumber', label: 'Order number', type: 'text', source: 'piece' },
  { key: 'batchNumber', label: 'Batch number', type: 'text', source: 'piece' },
  { key: 'pieceDescription', label: 'Piece description', type: 'text', source: 'piece' },
  { key: 'id', label: 'Piece id', type: 'text', source: 'piece' },
  { key: 'Dimensions', label: 'Dimensions', type: 'text', source: 'piece' },
  { key: 'width', label: 'Width', type: 'text', source: 'piece' },
  { key: 'height', label: 'Height', type: 'text', source: 'piece' },
  { key: 'area', label: 'Area', type: 'text', source: 'piece' },
  { key: 'weight', label: 'Weight', type: 'text', source: 'piece' },
  { key: 'services', label: 'Services', type: 'text', source: 'piece' },
  { key: 'marks', label: 'Marks', type: 'text', source: 'piece' },
  { key: 'custPO', label: 'Customer PO', type: 'text', source: 'piece' },
  { key: 'pickupDate', label: 'Pickup date', type: 'text', source: 'piece' },
  { key: 'transportType', label: 'Transport', type: 'text', source: 'piece' },
  { key: 'salesID', label: 'Sales id', type: 'text', source: 'piece' },
  { key: 'Barcode', label: 'Barcode', type: 'barcode', source: 'piece' },
  { key: 'optiNo', label: 'Optimization number', type: 'text', source: 'piece' },
  { key: 'BatchNo', label: 'Batch number (legacy)', type: 'text', source: 'piece' },
  { key: 'thickness', label: 'Thickness', type: 'text', source: 'sheet' },
  { key: 'glassCode', label: 'Glass code', type: 'text', source: 'sheet' },
  { key: 'GlassFam', label: 'Glass family', type: 'text', source: 'sheet' },
  { key: 'pieceSheet', label: 'Piece → sheet', type: 'text', source: 'piece' },
  { key: 'globalPieceNo', label: 'Global piece no', type: 'text', source: 'piece' },
  { key: 'printedAt', label: 'Printed at', type: 'text', source: 'piece' },
  { key: 'machines', label: 'Machines (note2.field10)', type: 'text', source: 'notes' },
  { key: 'note2.field10', label: 'Process checklist (note2.field10)', type: 'text', source: 'notes' },
  { key: 'note3.field1', label: 'Note 3 field 1', type: 'text', source: 'notes' },
]

export const ERP_FIELD_CATALOG = [
  { key: 'OrderNo', label: 'Order number', type: 'text', source: 'piece' },
  { key: 'CustOrderNo', label: 'Customer order', type: 'text', source: 'piece' },
  { key: 'JobDescription', label: 'Job description', type: 'text', source: 'piece' },
  { key: 'Dimensions', label: 'Dimensions', type: 'text', source: 'piece' },
  { key: 'GlassSpec', label: 'Glass spec', type: 'text', source: 'piece' },
  { key: 'MarkAs', label: 'Mark', type: 'text', source: 'piece' },
  { key: 'DeliveryDate', label: 'Delivery date', type: 'text', source: 'piece' },
  { key: 'Sqm', label: 'Square metres', type: 'text', source: 'piece' },
  { key: 'LineRef', label: 'Line ref', type: 'text', source: 'piece' },
  { key: 'Route', label: 'Route', type: 'text', source: 'piece' },
  { key: 'WeightKg', label: 'Weight kg', type: 'text', source: 'piece' },
  { key: 'Barcode', label: 'Barcode', type: 'barcode', source: 'piece' },
  { key: 'ProcessNotes', label: 'Process notes', type: 'text', source: 'piece' },
]

export function catalogForClient(client) {
  return client === 'erp' ? ERP_FIELD_CATALOG : OPTI_FIELD_CATALOG
}
