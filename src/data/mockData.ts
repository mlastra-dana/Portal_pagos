import type { ValidationHistoryItem, ValidationResult, ValidationStatus } from '../types/validation';

export const formatDate = (value: string): string =>
  new Date(value).toLocaleString('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const baseFields = [
  { label: 'Banco emisor', value: 'Banco Mercantil' },
  { label: 'Banco destino', value: 'Mercantil Seguros C.A.' },
  { label: 'Cuenta destino', value: '0105-XXXX-XX-XXXXXXXXXX' },
  { label: 'Fecha', value: '24/03/2026' },
];

export const validationResultsByStatus: Record<ValidationStatus, ValidationResult> = {
  APROBADO: {
    id: 'VAL-20260324-001',
    status: 'APROBADO',
    title: 'Pago validado correctamente',
    summary: 'Tu comprobante fue leído y validado de forma exitosa.',
    observations: ['No se encontraron diferencias en los datos del comprobante.'],
    nextAction: 'No debes realizar ninguna acción adicional. Conserva este resultado para tu control.',
    detectedFields: [
      ...baseFields,
      { label: 'Referencia', value: '845120' },
      { label: 'Monto', value: 'Bs. 2.450,00' },
    ],
    createdAt: '2026-03-24T11:10:00-04:00',
    fileName: 'comprobante_pago_845120.pdf',
  },
  OBSERVADO: {
    id: 'VAL-20260324-002',
    status: 'OBSERVADO',
    title: 'Comprobante con observaciones',
    summary: 'Se detectaron diferencias menores en la lectura del documento.',
    observations: [
      'El monto detectado presenta una variación de Bs. 20,00 respecto al monto esperado.',
      'La referencia es legible, pero requiere confirmación manual.',
    ],
    nextAction: 'Verifica tu comprobante y vuelve a cargarlo si es necesario.',
    detectedFields: [
      ...baseFields,
      { label: 'Referencia', value: '845121' },
      { label: 'Monto', value: 'Bs. 2.430,00' },
    ],
    createdAt: '2026-03-24T11:16:00-04:00',
    fileName: 'transferencia_cliente_marzo.jpg',
  },
  RECHAZADO: {
    id: 'VAL-20260324-003',
    status: 'RECHAZADO',
    title: 'No se pudo validar el comprobante',
    summary: 'No fue posible leer correctamente los datos del archivo cargado.',
    observations: [
      'El número de referencia no pudo ser detectado con claridad.',
      'La imagen presenta baja calidad y elementos truncados.',
    ],
    nextAction: 'Carga nuevamente un comprobante más legible para continuar.',
    detectedFields: [
      ...baseFields,
      { label: 'Referencia', value: 'No detectada' },
      { label: 'Monto', value: 'No detectable' },
    ],
    createdAt: '2026-03-24T11:22:00-04:00',
    fileName: 'captura_baja_calidad.png',
  },
};

export const validationHistoryMock: ValidationHistoryItem[] = [
  {
    id: 'VAL-20260324-003',
    createdAt: '2026-03-24T11:22:00-04:00',
    fileName: 'captura_baja_calidad.png',
    status: 'RECHAZADO',
  },
  {
    id: 'VAL-20260324-002',
    createdAt: '2026-03-24T11:16:00-04:00',
    fileName: 'transferencia_cliente_marzo.jpg',
    status: 'OBSERVADO',
  },
  {
    id: 'VAL-20260324-001',
    createdAt: '2026-03-24T11:10:00-04:00',
    fileName: 'comprobante_pago_845120.pdf',
    status: 'APROBADO',
  },
  {
    id: 'VAL-20260322-031',
    createdAt: '2026-03-22T09:40:00-04:00',
    fileName: 'deposito_asegurado_031.pdf',
    status: 'APROBADO',
  },
];
