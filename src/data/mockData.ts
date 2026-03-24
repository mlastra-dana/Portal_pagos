import type { ValidationHistoryItem } from '../types/validation';

export const formatDate = (value: string): string =>
  new Date(value).toLocaleString('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export const validationHistoryMock: ValidationHistoryItem[] = [
  {
    id: 'VAL-20260324-003',
    createdAt: '2026-03-24T11:22:00-04:00',
    fileName: 'captura_baja_calidad.png',
    status: 'REJECTED',
  },
  {
    id: 'VAL-20260324-002',
    createdAt: '2026-03-24T11:16:00-04:00',
    fileName: 'transferencia_cliente_marzo.jpg',
    status: 'OBSERVED',
  },
  {
    id: 'VAL-20260324-001',
    createdAt: '2026-03-24T11:10:00-04:00',
    fileName: 'comprobante_pago_845120.pdf',
    status: 'APPROVED',
  },
];
