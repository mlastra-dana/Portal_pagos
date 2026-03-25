import Tesseract from 'tesseract.js';
import { BANK_CODE_MAP, DESTINATION_LABELS, ORIGIN_EXCLUDED_LABELS, REFERENCE_LABELS_PRIORITY } from '../config/idpRules';
import type { ValidationFields } from '../types/validation';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

interface LocalOcrExtractionResult {
  fields: ValidationFields;
  notes: string[];
  confidence: number;
  rawText: string;
  detectionStrategy: string;
}

let pdfWorkerConfigured = false;

const ensurePdfWorker = () => {
  if (pdfWorkerConfigured) return;
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    pdfWorkerConfigured = true;
  } catch {
    pdfWorkerConfigured = true;
  }
};

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

const bankKeywords: Array<{ pattern: RegExp; name: string; id: string | 'No Aplica' }> = [
  { pattern: /banesco panama/i, name: 'Banesco Panama', id: 'No Aplica' },
  { pattern: /mercantil panama/i, name: 'Mercantil Panama', id: 'No Aplica' },
  { pattern: /bank of america/i, name: 'Bank of America', id: 'No Aplica' },
  { pattern: /wells fargo/i, name: 'Wells Fargo', id: 'No Aplica' },
  { pattern: /chase/i, name: 'Chase', id: 'No Aplica' },
  { pattern: /paypal/i, name: 'PayPal', id: 'No Aplica' },
  { pattern: /binance/i, name: 'Binance', id: 'No Aplica' },
  { pattern: /zelle/i, name: 'Zelle', id: 'No Aplica' },
  { pattern: /banesco/i, name: 'Banesco', id: '134' },
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

const getIssuerHeaderText = (lines: string[]): string => {
  // El emisor suele aparecer en el encabezado superior.
  // Reducimos la ventana para evitar mezclar texto de beneficiario.
  return lines.slice(0, 4).join('\n');
};

const getStrongIssuerEvidenceText = (lines: string[]): string => {
  const issuerLabels = [
    'banco emisor',
    'emisor',
    'origen',
    'cuenta de origen',
    'cuenta a debitar',
    'debito',
    'desde mi cuenta',
    'ordenante',
  ];

  const captured: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const normalized = normalizeText(line);
    if (!issuerLabels.some((label) => normalized.includes(label))) continue;

    captured.push(line);
    if (lines[i + 1]) captured.push(lines[i + 1]);
  }

  return captured.join('\n');
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

const preprocessBlobImageForOcr = async (blob: Blob, variant: 'original' | 'high_contrast'): Promise<Blob> => {
  if (variant === 'original') return blob;

  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  const scale = 1.8;
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return blob;

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
  const processed = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  return processed ?? blob;
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

const runOcrBestPassFromBlob = async (blob: Blob): Promise<{ text: string; confidence: number }> => {
  const variants: Array<'original' | 'high_contrast'> = ['original', 'high_contrast'];

  let bestText = '';
  let bestConfidence = -1;

  for (const variant of variants) {
    const source = await preprocessBlobImageForOcr(blob, variant);
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

const extractTextFromPdf = async (file: File): Promise<{ text: string; confidence: number; note: string }> => {
  try {
    ensurePdfWorker();
    const arrayBuffer = await file.arrayBuffer();

    // Try with worker first; if worker fails in local env, retry with disableWorker.
    let pdf: Awaited<ReturnType<(typeof pdfjsLib)['getDocument']>['promise']>;
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      pdf = await loadingTask.promise;
    } catch {
      const loadingTaskNoWorker = pdfjsLib.getDocument({ data: arrayBuffer, disableWorker: true } as any);
      pdf = await loadingTaskNoWorker.promise;
    }

    // 1) First try embedded/selectable text.
    let embeddedText = '';
    const pagesToRead = Math.min(pdf.numPages, 3);
    for (let pageNum = 1; pageNum <= pagesToRead; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();
      if (pageText.length > 0) embeddedText += ` ${pageText}`;
    }
    embeddedText = embeddedText.trim();

    // 2) OCR support for scanned PDFs (always at least first page).
    const ocrPageCount = Math.min(pdf.numPages, 2);
    let ocrText = '';
    let confidenceAcc = 0;
    let validPasses = 0;

    for (let pageNum = 1; pageNum <= ocrPageCount; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.6 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      await page.render({
        canvas,
        canvasContext: ctx,
        viewport,
      }).promise;

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) continue;

      const ocr = await runOcrBestPassFromBlob(blob);
      if (ocr.text.trim().length > 0) {
        ocrText += `\n${ocr.text}`;
        confidenceAcc += ocr.confidence;
        validPasses += 1;
      }
    }

    const hasEmbedded = embeddedText.length > 0;
    const hasOcr = ocrText.trim().length > 0;
    const combinedText = [embeddedText, ocrText.trim()].filter(Boolean).join('\n').trim();

    if (hasEmbedded || hasOcr) {
      const combinedConfidence =
        hasEmbedded && hasOcr
          ? Math.max(0.82, validPasses > 0 ? (confidenceAcc / validPasses + 0.9) / 2 : 0.85)
          : hasEmbedded
            ? 0.9
            : validPasses > 0
              ? confidenceAcc / validPasses
              : 0.6;

      return {
        text: combinedText,
        confidence: combinedConfidence,
        note: hasEmbedded && hasOcr
          ? 'Extracción PDF combinada (texto embebido + OCR).'
          : hasEmbedded
            ? 'Extracción PDF por texto embebido.'
            : 'Extracción PDF por OCR de páginas renderizadas.',
      };
    }

    return {
      text: '',
      confidence: 0,
      note: 'No se detectó texto legible en el PDF.',
    };
  } catch (error) {
    return {
      text: '',
      confidence: 0,
      note: `Fallo en extracción PDF: ${error instanceof Error ? error.message : 'error desconocido'}`,
    };
  }
};

const extractCuentaDestino = (lines: string[]): string | null => {
  const STRICT_DESTINATION_LABELS = [
    'cuenta transferida',
    'codigo cuenta cliente transferida',
    'código cuenta cliente transferida',
    'cuenta credito',
    'cuenta crédito',
    'cuenta a acreditar',
    'cuenta acreditada',
    'cuenta destino',
  ];

  const normalizeMaskedAccount = (value: string): string | null => {
    const compact = value.replace(/[\s-]/g, '');
    const maskChars = '[*xX•._,·]+';

    const withPrefix = compact.match(new RegExp(`(\\d{4})${maskChars}(\\d{3,})`));
    if (withPrefix) {
      const prefix = withPrefix[1];
      const suffix = withPrefix[2];
      return `${prefix}****${suffix.slice(-4)}`;
    }

    const starsAndDigits = compact.match(new RegExp(`${maskChars}(\\d{3,})`));
    if (starsAndDigits) {
      const suffix = starsAndDigits[1];
      return `****${suffix.slice(-4)}`;
    }

    return null;
  };

  const tryExtractFromLabeledContext = (labels: string[]): string | null => {
    const target = findLabeledLineWithContext(lines, labels);
    if (!target) return null;

    const targetIndex = lines.findIndex((line) => line === target.line);
    const source = `${target.line} ${target.next} ${targetIndex >= 0 ? lines[targetIndex + 2] ?? '' : ''}`.trim();

    const fullAccount = source.match(/\b\d{20}\b/)?.[0];
    if (fullAccount) return fullAccount;

    const normalizedMasked = normalizeMaskedAccount(source);
    if (normalizedMasked) return normalizedMasked;

    const longToken = source.match(/(?:\d[\d\s\-._,·]{15,}\d)/)?.[0];
    if (longToken) {
      const digits = cleanDigits(longToken);
      if (digits.length >= 20) return digits;
      return null;
    }
    return null;
  };

  const strictAccount = tryExtractFromLabeledContext(STRICT_DESTINATION_LABELS);
  if (strictAccount) return strictAccount;

  const genericAccount = tryExtractFromLabeledContext(DESTINATION_LABELS);
  if (genericAccount) return genericAccount;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const nLine = normalizeText(line);

    if (ORIGIN_EXCLUDED_LABELS.some((label) => nLine.includes(label))) continue;
    if (!DESTINATION_LABELS.some((label) => nLine.includes(label))) continue;

    const source = `${line} ${lines[i + 1] ?? ''} ${lines[i + 2] ?? ''}`;
    const normalizedMasked = normalizeMaskedAccount(source);
    if (normalizedMasked) return normalizedMasked;

    const candidate = source.match(/[\d*xX•][\d*xX•\s\-._,·]{3,}/)?.[0];
    if (!candidate) continue;

    const raw = candidate.trim();
    const onlyDigits = cleanDigits(raw);
    const isPureNumeric = /^[\d\s\-._,·]+$/.test(raw);
    const hasMask = /[*xX•._,·]/.test(raw);

    if (isPureNumeric && onlyDigits.length < 20) continue;
    if (onlyDigits.length === 0) continue;
    if (hasMask) {
      if (onlyDigits.length >= 4) return `****${onlyDigits.slice(-4)}`;
      return `****${onlyDigits}`;
    }
    return onlyDigits;
  }

  const strictFallback = lines.join(' ').match(/\b\d{20}\b/)?.[0];
  if (strictFallback) return strictFallback;

  const relaxedFallback = lines
    .join(' ')
    .match(/\d[\d\s\-._,·]{18,}\d/g)
    ?.map((chunk) => cleanDigits(chunk))
    .find((digits) => digits.length >= 20);

  return relaxedFallback ?? null;
};

const extractReferencia = (lines: string[], fechaIA: string | null, montoIA: number | null): string | null => {
  const fechaDigits = fechaIA?.replace(/\D/g, '') ?? '';
  const montoDigits = montoIA !== null ? String(Math.round(montoIA)) : '';
  const isLikelyInvalidReference = (digits: string, context: string): boolean => {
    if (digits.length < 8) return true;
    if (fechaDigits && digits.includes(fechaDigits)) return true;
    if (montoDigits && digits === montoDigits) return true;
    if (/(rif|c\.?i|identificacion|identificación)/i.test(context) && digits.length <= 10) return true;
    return false;
  };

  for (const label of REFERENCE_LABELS_PRIORITY) {
    const raw = findLabeledValue(lines, [label]);
    if (!raw) continue;
    const digits = cleanDigits(raw);
    if (!digits || isLikelyInvalidReference(digits, raw)) continue;
    return digits;
  }

  // Caso común Banesco: "N° de recibo" puede venir con variaciones OCR.
  for (let i = 0; i < lines.length; i += 1) {
    const normalized = normalizeText(lines[i]);
    if (!/recib/.test(normalized)) continue;

    const window = `${lines[i]} ${lines[i + 1] ?? ''} ${lines[i + 2] ?? ''}`;
    const candidates = window
      .match(/\d[\d\s.-]{6,}\d/g)
      ?.map((item) => cleanDigits(item))
      .filter((digits) => !isLikelyInvalidReference(digits, window))
      .sort((a, b) => b.length - a.length) ?? [];
    const best = candidates[0];

    if (best) return best;
  }

  // Fallback dirigido: busca número largo en líneas cercanas a etiquetas de referencia.
  for (let i = 0; i < lines.length; i += 1) {
    const normalized = normalizeText(lines[i]);
    if (!/(ref|referenc|operac|documento|confirmacion|recibo)/.test(normalized)) continue;

    const window = `${lines[i]} ${lines[i + 1] ?? ''} ${lines[i + 2] ?? ''}`;
    const candidate = window
      .match(/\d[\d\s.-]{5,}\d/g)
      ?.map((item) => cleanDigits(item))
      .find((digits) => !isLikelyInvalidReference(digits, window));
    if (!candidate) continue;
    return candidate;
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

  const amountCandidates: number[] = [];
  for (const line of lines) {
    const nLine = normalizeText(line);
    if (/comision|comisión|iva|impuesto|referenc|recibo|cuenta|codigo|codigo de cuenta|identificacion|identificación/.test(nLine)) continue;

    const amountLike =
      line.match(/(?:bs\.?|ves|\$)\s*\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})?/i)?.[0]
      ?? line.match(/\b\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})\b/i)?.[0]
      ?? line.match(/\b\d{4,}(?:,\d{2})\b/i)?.[0];
    if (!amountLike) continue;

    const parsed = parseMonto(amountLike);
    if (parsed !== null && parsed > 0) amountCandidates.push(parsed);
  }

  if (amountCandidates.length > 0) {
    return Math.max(...amountCandidates);
  }

  return null;
};

const inferIssuerFromPromptRules = (
  text: string,
  lines: string[],
  referencia: string | null,
): { banco: string | null; id: string | null; strategy: string } => {
  const headerText = getIssuerHeaderText(lines);
  const issuerEvidenceText = getStrongIssuerEvidenceText(lines);
  const strongIssuerText = `${headerText}\n${issuerEvidenceText}`;

  const originCandidate = findLabeledValue(lines, ['cuenta de origen', 'cuenta a debitar', 'debito']);
  if (originCandidate) {
    const digits = cleanDigits(originCandidate);
    const prefix4 = digits.slice(0, 4);
    const bank = BANK_CODE_MAP[prefix4];
    if (bank) {
      return { banco: bank.name, id: bank.id, strategy: 'origin_account_prefix' };
    }
  }

  if ((referencia && referencia.startsWith('00255')) || /listo/i.test(strongIssuerText)) {
    return { banco: 'Mercantil Banco', id: '105', strategy: 'mercantil_unique_pattern' };
  }

  if (/provincial|bbva/i.test(strongIssuerText)) {
    return { banco: 'Banco Provincial', id: '108', strategy: 'provincial_visual_pattern' };
  }

  const international = bankKeywords.find((entry) => entry.id === 'No Aplica' && entry.pattern.test(text));
  if (international) {
    return { banco: international.name, id: 'No Aplica', strategy: 'international_exception' };
  }

  const headerByName = bankKeywords.find((entry) => entry.id !== 'No Aplica' && entry.pattern.test(headerText));
  if (headerByName) {
    return { banco: headerByName.name, id: headerByName.id, strategy: 'header_top_lines_match' };
  }

  const localByName = bankKeywords.find(
    (entry) => entry.id !== 'No Aplica' && entry.pattern.test(strongIssuerText),
  );
  if (localByName) {
    return { banco: localByName.name, id: localByName.id, strategy: 'issuer_header_or_origin_evidence' };
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
  let rawText = '';
  let extractionConfidence = 0;
  let extractionNote = '';

  if (file.type === 'application/pdf') {
    const pdfExtraction = await extractTextFromPdf(file);
    rawText = pdfExtraction.text;
    extractionConfidence = pdfExtraction.confidence;
    extractionNote = pdfExtraction.note;
  } else if (file.type.startsWith('image/')) {
    const ocr = await runOcrBestPass(file);
    rawText = ocr.text ?? '';
    extractionConfidence = ocr.confidence;
    extractionNote = 'Extracción por OCR de imagen.';
  } else {
    return extractNullResult('', 'Formato no soportado para OCR local.');
  }

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
    notes: [
      extractionNote || 'Extracción local con OCR y reglas estrictas.',
      'Si un dato no es claro, se devuelve null.',
    ],
    confidence: extractionConfidence || 0.6,
    rawText,
    detectionStrategy: issuer.strategy,
  };
};
