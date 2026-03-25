import Tesseract from 'tesseract.js';
import type { ValidationFields } from '../types/validation';

interface LocalOcrExtractionResult {
  fields: ValidationFields;
  notes: string[];
  confidence: number;
  rawText: string;
  detectionStrategy: string;
}

const stripAccents = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeText = (value: string): string => stripAccents(value).toLowerCase();

const cleanDigits = (value: string): string => value.replace(/\D/g, '');

const pad2 = (value: number): string => String(value).padStart(2, '0');

const monthMap: Record<string, number> = {
  ene: 1, enero: 1,
  feb: 2, febrero: 2,
  mar: 3, marzo: 3,
  abr: 4, abril: 4,
  may: 5, mayo: 5,
  jun: 6, junio: 6,
  jul: 7, julio: 7,
  ago: 8, agosto: 8,
  sep: 9, set: 9, septiembre: 9, setiembre: 9,
  oct: 10, octubre: 10,
  nov: 11, noviembre: 11,
  dic: 12, diciembre: 12,
};

const bankCodeMap: Record<string, { name: string; id: string }> = {
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

const bankKeywords: Array<{ pattern: RegExp; name: string; id: string | 'No Aplica' }> = [
  { pattern: /banesco panama/i, name: 'Banesco Panama', id: 'No Aplica' },
  { pattern: /mercantil panama/i, name: 'Mercantil Panama', id: 'No Aplica' },
  { pattern: /bank of america/i, name: 'Bank of America', id: 'No Aplica' },
  { pattern: /wells fargo/i, name: 'Wells Fargo', id: 'No Aplica' },
  { pattern: /chase/i, name: 'Chase', id: 'No Aplica' },
  { pattern: /paypal/i, name: 'PayPal', id: 'No Aplica' },
  { pattern: /binance/i, name: 'Binance', id: 'No Aplica' },
  { pattern: /zelle/i, name: 'Zelle', id: 'No Aplica' },
  { pattern: /banco provincial|bbva provincial|provincial/i, name: 'Banco Provincial', id: '108' },
  { pattern: /mercantil/i, name: 'Mercantil Banco', id: '105' },
  { pattern: /banco de venezuela|bdv/i, name: 'Banco de Venezuela', id: '102' },
  { pattern: /venezolano de credito|bvc/i, name: 'Venezolano de Credito', id: '104' },
  { pattern: /bancaribe/i, name: 'Bancaribe', id: '114' },
  { pattern: /bancamiga/i, name: 'Bancamiga', id: '172' },
  { pattern: /banco del tesoro|tesoro/i, name: 'Banco del Tesoro', id: '163' },
];

const parseMonto = (text: string): number | null => {
  let clean = text
    .replace(/bs\.?/gi, '')
    .replace(/ves/gi, '')
    .replace(/\$/g, '')
    .trim();

  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',') && !clean.includes('.')) {
    clean = clean.replace(',', '.');
  }

  const value = Number(clean.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(value) ? value : null;
};

const extractDate = (text: string): string | null => {
  const nowYear = new Date().getFullYear();
  const normalized = normalizeText(text);

  const dmy = normalized.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  const ymd = normalized.match(/\b(20\d{2})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/);
  if (ymd) {
    const year = Number(ymd[1]);
    const month = Number(ymd[2]);
    const day = Number(ymd[3]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  const ddMon = normalized.match(/\b(\d{1,2})\s+([a-z]{3,10})(?:\s+(20\d{2}))?\b/);
  if (!ddMon) return null;

  const day = Number(ddMon[1]);
  const month = monthMap[ddMon[2]];
  const year = ddMon[3] ? Number(ddMon[3]) : nowYear;

  if (!month || day < 1 || day > 31) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
};

const findLabeledValue = (lines: string[], labels: string[]): string | null => {
  const normalizedLabels = labels.map((label) => normalizeText(label));
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const normalized = normalizeText(line);
    if (!normalizedLabels.some((label) => normalized.includes(label))) continue;

    const rightSide = line.split(':').slice(1).join(':').trim();
    if (rightSide) return rightSide;

    const sameLineNumber = line.match(/[\d][\d\s*\/-]{4,}/)?.[0]?.trim();
    if (sameLineNumber) return sameLineNumber;

    const nextLine = lines[i + 1]?.trim();
    if (nextLine) return nextLine;
  }
  return null;
};

const findLabeledLineWithContext = (lines: string[], labels: string[]): { line: string; next: string } | null => {
  const normalizedLabels = labels.map((label) => normalizeText(label));
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const normalized = normalizeText(line);
    if (!normalizedLabels.some((label) => normalized.includes(label))) continue;
    return {
      line,
      next: lines[i + 1] ?? '',
    };
  }
  return null;
};

const preprocessImageForOcr = async (file: File, variant: 'original' | 'high_contrast'): Promise<File | Blob> => {
  if (variant === 'original') return file;

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const scale = 1.8;
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    let gray = 0.299 * r + 0.587 * g + 0.114 * b;
    gray = gray > 160 ? 255 : Math.max(0, gray - 40);

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  return blob ?? file;
};

const runOcrBestPass = async (file: File): Promise<{ text: string; confidence: number }> => {
  const variants: Array<'original' | 'high_contrast'> = ['original', 'high_contrast'];

  let bestText = '';
  let bestConfidence = -1;

  for (const variant of variants) {
    const source = await preprocessImageForOcr(file, variant);
    const pass = await Tesseract.recognize(source, 'spa+eng');

    const text = pass.data.text ?? '';
    const confidence = Number(pass.data.confidence ?? 0);

    if (confidence > bestConfidence && text.trim().length > 0) {
      bestConfidence = confidence;
      bestText = text;
    }
  }

  return {
    text: bestText,
    confidence: bestConfidence > 0 ? Math.min(0.95, bestConfidence / 100) : 0.55,
  };
};

const extractCuentaDestino = (lines: string[]): string | null => {
  const positive = ['a la cuenta', 'cuenta abonada', 'cuenta destino', 'beneficiario', 'a cuenta', 'destino'];
  const negative = ['desde mi cuenta', 'cuenta de origen', 'cuenta a debitar', 'ordenante', 'debito'];

  const target = findLabeledLineWithContext(lines, ['cuenta destino', 'a la cuenta', 'cuenta abonada', 'beneficiario', 'destino']);
  if (target) {
    const source = `${target.line} ${target.next}`.trim();

    const fullAccount = source.match(/\b\d{20}\b/)?.[0];
    if (fullAccount) return fullAccount;

    const masked = source.match(/\*\s*\d{3,}/)?.[0];
    if (masked) {
      const digits = cleanDigits(masked);
      return digits.length > 0 ? digits : null;
    }

    const longToken = source.match(/(?:\d[\d\s-]{15,}\d)/)?.[0];
    if (longToken) {
      const digits = cleanDigits(longToken);
      if (digits.length >= 20) return digits;
      return null;
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const nLine = normalizeText(line);

    if (negative.some((label) => nLine.includes(label))) continue;
    if (!positive.some((label) => nLine.includes(label))) continue;

    const source = `${line} ${lines[i + 1] ?? ''}`;
    const candidate = source.match(/[\d*][\d*\s-]{3,}/)?.[0];
    if (!candidate) continue;

    const raw = candidate.trim();
    const onlyDigits = cleanDigits(raw);
    const isPureNumeric = /^[\d\s-]+$/.test(raw);

    if (isPureNumeric && onlyDigits.length < 20) return null;
    if (onlyDigits.length === 0) return null;
    return onlyDigits;
  }

  const fallback = lines.join(' ').match(/\b\d{20}\b/)?.[0];
  return fallback ?? null;
};

const extractReferencia = (lines: string[], fechaIA: string | null, montoIA: number | null): string | null => {
  const labelsPriority = [
    'referencia interbancaria',
    'referencia',
    'numero de referencia',
    'numero de identificacion',
    'operacion',
    'ref',
    'n de recibo',
    'documento',
    'confirmacion',
  ];

  for (const label of labelsPriority) {
    const raw = findLabeledValue(lines, [label]);
    if (!raw) continue;
    const digits = cleanDigits(raw);
    if (!digits) continue;

    if (fechaIA && digits.includes(fechaIA.replace(/\D/g, ''))) continue;
    if (montoIA !== null && digits === String(Math.round(montoIA))) continue;
    return digits;
  }

  return null;
};

const extractMonto = (lines: string[]): number | null => {
  const labels = ['monto a transferir', 'total', 'bs.', 'monto'];
  const raw = findLabeledValue(lines, labels);

  if (raw) {
    const match = raw.match(/\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})|\d+[.,]\d{2}/)?.[0] ?? raw;
    const parsed = parseMonto(match);
    if (parsed !== null) return parsed;
  }

  return null;
};

const inferIssuerFromPromptRules = (
  text: string,
  lines: string[],
  referencia: string | null,
): { banco: string | null; id: string | null; strategy: string } => {
  const originCandidate = findLabeledValue(lines, ['cuenta de origen', 'cuenta a debitar', 'debito']);
  if (originCandidate) {
    const digits = cleanDigits(originCandidate);
    const prefix4 = digits.slice(0, 4);
    const bank = bankCodeMap[prefix4];
    if (bank) {
      return { banco: bank.name, id: bank.id, strategy: 'origin_account_prefix' };
    }
  }

  if ((referencia && referencia.startsWith('00255')) || /listo/i.test(text)) {
    return { banco: 'Mercantil Banco', id: '105', strategy: 'mercantil_unique_pattern' };
  }

  if (/provincial|bbva/i.test(text) || /\b\d{1,2}\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)\b(?!\s+20\d{2})/i.test(text)) {
    return { banco: 'Banco Provincial', id: '108', strategy: 'provincial_visual_pattern' };
  }

  const international = bankKeywords.find((entry) => entry.id === 'No Aplica' && entry.pattern.test(text));
  if (international) {
    return { banco: international.name, id: 'No Aplica', strategy: 'international_exception' };
  }

  const localByName = bankKeywords.find((entry) => entry.id !== 'No Aplica' && entry.pattern.test(text));
  if (localByName) {
    return { banco: localByName.name, id: localByName.id, strategy: 'header_text_match' };
  }

  return { banco: 'Otros Bancos', id: null, strategy: 'fallback_other' };
};

const extractNullResult = (rawText: string, note: string): LocalOcrExtractionResult => {
  return {
    fields: {
      CuentaBancariaIA: null,
      banco_destinoIA: null,
      montoIA: null,
      fechaIA: null,
      rawReferenceIA: null,
      CompletereferenciaIA: null,
      banco_emisorIA: null,
      issuerBankIdIA: null,
    },
    notes: [note],
    confidence: 0,
    rawText,
    detectionStrategy: 'strict_null_fallback',
  };
};

export const extractReceiptWithLocalOcr = async (file: File): Promise<LocalOcrExtractionResult> => {
  if (!file.type.startsWith('image/')) {
    return extractNullResult('', 'OCR local estricto disponible solo para imagenes. En este archivo se devolvieron campos null.');
  }

  const ocr = await runOcrBestPass(file);
  const rawText = ocr.text ?? '';
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const cuentaDestino = extractCuentaDestino(lines);
  const fecha = extractDate(rawText);
  const monto = extractMonto(lines);
  const referencia = extractReferencia(lines, fecha, monto);

  const destinoText = normalizeText(
    `${findLabeledValue(lines, ['cuenta destino', 'a la cuenta', 'beneficiario']) ?? ''} ${findLabeledValue(lines, ['destino']) ?? ''}`,
  );

  let bancoDestino: string | null = null;
  if (cuentaDestino?.startsWith('0105')) bancoDestino = 'Mercantil Banco';
  else if (cuentaDestino?.startsWith('0108') || /provincial|bbva/i.test(rawText)) bancoDestino = 'Banco Provincial';
  else if (/mercantil/.test(destinoText)) bancoDestino = 'Mercantil Banco';
  else if (/provincial|bbva/.test(destinoText)) bancoDestino = 'Banco Provincial';

  const issuer = inferIssuerFromPromptRules(rawText, lines, referencia);

  const bancoEmisor = issuer.banco === 'Otros Bancos' ? null : issuer.banco;
  const issuerId = issuer.id;

  return {
    fields: {
      CuentaBancariaIA: cuentaDestino,
      banco_destinoIA: bancoDestino,
      montoIA: monto,
      fechaIA: fecha,
      rawReferenceIA: referencia,
      CompletereferenciaIA: referencia,
      banco_emisorIA: bancoEmisor,
      issuerBankIdIA: issuerId,
    },
    notes: ['Extraccion local con OCR (tesseract.js) y reglas estrictas. Si un dato no es claro, se devuelve null.'],
    confidence: ocr.confidence,
    rawText,
    detectionStrategy: issuer.strategy,
  };
};
