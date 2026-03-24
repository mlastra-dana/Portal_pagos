import { defineBackend } from '@aws-amplify/backend';
import { Validarcomprobante } from './functions/Validarcomprobante/resource';

export const backend = defineBackend({
  Validarcomprobante,
});
