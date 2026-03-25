export const IDP_MAIN_PROMPT_FIELDS = [
  'CuentaBancariaIA',
  'banco_destinoIA',
  'montoIA',
  'fechaIA',
  'CompletereferenciaIA',
] as const;

export const IDP_ISSUER_PROMPT_FIELDS = [
  'banco_emisorIA',
  'issuerBankIdIA',
] as const;

export const DESTINATION_LABELS = [
  'a la cuenta',
  'cuenta abonada',
  'cuenta destino',
  'cuenta credito',
  'cuenta crédito',
  'cuenta a acreditar',
  'cuenta acreditada',
  'cuenta beneficiario',
  'beneficiario',
  'a cuenta',
  'destino',
];

export const ORIGIN_EXCLUDED_LABELS = [
  'desde mi cuenta',
  'cuenta de origen',
  'cuenta a debitar',
  'ordenante',
  'debito',
];

export const REFERENCE_LABELS_PRIORITY = [
  'referencia interbancaria',
  'referencia',
  'nro de referencia',
  'nro. de referencia',
  'nro referencia',
  'numero de referencia',
  'numero de identificacion',
  'operacion',
  'ref',
  'n de recibo',
  'documento',
  'confirmacion',
];

export const BANK_CODE_MAP: Record<string, { name: string; id: string }> = {
  '0102': { name: 'Banco de Venezuela', id: '102' },
  '0104': { name: 'Venezolano de Credito', id: '104' },
  '0105': { name: 'Mercantil Banco', id: '105' },
  '0108': { name: 'Banco Provincial', id: '108' },
  '0114': { name: 'Bancaribe', id: '114' },
  '0115': { name: 'Banco Exterior', id: '115' },
  '0128': { name: 'Banco Caroni', id: '128' },
  '0134': { name: 'Banesco', id: '134' },
  '0137': { name: 'Banco Sofitasa', id: '137' },
  '0138': { name: 'Banco Plaza', id: '138' },
  '0146': { name: 'Bangente C.A', id: '146' },
  '0151': { name: 'BFC Banco Fondo Comun', id: '151' },
  '0156': { name: '100% Banco', id: '156' },
  '0157': { name: 'DelSur Banco Universal', id: '157' },
  '0163': { name: 'Banco del Tesoro', id: '163' },
  '0166': { name: 'Banco Agricola de Venezuela', id: '166' },
  '0168': { name: 'Bancrecer, Banco Microfinanciero', id: '168' },
  '0169': { name: 'R4, Banco Microfinanciero', id: '169' },
  '0171': { name: 'Banco Activo', id: '171' },
  '0172': { name: 'Bancamiga', id: '172' },
  '0173': { name: 'Banco Internacional de Desarrollo', id: '173' },
  '0174': { name: 'Banplus Banco Universal', id: '174' },
  '0175': { name: 'Banco Digital de Los Trabajadores', id: '175' },
  '0177': { name: 'Banco de la Fuerza Armada Nacional Bolivariana', id: '177' },
  '0178': { name: 'N58 Banco Digital', id: '178' },
  '0191': { name: 'Banco Nacional de Credito', id: '191' },
  '0601': { name: 'Instituto Municipal de Credito Popular', id: '601' },
};
