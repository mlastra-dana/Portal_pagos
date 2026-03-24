import type { ValidationStatus } from '../../types/validation';
import { cn } from '../../lib/utils';

const styles: Record<ValidationStatus, string> = {
  APPROVED: 'bg-success/10 text-success border-success/30',
  OBSERVED: 'bg-warning/10 text-warning border-warning/30',
  REJECTED: 'bg-danger/10 text-danger border-danger/30',
};

const labels: Record<ValidationStatus, string> = {
  APPROVED: 'APROBADO',
  OBSERVED: 'OBSERVADO',
  REJECTED: 'RECHAZADO',
};

export const StatusBadge = ({ status }: { status: ValidationStatus }) => {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide', styles[status])}>
      {labels[status]}
    </span>
  );
};
