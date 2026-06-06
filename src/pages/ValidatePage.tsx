import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ExtractionDataCards, ValidationResultView } from '../components/result/ValidationResultView';
import { FilePreviewCard } from '../components/ui/FilePreviewCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionTitle } from '../components/ui/SectionTitle';
import { StatusBadge } from '../components/ui/StatusBadge';
import { UploadDropzone } from '../components/ui/UploadDropzone';
import { useFileUpload } from '../hooks/useFileUpload';
import { validateReceipt } from '../lib/api';
import { formatDueDate, formatMoney, validatePaymentAgainstInvoice } from '../lib/invoiceValidation';
import type { DemoCustomer, PendingInvoice } from '../types/invoice';
import type { ValidationResult } from '../types/validation';

interface LocationState {
  customer?: DemoCustomer;
  invoice?: PendingInvoice;
}

const formatProcessedAt = (value: string): string =>
  new Date(value).toLocaleString('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export const ValidatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { uploadedFile, isImage, error, setFile, clearFile } = useFileUpload();
  const state = (location.state ?? {}) as LocationState;
  const customer = state.customer;
  const invoice = state.invoice;

  const [isAutoExtracting, setIsAutoExtracting] = useState(false);
  const [formError, setFormError] = useState('');
  const [technicalError, setTechnicalError] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const extractionRunIdRef = useRef(0);

  const handleClearAll = () => {
    extractionRunIdRef.current += 1;
    clearFile();
    setIsAutoExtracting(false);
    setResult(null);
    setFormError('');
    setTechnicalError('');
  };

  useEffect(() => {
    if (!uploadedFile) {
      setIsAutoExtracting(false);
      setFormError('');
      setTechnicalError('');
      setResult(null);
      return;
    }

    let isCancelled = false;
    const runId = extractionRunIdRef.current + 1;
    extractionRunIdRef.current = runId;
    const isStaleRun = () => isCancelled || extractionRunIdRef.current !== runId;

    const runAutoExtraction = async () => {
      setResult(null);
      setIsAutoExtracting(true);
      setFormError('');
      setTechnicalError('');

      try {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 0);
        });
        if (isStaleRun()) return;

        const autoResult = await validateReceipt(uploadedFile.file);
        if (isStaleRun()) return;

        setResult(autoResult);
      } catch (autoError) {
        if (isStaleRun()) return;
        setFormError('No fue posible extraer datos al cargar el comprobante.');
        setTechnicalError(autoError instanceof Error ? autoError.message : 'Error inesperado en la extracción.');
      } finally {
        if (!isStaleRun()) {
          setIsAutoExtracting(false);
        }
      }
    };

    runAutoExtraction();

    return () => {
      isCancelled = true;
    };
  }, [uploadedFile]);

  if (!customer || !invoice) {
    return <Navigate to="/" replace />;
  }

  const paymentMatch = validatePaymentAgainstInvoice(invoice, result);
  const isInvalidPaymentDocument = result ? isInvalidPaymentDocumentResult(result) : false;
  const displayResult =
    result && !isInvalidPaymentDocument && paymentMatch?.status === 'MISMATCH'
      ? buildInvoiceMismatchResult(result, paymentMatch)
      : result;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    setTechnicalError('');

    if (!uploadedFile) {
      setFormError('Debe cargar un comprobante para iniciar la validación.');
      return;
    }

    if (!result) {
      setFormError('Primero debe finalizar la extracción del comprobante.');
      return;
    }

    navigate('/documentos-complementarios', {
      state: {
        extraction: result,
        customer,
        invoice,
        paymentMatch,
        comprobante: {
          name: uploadedFile.name,
          size: uploadedFile.size,
          type: uploadedFile.type,
        },
      },
    });
  };

  const isContinueDisabled =
    !uploadedFile
    || !result
    || (result.missingRequiredFields?.length ?? 0) > 0
    || result.status === 'REJECTED'
    || paymentMatch?.hasRequiredExtractionFields === false
    || paymentMatch?.status === 'MISMATCH'
    || isAutoExtracting;

  return (
    <div className="w-full space-y-5">
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-panel">
        <form onSubmit={handleSubmit} className="px-5 py-6 md:px-7">
          <SectionTitle
            eyebrow="Example Company"
            title="Validar pago"
            description="Cargue el comprobante para validar el pago."
          />

          <div className="mt-4">
            <Link to="/facturas" state={{ customer }} className="inline-flex">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-brand-500 transition hover:bg-brand-50"
              >
                Volver a facturas
              </button>
            </Link>
          </div>

          <InvoiceSummary invoice={invoice} customer={customer} />

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="space-y-3 rounded-lg border border-border bg-white p-3 shadow-soft">
              {!uploadedFile ? <UploadDropzone onFileSelected={setFile} error={error} /> : null}

              {uploadedFile ? <FilePreviewCard uploadedFile={uploadedFile} isImage={isImage} onRemove={handleClearAll} /> : null}

              {!isAutoExtracting && result && !isInvalidPaymentDocument ? <ExtractionDataCards result={result} /> : null}
            </section>

            <section className="flex min-h-full flex-col rounded-lg border border-border bg-white p-3 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-brand-800">Resultado</p>
                {displayResult ? (
                  <p className="text-xs text-muted">Procesado: {formatProcessedAt(displayResult.processedAt)}</p>
                ) : null}
              </div>

              {formError ? <p className="mt-4 text-sm font-medium text-danger">{formError}</p> : null}
              {technicalError ? <p className="mt-1 text-xs text-muted">Detalle técnico: {technicalError}</p> : null}

              {isAutoExtracting ? (
                <InlineProcessingState
                  title="Extrayendo datos del comprobante"
                  message="Procesando archivo recién cargado..."
                />
              ) : null}

              {!isAutoExtracting && result ? (
                <div className="mt-4">
                  {paymentMatch ? (
                    isInvalidPaymentDocument ? (
                      <InvalidPaymentDocumentPanel status={(displayResult ?? result).status} />
                    ) : (
                      <PaymentMatchPanel
                        invoice={invoice}
                        match={paymentMatch}
                        status={(displayResult ?? result).status}
                      />
                    )
                  ) : null}
                  <ValidationResultView
                    result={displayResult ?? result}
                    showDataSection={false}
                    showStatusSection={false}
                    showDetailsSection={!isInvalidPaymentDocument}
                  />
                </div>
              ) : null}

              <div className="mt-auto pt-4">
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton
                    type="submit"
                    disabled={isContinueDisabled}
                    className="w-full py-2.5 text-sm"
                  >
                    Continuar
                  </PrimaryButton>
                </div>
              </div>
            </section>
          </div>
        </form>
      </div>

    </div>
  );
};

const INVALID_PAYMENT_DOCUMENT_MESSAGE = 'Esto no parece un comprobante de pago. Adjunte un comprobante de pago válido.';

const isInvalidPaymentDocumentResult = (result: ValidationResult): boolean => {
  const detectedAmount = result.fields.amount ?? result.fields.montoIA ?? null;
  const detectedCurrency = result.fields.currency ?? null;
  const detectedDate = result.fields.transactionDate ?? result.fields.fechaIA ?? null;
  const detectedReference =
    result.fields.reference
    ?? result.fields.CompletereferenciaIA
    ?? result.fields.operationNumber
    ?? result.fields.rawReferenceIA
    ?? null;
  const detectedRecipientAccount = result.fields.recipientAccount ?? result.fields.CuentaBancariaIA ?? null;

  return result.status === 'REJECTED'
    && detectedAmount === null
    && !detectedCurrency
    && !detectedDate
    && !detectedReference
    && !detectedRecipientAccount;
};

const InvoiceSummary = ({ invoice, customer }: { invoice: PendingInvoice; customer: DemoCustomer }) => (
  <section className="mt-5 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Factura seleccionada</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-lg font-bold leading-tight text-text">{invoice.title}</h2>
          <p className="text-sm text-muted">{invoice.provider} · Cliente {customer.cedula}</p>
        </div>
      </div>
      <dl className="grid gap-2 sm:grid-cols-3 lg:min-w-[560px]">
        <SummaryPill label="Factura" value={invoice.invoiceNumber} />
        <SummaryPill label="Vence" value={formatDueDate(invoice.dueDate)} strong />
        <SummaryPill label="Monto" value={formatMoney(invoice.amount, invoice.currency)} strong accent />
      </dl>
    </div>
  </section>
);

const SummaryPill = ({
  label,
  value,
  strong = false,
  accent = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) => (
  <div className="rounded-md border border-brand-100 bg-white px-3 py-2">
    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
    <dd className={accent ? 'mt-0.5 text-sm font-bold text-brand-700' : strong ? 'mt-0.5 text-sm font-bold text-text' : 'mt-0.5 text-sm font-medium text-text'}>
      {value}
    </dd>
  </div>
);

const PaymentMatchPanel = ({
  invoice,
  match,
  status,
}: {
  invoice: PendingInvoice;
  match: NonNullable<ReturnType<typeof validatePaymentAgainstInvoice>>;
  status: ValidationResult['status'];
}) => {
  const statusCopy = {
    MATCH: {
      title: 'Pago validado',
      className: 'border-success/30 bg-success/5 text-success',
    },
    MISMATCH: {
      title: match.hasRequiredExtractionFields
        ? 'Pago no coincide con la factura'
        : 'No se pudo validar el pago',
      className: 'border-danger/30 bg-danger/5 text-danger',
    },
  }[match.status];

  return (
    <section className={`mb-4 rounded-lg border p-4 ${statusCopy.className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold">{statusCopy.title}</p>
        <StatusBadge status={status} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ComparisonRow
          label="Monto"
          expected={formatMoney(invoice.amount, invoice.currency)}
          detected={match.detectedAmount !== null ? formatMoney(match.detectedAmount, invoice.currency) : 'No detectado'}
          matches={match.amountMatches}
        />
        <ComparisonRow
          label="Moneda"
          expected={invoice.currency}
          detected={match.detectedCurrency ?? 'No detectado'}
          matches={match.currencyMatches}
        />
      </div>
    </section>
  );
};

const InvalidPaymentDocumentPanel = ({ status }: { status: ValidationResult['status'] }) => (
  <section className="mb-4 rounded-lg border border-danger/30 bg-danger/5 p-4 text-danger">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-bold">Documento no válido</p>
        <p className="mt-2 text-sm font-medium">{INVALID_PAYMENT_DOCUMENT_MESSAGE}</p>
      </div>
      <StatusBadge status={status} />
    </div>
  </section>
);

const buildInvoiceMismatchResult = (
  result: ValidationResult,
  match: NonNullable<ReturnType<typeof validatePaymentAgainstInvoice>>,
): ValidationResult => {
  const mismatchIssues = match.issues.length > 0
    ? match.issues
    : ['El comprobante no coincide con la factura seleccionada.'];

  return {
    ...result,
    status: 'REJECTED',
    summary: match.hasRequiredExtractionFields
      ? 'El comprobante no corresponde a la factura seleccionada.'
      : 'Faltan datos obligatorios para validar el pago.',
    issues: [...mismatchIssues, ...result.issues],
  };
};

const ComparisonRow = ({
  label,
  expected,
  detected,
  matches,
}: {
  label: string;
  expected: string;
  detected: string;
  matches: boolean;
}) => (
  <div className="rounded-md border border-white/60 bg-white px-3 py-2 text-text">
    <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
    <p className="mt-1 text-sm font-semibold">Esperado: {expected}</p>
    <p className="text-sm font-semibold">Detectado: {detected}</p>
    <p className={matches ? 'mt-1 text-xs font-bold text-success' : 'mt-1 text-xs font-bold text-danger'}>
      {matches ? 'Coincide' : 'No coincide'}
    </p>
  </div>
);

const InlineProcessingState = ({ title, message }: { title: string; message: string }) => (
  <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      <div>
        <p className="text-sm font-semibold text-brand-800">{title}</p>
        <p className="text-xs text-muted">{message}</p>
      </div>
    </div>
  </div>
);
